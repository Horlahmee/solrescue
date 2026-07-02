"use client";

import { useEffect } from "react";
import { formatSol } from "@/lib/formatSol";
import { getCluster } from "@/lib/solana";
import { Address } from "./Address";

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
    <div className="border border-teal/50 rounded-lg bg-surface p-8 text-center flex flex-col items-center gap-4">
      <div className="font-display text-3xl text-teal">
        {formatSol(result.net)} SOL recovered
      </div>
      <div className="text-sm text-muted">
        from mint <Address value={result.mintAddress} /> · fee{" "}
        <span className="font-mono">{formatSol(result.fee)} SOL</span>
      </div>
      <a
        href={solscanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-sm text-teal underline underline-offset-4"
      >
        View transaction on Solscan
      </a>
      <div className="flex gap-3 mt-2">
        <a
          href={`https://twitter.com/intent/tweet?text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-md bg-teal text-[#05261f] font-semibold text-sm"
        >
          Share on X
        </a>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 rounded-md border border-edge text-sm cursor-pointer"
        >
          Back
        </button>
      </div>
    </div>
  );
}
