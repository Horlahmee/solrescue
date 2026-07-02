"use client";

import { useEffect } from "react";
import { ArrowUpRight, CircleCheck } from "lucide-react";
import { formatSol } from "@/lib/formatSol";
import { getCluster } from "@/lib/solana";
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
  const shareText = encodeURIComponent(
    `Just recovered ${formatSol(result.net)} SOL that was stuck in a mint account, in one click — non-custodial, open source. solrescue.techgeniehq.com`,
  );

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
    <section className="border border-teal/40 rounded-2xl bg-surface p-10 flex flex-col items-center gap-5 animate-fade-up">
      <CircleCheck className="size-14 text-teal animate-pop" aria-hidden />
      <div className="text-center">
        <div className="font-display text-4xl">
          <span className="font-mono text-teal">{formatSol(result.net)}</span>{" "}
          SOL recovered
        </div>
        <div className="text-sm text-muted mt-2">
          It’s already in your wallet.
        </div>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-edge overflow-hidden text-sm">
        <div className="flex justify-between px-4 py-2.5 bg-surface-2">
          <span className="text-muted">From mint</span>
          <Address value={result.mintAddress} />
        </div>
        <div className="flex justify-between px-4 py-2.5 bg-surface-2 border-t border-edge">
          <span className="text-muted">Recovered</span>
          <span className="font-mono">{formatSol(result.excess)} SOL</span>
        </div>
        <div className="flex justify-between px-4 py-2.5 bg-surface-2 border-t border-edge">
          <span className="text-muted">Fee</span>
          <span className="font-mono">{formatSol(result.fee)} SOL</span>
        </div>
      </div>

      <a
        href={solscanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-mono text-sm text-teal hover:underline underline-offset-4"
      >
        View transaction on Solscan
        <ArrowUpRight className="size-3.5" aria-hidden />
      </a>

      <div className="flex gap-3 mt-1">
        <a
          href={`https://twitter.com/intent/tweet?text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-teal text-[#05261f] font-semibold text-sm hover:brightness-110 transition-all"
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
