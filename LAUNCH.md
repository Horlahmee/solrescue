# SolRescue — Launch Checklist

Status legend: ✅ done · ⏳ waiting on external input · ⬜ to do

---

## 1. Secure the Helius RPC key (DO BEFORE PUBLIC PROMOTION)

The mainnet Helius key is embedded in `NEXT_PUBLIC_RPC_URL` and is therefore
visible in the browser bundle — unavoidable for any client-side Solana app.
This is a **quota/cost** risk, not a funds risk (the key cannot move anyone's
money), but an abuser could exhaust your RPC credits and take the app offline.
Lock it to the domain:

- [ ] Log in at <https://dashboard.helius.dev>
- [ ] Open the API key used for production (the one in Vercel's `NEXT_PUBLIC_RPC_URL`)
- [ ] Find **Access Control / Allowed Origins / Domain allowlist**
- [ ] Add: `solrescue.techgeniehq.com` (and `www.` if you use it)
- [ ] Also add the Vercel fallback origins if you want them to keep working:
      `solrescue.vercel.app`
- [ ] Save. Confirm the live site still loads and can check a mint (allowlist active)
- [ ] Optional hardening: keep a **separate, low-rate-limit** key for the browser
      (`NEXT_PUBLIC_RPC_URL`) and reserve the high-limit key for `HELIUS_API_KEY`
      (server-only: indexer, scan, enrich, API route). Update both in Vercel env if so.

> Note: `HELIUS_API_KEY` (used by scripts and the API route) is server-side only
> and is NOT exposed in the bundle — it does not need an allowlist, but pointing
> it at a different key than the browser one limits blast radius.

---

## 2. Mainnet proof recovery (the credibility receipt)

Blocked on ~0.12 real SOL. Produces the pinned "receipts" tweet and the README proof link.

- [ ] Fund the script wallet `HegQwvJshfTEqPoLwvo1KC81foSRH7YGP16RyHvdrS8Q`
      with ~0.12 SOL (covers the 0.1 SOL test excess + rent + fees)
- [ ] Run the mainnet mint-creation script (cluster-printed, `--yes` gated)
- [ ] On the live site, connect Phantom (mainnet), recover the 0.1 SOL
- [ ] Confirm: you receive 0.09, fee wallet receives 0.01, one atomic tx
- [ ] Record the Solscan tx link → add to CLAUDE.md progress log (M4) and README
- [ ] Screen-record the flow → outreach/launch asset

---

## 3. Pre-launch verification (all currently ✅)

- [x] Security audit remediated (headers, rate limit, fee-wallet gate, CSV injection)
- [x] Correctness review remediated (bigint storage, legacy-tx guard, error states)
- [x] `npm run test` green (13/13); `tsc` clean; production build passes
- [x] Non-custodial invariant verified: no key handling anywhere in app code
- [x] RLS verified: anon is read-only on `mints`/`recoveries`, no `indexer_state` access
- [x] Service role key confirmed absent from client bundle
- [x] Production confirmed on `mainnet-beta`
- [x] Custom domain live with SSL (`solrescue.techgeniehq.com`, A → 216.198.79.1)
- [x] Analytics wired (Vercel Analytics + Speed Insights + funnel events)
- [x] Favicon + share cards (`/r/<sig>` OG images)
- [ ] Re-run `npm run scan` to completion, then `npm run enrich` + `npm run index`
      so the leaderboard/stats reflect the full mainnet sweep at launch
- [ ] Spot-check the live site on mobile + a fresh browser (no cache)

---

## 4. Marketing assets ready to fire (post-proof-tx)

- [ ] Pinned proof tweet (video + Solscan link)
- [ ] Launch data thread ("$X stuck across Y mints — here's what we found")
- [ ] Anti-drainer educational post (never paste a keypair)
- [ ] Community posts: r/solana, Solana Tech Discord, Superteam
- [ ] Top-10 outreach DMs (leads.csv researched; hold until proof tx exists)
- [ ] Pitch the data story to a Solana newsletter (SolanaFloor, etc.)

---

## 5. Post-launch monitoring

- [ ] Watch Vercel Analytics funnel: connect → check → recover → share
- [ ] Watch Supabase `recoveries` table (ground-truth revenue ledger)
- [ ] Watch Helius credit usage for abuse spikes
- [ ] Keep the scan on a re-run cadence so already-recovered mints drop off
