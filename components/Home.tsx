"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { createAnonClient, type MintRow } from "@/lib/supabaseClient";
import { getCluster } from "@/lib/solana";
import { MintCard } from "./MintCard";
import { MintChecker } from "./MintChecker";
import { StatsBar } from "./StatsBar";
import { SuccessScreen, type RecoveryResult } from "./SuccessScreen";
import { Skeleton } from "./ui";

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
  const cluster = getCluster();

  return (
    <main className="max-w-3xl mx-auto px-6 py-8 sm:py-12 flex flex-col gap-12 min-h-dvh">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-display text-xl tracking-tight">
            Sol<span className="text-teal">Rescue</span>
          </div>
          {cluster === "devnet" && (
            <span className="font-mono text-[11px] uppercase tracking-wider text-amber border border-amber/40 rounded-full px-2 py-0.5">
              devnet
            </span>
          )}
        </div>
        <WalletMultiButton />
      </header>

      <div className="flex-1 flex flex-col gap-12">
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
          <>
            <Hero />
            <MintChecker />
          </>
        )}

        <StatsBar />
      </div>

      <footer className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted border-t border-edge pt-6">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-teal transition-colors"
        >
          Source code (MIT)
        </a>
        <a
          href={SIMD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-teal transition-colors"
        >
          SIMD-0266
        </a>
        <span className="sm:ml-auto">
          Non-custodial. Your keys never leave your wallet.
        </span>
      </footer>
    </main>
  );
}

function Hero() {
  return (
    <section className="flex flex-col gap-8 animate-fade-up">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.15] tracking-tight">
          SOL stuck in a mint account?
          <br />
          <span className="text-teal">Get it back in one click.</span>
        </h1>
        <p className="text-muted max-w-xl leading-relaxed">
          The p-token upgrade made SOL mistakenly sent to token mint addresses
          recoverable — if you’re the mint authority. Connect your wallet to
          see what’s yours. You sign one transaction; we never touch your keys.
        </p>
      </div>
      <ol className="grid sm:grid-cols-3 gap-4">
        {[
          ["Connect", "We look up mints where your wallet is the authority."],
          ["Verify", "Exact figures, simulated on-chain before you sign."],
          ["Recover", "SOL lands in your wallet. 10% fee, same transaction."],
        ].map(([title, body], i) => (
          <li
            key={title}
            className="border border-edge rounded-xl bg-surface p-5"
          >
            <div className="font-mono text-teal text-xs mb-3">0{i + 1}</div>
            <div className="font-display mb-1.5">{title}</div>
            <div className="text-sm text-muted leading-relaxed">{body}</div>
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
    setRows(null);
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

  if (rows === null) {
    return (
      <section className="flex flex-col gap-6" aria-busy>
        <Skeleton className="h-8 w-64" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </section>
    );
  }

  const merged = [
    ...rows,
    ...manual.filter(
      (m) => !rows.some((row) => row.mint_address === m.mint_address),
    ),
  ];

  return (
    <section className="flex flex-col gap-6 animate-fade-up">
      <div>
        <h2 className="font-display text-2xl">
          {merged.length === 0
            ? "No recoverable mints in our index"
            : `${merged.length} recoverable mint${merged.length > 1 ? "s" : ""} found`}
        </h2>
        <p className="text-sm text-muted mt-1.5">
          {merged.length === 0
            ? "Our index may lag the chain — paste a mint address below to check it directly."
            : "Figures re-verify against the chain the moment you hit Recover."}
        </p>
      </div>

      {merged.length > 0 && (
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
      )}

      <MintChecker onRecoverable={addManual} />
    </section>
  );
}
