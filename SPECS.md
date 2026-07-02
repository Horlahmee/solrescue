# SolRescue — SPECS.md

**Product:** Non-custodial recovery tool for SOL stranded in Solana mint accounts, enabled by the p-token upgrade (SIMD-0266, live on mainnet at epoch 971).

**One-liner:** Connect your wallet. If you're the mint authority of a token with stuck SOL, recover it in one click. 10% fee, taken atomically in the same transaction. Keys never leave your wallet.

**Positioning:** The trustworthy, open-source alternative in a niche primed for drainer paranoia. All signing happens client-side via wallet adapter. The repo is public from commit one.

**Timeline:** Weekend MVP. Ship over polish. Anything not in this spec is out of scope for v1.

---

## 1. Background (context for the builder — do not skip)

- Mint accounts on Solana hold token configuration. People mistakenly send SOL to mint addresses; historically that SOL was permanently stuck.
- SIMD-0266 (p-token) replaced the SPL Token program at the **same program ID** (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`) and added `withdraw_excess_lamports` (**instruction discriminator 38**).
- Recovery authorization:
  - **Mint authority is set** → the authority wallet signs. This is our entire v1 market.
  - **Mint authority revoked** → only the mint account's own private keypair can sign. OUT OF SCOPE for v1 (we never accept keypairs).
- Recoverable amount = `account.lamports − rentExemptMinimum(82 bytes)` (~1,461,600 lamports ≈ 0.00146 SOL).
- Token-2022 already had `WithdrawExcessLamports` at the same discriminator (38), so `@solana/spl-token`'s `createWithdrawExcessLamportsInstruction` is expected to work against the legacy program by passing `TOKEN_PROGRAM_ID` as the program ID. **This must be verified in Milestone 0 before building on it.** Fallback: construct the instruction manually — data = single byte `38`; accounts = `[mint (writable), destination (writable), authority (signer)]`.

## 2. Locked stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- Supabase (Postgres) — data layer only, no auth in v1
- `@solana/web3.js`, `@solana/spl-token`, `@solana/wallet-adapter-react` (+ react-ui, Phantom & Solflare adapters)
- Helius RPC (env-switchable devnet/mainnet)
- Vercel deploy → `solrescue.techgeniehq.com`
- Public GitHub repo, MIT license

## 3. Architecture

Three components. Build in this order.

### 3.1 Indexer (`/scripts/indexer.ts` — Node script, not part of the web app)

Purpose: populate Supabase with every mint that has recoverable excess. Powers both the app lookup and the outreach lead list.

**Phase A — Bootstrap (do this first, same day):**
- Ingest a seed list of high-value stuck mints (CSV of mint addresses; source: the public Dune dashboard referenced in the wild — a CSV export will be provided manually, script just reads `seed.csv`).
- For each mint: `getMultipleAccounts` (batches of 100) → parse lamports + authority → compute excess → upsert.

**Phase B — Full self-index (can run overnight, not a launch blocker):**
- Paginate all token-program accounts with `dataSize: 82` filter using Helius `getProgramAccountsV2` (cursor-based). Use `dataSlice: { offset: 0, length: 36 }` — that slice contains the mint-authority COption tag (bytes 0–3) and authority pubkey (bytes 4–35). Lamports come back regardless of slice.
- Client-side filter: `lamports > rentExempt + DUST_THRESHOLD` (default dust threshold: 0.05 SOL = 50,000,000 lamports).
- Rate-limit respectfully; make the script resumable (persist cursor to Supabase `indexer_state` table).

**Mint account layout reference (legacy token program, 82 bytes):**
| Field | Offset | Size |
|---|---|---|
| mint_authority COption tag | 0 | 4 (u32 LE: 0 = None, 1 = Some) |
| mint_authority pubkey | 4 | 32 |
| supply | 36 | 8 |
| decimals | 44 | 1 |
| is_initialized | 45 | 1 |
| freeze_authority COption | 46 | 4 + 32 |

**Supabase schema:**

```sql
create table mints (
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
create index idx_mints_authority on mints (authority);
create index idx_mints_excess on mints (excess_lamports desc);

create table indexer_state (
  id int primary key default 1,
  cursor text,
  updated_at timestamptz default now()
);

create table recoveries (            -- social proof + analytics
  tx_signature text primary key,
  mint_address text not null,
  recovered_lamports bigint not null,
  fee_lamports bigint not null,
  created_at timestamptz default now()
);
```

- Metadata enrichment (name/symbol/uri) via Helius `getAsset`, best-effort, only for rows with excess ≥ 1 SOL. Failures are non-fatal; leave fields null.
- App reads Supabase via the anon key with RLS: `mints` and `recoveries` readable by anon, writable only by service role (indexer + API route).

### 3.2 Transaction builder (`/lib/recovery.ts` — the actual product)

```
buildRecoveryTx(connection, mint: PublicKey, authorityWallet: PublicKey, feeWallet: PublicKey, feeBps: number): Promise<{ tx: VersionedTransaction, excess: bigint, fee: bigint, net: bigint }>
```

Logic:
1. Fetch mint account fresh from RPC (never trust the DB for the send — DB is discovery only). Confirm: owner is `TOKEN_PROGRAM_ID`, data length 82, authority tag = Some, authority equals `authorityWallet`. Any mismatch → typed error, human-readable message.
2. `excess = lamports − getMinimumBalanceForRentExemption(82)`. If `excess <= 0` → error.
3. `fee = excess * feeBps / 10_000` (FEE_BPS env, default 1000 = 10%). `net = excess − fee`.
4. Instruction 1: `withdraw_excess_lamports` — mint → **destination = authorityWallet** (full excess goes to the user; we never route user funds through our wallet).
5. Instruction 2: `SystemProgram.transfer` — authorityWallet → feeWallet, amount = `fee`. Atomic: both land or neither.
6. Return the unsigned transaction plus the numbers for display.

Before presenting the sign button, run `connection.simulateTransaction` and surface exact figures: "You receive X SOL · Fee Y SOL". Simulation failure → show the program error, block the button.

**Hard rules:** the app never generates, accepts, stores, or transmits private keys or seed phrases. Fee wallet appears in code as a public key env var only. All signing goes through the wallet adapter.

### 3.3 Web app (one page + one API route)

**`/` (single page, three states):**

1. **Disconnected:** headline, how-it-works (3 steps), live stats bar (total recoverable indexed, total recovered — from Supabase), "Connect Wallet", link to GitHub repo, link to the SIMD-0266 proposal. Manual checker (works without connecting): paste any mint address → shows status: `Recoverable by <authority short addr> — X SOL` / `Authority revoked — recovery requires the original mint keypair (we can't help with this, and don't trust anyone who asks you to paste it)` / `No excess`.
2. **Connected, mints found:** query Supabase `mints where authority = pubkey and excess_lamports > 0`, PLUS a direct RPC check of any mint the user pastes manually (covers gaps in the index). Card per mint: name/symbol (fallback: short address), recoverable SOL, net-after-fee, "Recover" button.
3. **Post-recovery:** success screen — amount recovered, fee, Solscan tx link, share-on-X button with prefilled text. POST the signature to `/api/recovery-logged` (API route verifies the tx on-chain via RPC before inserting into `recoveries` — never trust client-reported numbers).

**Design:** TechGenie system — electric teal `#00E5C3`, amber `#F5A623`, dark background, Syne (display) / DM Sans (body) / JetBrains Mono (addresses & numbers). Every SOL figure in mono. Serious, minimal, zero memecoin aesthetics — the design *is* the trust signal.

**Env vars:**
```
HELIUS_API_KEY=
NEXT_PUBLIC_RPC_URL=            # full Helius URL, devnet or mainnet
NEXT_PUBLIC_CLUSTER=devnet|mainnet-beta
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only: indexer + API route
NEXT_PUBLIC_FEE_WALLET=
FEE_BPS=1000
```

## 4. Milestones (in order, each gated on the last)

**M0 — Instruction verification (2 hrs, blocks everything):**
On devnet: create a legacy-program mint (keep authority), transfer 0.5 SOL to the mint address, attempt recovery via `createWithdrawExcessLamportsInstruction(..., TOKEN_PROGRAM_ID)`. If the helper rejects the legacy program ID or the instruction fails, fall back to manual instruction construction (discriminator 38) and retest. If devnet's token program predates the feature gate, validate the UX flow against a Token-2022 mint instead, and verify mainnet support by **simulating** (never sending) a withdraw against a known stuck mainnet mint. Record which path worked in CLAUDE.md progress notes.

**M1 — Indexer Phase A:** seed CSV → Supabase populated, top-50 list by excess visible via SQL.

**M2 — Recovery flow on devnet:** full happy path — connect, detect, simulate, sign, confirm, success screen. Screen-record it (this recording is the outreach asset).

**M3 — UI polish + manual checker + stats bar.**

**M4 — Mainnet deploy:** flip env to mainnet, deploy to Vercel, open-source the repo, run one real recovery (own test mint on mainnet: create mint, send 0.1 SOL, recover) to produce a mainnet proof tx.

**M5 (post-launch, separate effort):** Indexer Phase B full sweep; outreach pipeline (separate spec).

## 5. Out of scope for v1

- Revoked-authority / mint-keypair recovery (never; core trust position)
- Multisig authorities (detect and show "multisig — contact us", nothing more)
- Token-2022 mints (different rent math due to extensions; v2)
- User accounts, auth, dashboards
- Mobile-specific wallet deep links (desktop-first)

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| spl-token helper doesn't target legacy program | M0 gate; manual instruction fallback documented above |
| Devnet feature-gate mismatch | Token-2022 UX validation + mainnet simulation path in M0 |
| Stale index (already-recovered mints shown) | Always re-fetch on-chain before building tx; indexer re-scan cron |
| Copycat tools | Speed + open-source trust + outreach machine (the tool is half the play) |
| Drainer accusations | Non-custodial by construction, public repo, simulation-first UX, explicit "never paste a private key" messaging |
