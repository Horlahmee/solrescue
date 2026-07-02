"use client";

import { useEffect } from "react";
import { ArrowUpRight, PartyPopper } from "lucide-react";
import { formatSol } from "@/lib/formatSol";
import { getCluster } from "@/lib/solana";
import { analytics } from "@/lib/analytics";
import { Address } from "./Address";
import { Button } from "./ui";

export interface RecoveryResult {
  signature: string;
  mintAddress: string;
  excess: bigint;
  fee: bigint;
  net: bigint;
}

interface SuccessScreenProps {
  result: RecoveryResult;
  onDone: () => void;
}

export function SuccessScreen({ result, onDone }: SuccessScreenProps) {
  const cluster = getCluster();
  const solscanUrl = `https://solscan.io/tx/${result.signature}${
    cluster === "devnet" ? "?cluster=devnet" : ""
  }`;
  // The /r/<sig> link unfurls into a dynamic image card on X (intent URLs
  // can't attach images directly — a rich link preview is the mechanism).
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${result.signature}`
      : `https://solrescue.techgeniehq.com/r/${result.signature}`;
  const shareText = encodeURIComponent(
    `Just recovered ${formatSol(result.net)} SOL that was stuck in a mint account, in one click — non-custodial, open source.`,
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`;

  useEffect(() => {
    // Fire-and-forget: the API route re-verifies everything on-chain before
    // recording, so nothing here is trusted and failure costs the user nothing.
    fetch("/api/recovery-logged", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature: result.signature }),
    }).catch(() => {});
  }, [result.signature]);

  return (
    <section className="nb rounded-xl p-8 sm:p-10 flex flex-col items-center gap-6 animate-fade-up shadow-[8px_8px_0_var(--color-ink)]">
      <div className="bg-teal border-2 border-ink p-3 shadow-[4px_4px_0_var(--color-ink)] -rotate-3 animate-pop">
        <PartyPopper className="size-9" aria-hidden />
      </div>
      <div className="text-center">
        <div className="font-display font-bold text-3xl sm:text-4xl">
          <span className="font-mono bg-teal border-2 border-ink px-2">
            {formatSol(result.net)}
          </span>{" "}
          SOL recovered
        </div>
        <div className="text-sm text-muted mt-3">
          It’s already in your wallet.
        </div>
      </div>

      <div className="w-full max-w-sm border-2 border-ink rounded-md overflow-hidden text-sm">
        <SummaryRow label="From mint">
          <Address value={result.mintAddress} />
        </SummaryRow>
        <SummaryRow label="Recovered">
          <span className="font-mono font-bold">
            {formatSol(result.excess)} SOL
          </span>
        </SummaryRow>
        <SummaryRow label="Fee">
          <span className="font-mono">{formatSol(result.fee)} SOL</span>
        </SummaryRow>
      </div>

      <a
        href={solscanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-mono text-sm font-bold hover:underline underline-offset-4 decoration-2"
      >
        View transaction on Solscan
        <ArrowUpRight className="size-3.5" aria-hidden />
      </a>

      <div className="flex flex-wrap justify-center gap-4 mt-1">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => analytics.shareClicked()}
          className="nb-press inline-flex items-center justify-center h-11 px-5 rounded-md bg-ink text-surface font-bold text-sm border-2 border-ink shadow-[4px_4px_0_var(--color-teal)]"
        >
          Share on X
        </a>
        <Button variant="ghost" onClick={onDone}>
          Back to my mints
        </Button>
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 bg-surface not-first:border-t-2 not-first:border-ink">
      <span className="text-muted">{label}</span>
      {children}
    </div>
  );
}
