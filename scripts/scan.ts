/**
 * Indexer Phase B (SPECS.md §3.1): self-index every legacy token-program mint
 * with recoverable excess, straight into Supabase. Replaces the manual seed
 * CSV when none is available.
 *
 * READ-ONLY against mainnet: paginates getProgramAccountsV2 (dataSize 82,
 * dataSlice 0..36 = authority COption tag + pubkey), keeps accounts with
 * lamports > rentMin + dust threshold, upserts. Resumable: the pagination
 * cursor is persisted to indexer_state after every page, so re-running
 * continues where it left off.
 *
 * Usage: npm run scan
 */
import { PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { withBackoff } from './lib/backoff';

process.loadEnvFile('.env.local');

const PAGE_LIMIT = 10_000;
const RENT_MINIMUM = 1_461_600n; // rent-exempt floor for 82 bytes
const DUST_THRESHOLD = BigInt(process.env.DUST_THRESHOLD ?? 50_000_000); // 0.05 SOL
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

interface PagedAccount {
  pubkey: string;
  account: { lamports: number; data: [string, string] };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — see .env.example`);
  return value;
}

// The scan always reads mainnet (stuck mints live there) regardless of the
// app cluster. Reads only — no transaction is ever built or sent here.
function mainnetRpcUrl(): string {
  return `https://mainnet.helius-rpc.com/?api-key=${requireEnv('HELIUS_API_KEY')}`;
}

async function fetchPage(
  rpcUrl: string,
  paginationKey: string | null,
): Promise<{ accounts: PagedAccount[]; paginationKey: string | null }> {
  return withBackoff('getProgramAccountsV2', async () => {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'solrescue-scan',
        method: 'getProgramAccountsV2',
        params: [
          TOKEN_PROGRAM,
          {
            encoding: 'base64',
            limit: PAGE_LIMIT,
            filters: [{ dataSize: 82 }],
            dataSlice: { offset: 0, length: 36 },
            ...(paginationKey ? { paginationKey } : {}),
          },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`RPC ${response.status} ${await response.text()}`);
    }
    const body = await response.json();
    if (body.error) {
      throw new Error(`RPC error: ${JSON.stringify(body.error)}`);
    }
    return {
      accounts: body.result.accounts ?? [],
      paginationKey: body.result.paginationKey ?? null,
    };
  });
}

function toRow(entry: PagedAccount) {
  const slice = Buffer.from(entry.account.data[0], 'base64');
  if (slice.length !== 36) return null;
  const tag = slice.readUInt32LE(0);
  if (tag !== 0 && tag !== 1) return null;
  const authority =
    tag === 1 ? new PublicKey(slice.subarray(4, 36)).toBase58() : null;
  return {
    mint_address: entry.pubkey,
    authority,
    authority_revoked: tag === 0,
    lamports: entry.account.lamports,
    excess_lamports: entry.account.lamports - Number(RENT_MINIMUM),
    last_scanned: new Date().toISOString(),
  };
}

async function main() {
  const rpcUrl = mainnetRpcUrl();
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );
  console.log(
    `Phase B scan: mainnet (read-only), dust threshold ${DUST_THRESHOLD} lamports`,
  );

  const { data: state } = await supabase
    .from('indexer_state')
    .select('cursor')
    .eq('id', 1)
    .maybeSingle();
  let cursor: string | null = state?.cursor ?? null;
  if (cursor) console.log(`resuming from persisted cursor`);

  let pages = 0;
  let scanned = 0;
  let kept = 0;
  const keepAbove = RENT_MINIMUM + DUST_THRESHOLD;

  do {
    const page = await fetchPage(rpcUrl, cursor);
    pages++;
    scanned += page.accounts.length;

    const rows = page.accounts
      .filter((entry) => BigInt(entry.account.lamports) > keepAbove)
      .map(toRow)
      .filter((row) => row !== null);

    if (rows.length > 0) {
      const { error } = await supabase
        .from('mints')
        .upsert(rows, { onConflict: 'mint_address' });
      if (error) throw new Error(`supabase upsert failed: ${error.message}`);
      kept += rows.length;
    }

    cursor = page.paginationKey;
    const { error: stateError } = await supabase
      .from('indexer_state')
      .upsert({ id: 1, cursor, updated_at: new Date().toISOString() });
    if (stateError) {
      throw new Error(`cursor persist failed: ${stateError.message}`);
    }

    if (pages % 10 === 0 || cursor === null) {
      console.log(
        `page ${pages}: ${scanned.toLocaleString()} scanned, ${kept.toLocaleString()} kept`,
      );
    }
  } while (cursor !== null);

  console.log(
    `SCAN COMPLETE: ${scanned.toLocaleString()} mints scanned, ${kept.toLocaleString()} with excess > dust threshold`,
  );
}

main().catch((error) => {
  console.error('scan failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
