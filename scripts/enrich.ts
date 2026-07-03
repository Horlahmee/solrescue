/**
 * Metadata enrichment (SPECS.md §3.1): fill token_name/symbol/uri for mints
 * with excess ≥ 1 SOL via Helius getAsset. Best-effort — failures leave
 * fields null. Idempotent: only touches rows where token_name is null.
 *
 * Usage: npx tsx scripts/enrich.ts
 */
import { createClient } from '@supabase/supabase-js';
import { withBackoff } from './lib/backoff';
import { heliusFetch } from './lib/heliusFetch';

process.loadEnvFile('.env.local');

const ENRICH_THRESHOLD = 1_000_000_000; // 1 SOL
const CONCURRENCY = 8;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — see .env.example`);
  return value;
}

interface AssetMeta {
  name: string | null;
  symbol: string | null;
  uri: string | null;
}

async function fetchMetadata(rpcUrl: string, mint: string): Promise<AssetMeta> {
  try {
    const response = await withBackoff(`getAsset ${mint.slice(0, 4)}`, () =>
      heliusFetch(rpcUrl, {
        jsonrpc: '2.0',
        id: 'solrescue-enrich',
        method: 'getAsset',
        params: { id: mint },
      }),
    );
    const { result } = await response.json();
    return {
      name: result?.content?.metadata?.name?.trim() || null,
      symbol: result?.content?.metadata?.symbol?.trim() || null,
      uri: result?.content?.json_uri || null,
    };
  } catch {
    return { name: null, symbol: null, uri: null };
  }
}

async function main() {
  const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${requireEnv('HELIUS_API_KEY')}`;
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  const { data: rows, error } = await supabase
    .from('mints')
    .select('mint_address')
    .is('token_name', null)
    .eq('authority_revoked', false)
    .gte('excess_lamports', ENRICH_THRESHOLD)
    .order('excess_lamports', { ascending: false });
  if (error) throw new Error(`query failed: ${error.message}`);
  if (!rows || rows.length === 0) {
    console.log('nothing to enrich');
    return;
  }
  console.log(`enriching ${rows.length} mints (excess ≥ 1 SOL, no metadata)`);

  let enriched = 0;
  let bare = 0;
  for (let offset = 0; offset < rows.length; offset += CONCURRENCY) {
    const batch = rows.slice(offset, offset + CONCURRENCY);
    const metas = await Promise.all(
      batch.map((row) => fetchMetadata(rpcUrl, row.mint_address)),
    );
    for (const [i, meta] of metas.entries()) {
      if (!meta.name && !meta.symbol) {
        bare++;
        continue;
      }
      const { error: updateError } = await supabase
        .from('mints')
        .update({
          token_name: meta.name,
          token_symbol: meta.symbol,
          metadata_uri: meta.uri,
        })
        .eq('mint_address', batch[i].mint_address);
      if (updateError) {
        console.warn(`update failed for ${batch[i].mint_address}: ${updateError.message}`);
      } else {
        enriched++;
      }
    }
    if ((offset / CONCURRENCY) % 10 === 0) {
      console.log(`progress: ${Math.min(offset + CONCURRENCY, rows.length)}/${rows.length}`);
    }
  }
  console.log(`done: ${enriched} enriched, ${bare} without metadata`);
}

main().catch((error) => {
  console.error('enrich failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
