/**
 * Indexer Phase A (SPECS.md §3.1): read seed.csv → fetch each mint on-chain →
 * parse authority + lamports → compute excess → upsert into Supabase.
 * Idempotent (upserts only) and resumable (re-running just re-scans).
 *
 * Usage: npx tsx scripts/indexer.ts [path/to/seed.csv]
 */
import { readFileSync } from 'node:fs';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createClient } from '@supabase/supabase-js';
import { MINT_SIZE, parseMintAccount } from '../lib/mintParser';
import { createConnection } from '../lib/solana';

process.loadEnvFile('.env.local');

const BATCH_SIZE = 100; // getMultipleAccounts limit per SPECS.md
const ENRICH_THRESHOLD = 1_000_000_000n; // metadata only for excess ≥ 1 SOL
const MAX_RETRIES = 5;

interface MintRow {
  mint_address: string;
  authority: string | null;
  authority_revoked: boolean;
  lamports: number;
  excess_lamports: number;
  token_name?: string | null;
  token_symbol?: string | null;
  metadata_uri?: string | null;
  last_scanned: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — see .env.example`);
  return value;
}

function readSeedAddresses(path: string): PublicKey[] {
  const seen = new Set<string>();
  const keys: PublicKey[] = [];
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    // First CSV column; tolerate headers and junk rows by skipping non-keys.
    const candidate = line.split(',')[0].trim().replace(/^"|"$/g, '');
    if (!candidate || seen.has(candidate)) continue;
    try {
      keys.push(new PublicKey(candidate));
      seen.add(candidate);
    } catch {
      console.warn(`skipping non-address row: ${candidate.slice(0, 44)}`);
    }
  }
  return keys;
}

async function withBackoff<T>(label: string, fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryable = message.includes('429') || message.includes('Too Many');
      if (!retryable || attempt >= MAX_RETRIES) throw error;
      const delayMs = 1_000 * 2 ** attempt;
      console.warn(`${label}: rate limited, retrying in ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function fetchMetadata(
  rpcUrl: string,
  mint: string,
): Promise<{ name: string | null; symbol: string | null; uri: string | null }> {
  // Helius DAS getAsset — best-effort; any failure leaves fields null.
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'solrescue',
        method: 'getAsset',
        params: { id: mint },
      }),
    });
    const { result } = await response.json();
    return {
      name: result?.content?.metadata?.name ?? null,
      symbol: result?.content?.metadata?.symbol ?? null,
      uri: result?.content?.json_uri ?? null,
    };
  } catch {
    return { name: null, symbol: null, uri: null };
  }
}

async function scanBatch(
  connection: Connection,
  batch: PublicKey[],
  rentMinimum: bigint,
): Promise<MintRow[]> {
  const accounts = await withBackoff('getMultipleAccounts', () =>
    connection.getMultipleAccountsInfo(batch),
  );
  const rows: MintRow[] = [];
  for (const [i, info] of accounts.entries()) {
    const address = batch[i].toBase58();
    if (!info || !info.owner.equals(TOKEN_PROGRAM_ID) || info.data.length !== MINT_SIZE) {
      console.warn(`skipping ${address}: not a legacy mint account`);
      continue;
    }
    let parsed;
    try {
      parsed = parseMintAccount(info.data);
    } catch {
      console.warn(`skipping ${address}: unparseable mint data`);
      continue;
    }
    const excess = BigInt(info.lamports) - rentMinimum;
    rows.push({
      mint_address: address,
      authority: parsed.mintAuthority?.toBase58() ?? null,
      authority_revoked: parsed.mintAuthority === null,
      lamports: info.lamports,
      excess_lamports: Number(excess > 0n ? excess : 0n),
      last_scanned: new Date().toISOString(),
    });
  }
  return rows;
}

async function main() {
  const seedPath = process.argv[2] ?? 'seed.csv';
  const rpcUrl = requireEnv('NEXT_PUBLIC_RPC_URL');
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );
  const connection = createConnection();

  const addresses = readSeedAddresses(seedPath);
  console.log(`seed: ${addresses.length} unique addresses from ${seedPath}`);
  const rentMinimum = BigInt(
    await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
  );

  let upserted = 0;
  for (let offset = 0; offset < addresses.length; offset += BATCH_SIZE) {
    const rows = await scanBatch(
      connection,
      addresses.slice(offset, offset + BATCH_SIZE),
      rentMinimum,
    );

    for (const row of rows) {
      if (BigInt(row.excess_lamports) >= ENRICH_THRESHOLD) {
        const meta = await fetchMetadata(rpcUrl, row.mint_address);
        row.token_name = meta.name;
        row.token_symbol = meta.symbol;
        row.metadata_uri = meta.uri;
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from('mints')
        .upsert(rows, { onConflict: 'mint_address' });
      if (error) throw new Error(`supabase upsert failed: ${error.message}`);
      upserted += rows.length;
    }
    console.log(
      `progress: ${Math.min(offset + BATCH_SIZE, addresses.length)}/${addresses.length} scanned, ${upserted} upserted`,
    );
  }
  console.log(`done: ${upserted} mints upserted`);
}

main().catch((error) => {
  console.error('indexer failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
