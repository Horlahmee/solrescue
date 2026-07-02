"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { createAnonClient, type MintRow } from "@/lib/supabaseClient";
import { MintCard } from "./MintCard";
import { MintChecker } from "./MintChecker";
import { StatsBar } from "./StatsBar";
import { SuccessScreen, type RecoveryResult } from "./SuccessScreen";

const GITHUB_URL = "https://github.com/Horlahmee/solrescue";
const SIMD_URL =
  "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0266-efficient-token-program.md";

interface HomeProps {
  feeWallet: string;
  feeBps: number;
}

export function Home({ feeWallet, feeBps }: HomeProps) {
  const { publicKey } = useWallet();
  const [success, setSuccess] = useState<RecoveryResult | null>(null);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-10">
      <header className="flex items-center justify-between">
        <div className="font-display text-xl">
          Sol<span className="text-teal">Rescue</span>
        </div>
        <WalletMultiButton />
      </header>

      {success ? (
        <SuccessScreen result={success} onDone={() => setSuccess(null)} />
      ) : publicKey ? (
        <Dashboard
          owner={publicKey.toBase58()}
          feeWallet={feeWallet}
          feeBps={feeBps}
          onSuccess={setSuccess}
        />
      ) : (
        <Hero />
      )}

      <StatsBar />
      {!publicKey && <MintChecker />}

      <footer className="flex gap-6 text-sm text-muted border-t border-edge pt-6">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-teal">
          Source code (MIT)
        </a>
        <a href={SIMD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-teal">
          SIMD-0266
        </a>
        <span className="ml-auto">
          Non-custodial. Your keys never leave your wallet.
        </span>
      </footer>
    </main>
  );
}

function Hero() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-display text-4xl leading-tight">
        SOL stuck in a mint account?
        <br />
        <span className="text-teal">Get it back in one click.</span>
      </h1>
      <p className="text-muted max-w-xl">
        The p-token upgrade made SOL mistakenly sent to token mint addresses
        recoverable — if you’re the mint authority. Connect your wallet to see
        what’s yours. You sign one transaction; we never touch your keys.
      </p>
      <ol className="grid sm:grid-cols-3 gap-4">
        {[
          ["Connect", "We look up mints where your wallet is the authority."],
          ["Verify", "Exact figures, simulated on-chain before you sign."],
          ["Recover", "SOL lands in your wallet. 10% fee, same transaction."],
        ].map(([title, body], i) => (
          <li key={title} className="border border-edge rounded-lg bg-surface p-4">
            <div className="font-mono text-teal text-xs mb-2">0{i + 1}</div>
            <div className="font-display mb-1">{title}</div>
            <div className="text-sm text-muted">{body}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

interface DashboardProps {
  owner: string;
  feeWallet: string;
  feeBps: number;
  onSuccess: (result: RecoveryResult) => void;
}

function Dashboard({ owner, feeWallet, feeBps, onSuccess }: DashboardProps) {
  const [rows, setRows] = useState<MintRow[] | null>(null);
  const [manual, setManual] = useState<MintRow[]>([]);

  useEffect(() => {
    createAnonClient()
      .from("mints")
      .select(
        "mint_address, authority, authority_revoked, lamports, excess_lamports, token_name, token_symbol",
      )
      .eq("authority", owner)
      .gt("excess_lamports", 0)
      .order("excess_lamports", { ascending: false })
      .then(({ data }) => setRows((data as MintRow[]) ?? []));
  }, [owner]);

  // Manual RPC check covers gaps in the index (SPECS.md §3.3 state 2).
  const addManual = useCallback(
    (mintAddress: string, authority: string, excess: bigint) => {
      if (authority !== owner) return;
      setManual((current) =>
        current.some((row) => row.mint_address === mintAddress)
          ? current
          : [
              ...current,
              {
                mint_address: mintAddress,
                authority,
                authority_revoked: false,
                lamports: 0,
                excess_lamports: Number(excess),
                token_name: null,
                token_symbol: null,
              },
            ],
      );
    },
    [owner],
  );

  const indexed = rows ?? [];
  const merged = [
    ...indexed,
    ...manual.filter(
      (m) => !indexed.some((row) => row.mint_address === m.mint_address),
    ),
  ];

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl">
        {rows === null
          ? "Looking up your mints…"
          : merged.length === 0
            ? "No recoverable mints found for this wallet"
            : `${merged.length} recoverable mint${merged.length > 1 ? "s" : ""} found`}
      </h2>
      {merged.length === 0 && rows !== null && (
        <p className="text-sm text-muted">
          Our index may lag the chain — paste a mint address below to check it
          directly.
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {merged.map((row) => (
          <MintCard
            key={row.mint_address}
            mintAddress={row.mint_address}
            tokenName={row.token_name}
            tokenSymbol={row.token_symbol}
            indexedExcess={BigInt(row.excess_lamports)}
            feeWallet={feeWallet}
            feeBps={feeBps}
            onSuccess={onSuccess}
          />
        ))}
      </div>
      <MintChecker onRecoverable={addManual} />
    </section>
  );
}
