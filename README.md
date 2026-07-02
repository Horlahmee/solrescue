# SolRescue

**Recover SOL stranded in Solana mint accounts — non-custodial, open source, verifiable.**

People mistakenly send SOL to token mint addresses. Historically that SOL was stuck forever. The p-token upgrade ([SIMD-0266](https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0266-replace-token-program.md), live on mainnet since epoch 971) added a `withdraw_excess_lamports` instruction to the SPL Token program. If you are the **mint authority**, you can now withdraw that excess. SolRescue is a one-click interface for doing exactly that.

## The trust model (read this if you think we're a drainer — good instinct)

- **Your keys never leave your wallet.** All signing happens client-side through the standard Solana wallet adapter (Phantom, Solflare). This codebase contains no code path that generates, accepts, parses, stores, or transmits a private key or seed phrase. Search it yourself.
- **Your SOL never touches our wallet.** The withdraw instruction sends the full excess directly from the mint account to *your* wallet. Our 10% fee is a separate `SystemProgram.transfer` instruction in the same atomic transaction — both land or neither does.
- **You see exact figures before signing.** Every transaction is simulated first and the results shown: "You receive X SOL · Fee Y SOL". Simulation failure blocks the sign button.
- **If your mint authority is revoked, we cannot help you** — recovery would require the mint account's original private keypair, and we will never ask for a keypair. Neither should anyone else. Anyone who does is trying to drain you.

## How to verify the transaction yourself

1. The transaction contains exactly two instructions.
2. Instruction 1: SPL Token program (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`), data = single byte `38` (`withdraw_excess_lamports`), accounts = `[mint (writable), YOUR wallet (writable, destination), YOUR wallet (signer, authority)]`.
3. Instruction 2: System program transfer from your wallet to the fee wallet, amount = 10% of the excess (rounded down).
4. Your wallet's simulation preview will show the same net figures the app displays.

## Run it locally

```bash
git clone <this repo>
cd SolRescue
npm install
cp .env.example .env.local   # fill in your own keys — see comments in the file
npm run dev
```

Required services: a [Helius](https://helius.dev) RPC key and a [Supabase](https://supabase.com) project (discovery index only — every transaction is built from a fresh on-chain fetch, never from the database).

## What's in the box

- `lib/recovery.ts` — builds the recovery transaction (the actual product)
- `lib/mintParser.ts` — parses raw mint account data (82-byte legacy layout)
- `scripts/indexer.ts` — populates the discovery index of mints with recoverable excess
- `app/` — the single-page Next.js UI

## Manual QA checklist

- [ ] Manual checker: mint with authority + excess → shows recoverable amount
- [ ] Manual checker: revoked-authority mint → shows "authority revoked" warning, no recovery offered
- [ ] Manual checker: non-mint address → clear "not a mint" message
- [ ] Connect wallet that owns a funded test mint → mint card appears with correct figures
- [ ] Simulation figures match wallet preview exactly
- [ ] Recovery lands: user receives net, fee wallet receives fee, in one transaction
- [ ] Success screen links to the correct Solscan transaction
- [ ] Mint with zero excess → "no excess" state, no sign button

## License

MIT — see [LICENSE](LICENSE).
