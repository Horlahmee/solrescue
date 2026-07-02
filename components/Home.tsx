"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { createAnonClient, type MintRow } from "@/lib/supabaseClient";
import { getCluster } from "@/lib/solana";
import { MintCard } from "./MintCard";
import { MintChecker } from "./MintChecker";
import { StatsBar } from "./StatsBar";
import { SuccessScreen, type RecoveryResult } from "./SuccessScreen";
import { ThemeToggle } from "./ThemeToggle";
import { TopMintsLive } from "./TopMintsLive";
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
    <main className="max-w-3xl mx-auto px-6 py-8 sm:py-10 flex flex-col gap-10 min-h-dvh">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display font-bold text-lg tracking-tight">
            Sol<span className="bg-teal px-1 border-2 border-ink">Rescue</span>
          </Link>
          {cluster === "devnet" && (
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider bg-amber border-2 border-ink px-2 py-0.5 -rotate-2">
              devnet
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <WalletMultiButton />
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-10">
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
            <TopMintsLive />
          </>
        )}

        <StatsBar />
      </div>

      <footer className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold border-t-2 border-ink pt-6">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline underline-offset-4 decoration-2"
        >
          Source code (MIT)
        </a>
        <a
          href={SIMD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline underline-offset-4 decoration-2"
        >
          SIMD-0266
        </a>
        <span className="sm:ml-auto text-muted">
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
        <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.08] tracking-tight">
          SOL stuck in a mint?{" "}
          <span className="inline-block bg-teal border-2 border-ink px-2 shadow-[4px_4px_0_var(--color-ink)] -rotate-1">
            Get it back.
          </span>
        </h1>
        <p className="text-muted max-w-xl leading-relaxed">
          Connect your wallet to see every mint where you’re the authority.
          One signature brings the SOL home — we never touch your keys.
        </p>
      </div>
      <ol className="grid sm:grid-cols-3 gap-5">
        {[
          ["Connect", "We look up mints where your wallet is the authority.", "bg-teal"],
          ["Verify", "Exact figures, simulated on-chain before you sign.", "bg-amber"],
          ["Recover", "SOL lands in your wallet. 10% fee, same transaction.", "bg-pink"],
        ].map(([title, body, bg], i) => (
          <li key={title} className="nb rounded-lg p-5 flex flex-col gap-3">
            <span
              className={`${bg} border-2 border-ink size-8 flex items-center justify-center font-mono font-bold text-sm shadow-[2px_2px_0_var(--color-ink)]`}
            >
              {i + 1}
            </span>
            <div className="font-display font-bold">{title}</div>
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
        <Skeleton className="h-9 w-64" />
        <div className="grid sm:grid-cols-2 gap-5">
          <Skeleton className="h-44 rounded-lg" />
          <Skeleton className="h-44 rounded-lg" />
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
        <h2 className="font-display font-bold text-2xl sm:text-3xl">
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
        <div className="grid sm:grid-cols-2 gap-5">
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
