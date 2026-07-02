/**
 * Export the outreach lead list: top mints by claimable excess with an
 * active authority, as a CSV ready for a spreadsheet. NOT committed to git —
 * this is the business pipeline, the repo is public.
 *
 * Usage: npx tsx scripts/export-leads.ts [count]   (default 100)
 */
import { writeFileSync } from 'node:fs';
import { PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile('.env.local');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — see .env.example`);
  return value;
}

function csvField(value: string | number | null): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const count = Number(process.argv[2] ?? 100);
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  // Authorities nobody can sign for — the SOL is stuck despite the tag.
  const UNSIGNABLE = [
    '11111111111111111111111111111111', // system program
    '1nc1nerator11111111111111111111111111111111',
  ];

  const { data: rows, error } = await supabase
    .from('mints')
    .select('mint_address, authority, excess_lamports, token_name, token_symbol, metadata_uri')
    .eq('authority_revoked', false)
    .gt('excess_lamports', 0)
    .not('authority', 'in', `(${UNSIGNABLE.join(',')})`)
    .order('excess_lamports', { ascending: false })
    .limit(count);
  if (error) throw new Error(`query failed: ${error.message}`);

  const header = [
    'rank',
    'claimable_sol',
    'token_name',
    'token_symbol',
    'mint_address',
    'authority',
    'authority_type',
    'mint_solscan',
    'authority_solscan',
    'metadata_uri',
    'project_twitter',
    'project_telegram',
    'project_website',
    'outreach_status',
    'notes',
  ].join(',');

  const lines = (rows ?? []).map((row, i) =>
    [
      i + 1,
      (row.excess_lamports / 1e9).toFixed(4),
      csvField(row.token_name),
      csvField(row.token_symbol),
      row.mint_address,
      row.authority,
      PublicKey.isOnCurve(new PublicKey(row.authority).toBytes())
        ? 'wallet'
        : 'pda',
      `https://solscan.io/account/${row.mint_address}`,
      `https://solscan.io/account/${row.authority}`,
      csvField(row.metadata_uri),
      '', // project_twitter — fill during research
      '', // project_telegram
      '', // project_website
      'not_contacted',
      '',
    ].join(','),
  );

  // BOM so Excel opens it as UTF-8 without mangling.
  writeFileSync('leads.csv', '﻿' + [header, ...lines].join('\n'), 'utf8');
  console.log(`leads.csv written: ${lines.length} rows`);
  const total = (rows ?? []).reduce((sum, r) => sum + r.excess_lamports, 0);
  console.log(
    `total claimable in list: ${(total / 1e9).toFixed(1)} SOL · potential fees: ${(total / 1e10).toFixed(1)} SOL`,
  );
}

main().catch((error) => {
  console.error('export failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
