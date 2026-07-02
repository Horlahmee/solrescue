-- SolRescue schema (SPECS.md §3.1). Applied via Supabase migration.

create table if not exists mints (
  mint_address text primary key,
  authority text,                    -- null if revoked
  authority_revoked boolean not null default false,
  lamports bigint not null,
  excess_lamports bigint not null,
  token_name text,
  token_symbol text,
  metadata_uri text,
  last_scanned timestamptz not null default now()
);
create index if not exists idx_mints_authority on mints (authority);
create index if not exists idx_mints_excess on mints (excess_lamports desc);

create table if not exists indexer_state (
  id int primary key default 1,
  cursor text,
  updated_at timestamptz default now()
);

create table if not exists recoveries (  -- social proof + analytics
  tx_signature text primary key,
  mint_address text not null,
  recovered_lamports bigint not null,
  fee_lamports bigint not null,
  created_at timestamptz default now()
);

-- RLS: anon may read mints + recoveries; nothing else. Writes go through the
-- service role only (indexer + /api/recovery-logged), which bypasses RLS.
alter table mints enable row level security;
alter table recoveries enable row level security;
alter table indexer_state enable row level security;

drop policy if exists "anon read mints" on mints;
create policy "anon read mints" on mints for select using (true);

drop policy if exists "anon read recoveries" on recoveries;
create policy "anon read recoveries" on recoveries for select using (true);
