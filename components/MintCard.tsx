"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { buildRecoveryTx, type RecoveryQuote } from "@/lib/recovery";
import { RecoveryError } from "@/lib/errors";
import { formatSol } from "@/lib/formatSol";
import { computeFeeSplit } from "@/lib/fee";
import { Address } from "./Address";
import type { RecoveryResult } from "./SuccessScreen";

interface MintCardProps {
  mintAddress: string;
  tokenName: string | null;
  tokenSymbol: string | null;
  indexedExcess: bigint;
  feeWallet: string;
  feeBps: number;
  onSuccess: (result: RecoveryResult) => void;
}

type Phase =
  | { step: "idle" }
  | { step: "quoting" }
  | { step: "ready"; quote: RecoveryQuote }
  | { step: "sending" }
  | { step: "error"; message: string };

export function MintCard({
  mintAddress,
  tokenName,
  tokenSymbol,
  indexedExcess,
  feeWallet,
  feeBps,
  onSuccess,
}: MintCardProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [phase, setPhase] = useState<Phase>({ step: "idle" });

  // Indexed figures are display-only; the signable numbers come from the fresh
  // on-chain fetch + simulation inside buildRecoveryTx.
  const preview = computeFeeSplit(indexedExcess, feeBps);
  const label =
    tokenName && tokenSymbol
      ? `${tokenName} (${tokenSymbol})`
      : (tokenName ?? tokenSymbol ?? null);

  const quote = async () => {
    if (!publicKey) return;
    if (!feeWallet) {
      setPhase({
        step: "error",
        message: "Fee wallet not configured — set NEXT_PUBLIC_FEE_WALLET.",
      });
      return;
    }
    setPhase({ step: "quoting" });
    try {
      const result = await buildRecoveryTx(
        connection,
        new PublicKey(mintAddress),
        publicKey,
        new PublicKey(feeWallet),
        feeBps,
      );
      setPhase({ step: "ready", quote: result });
    } catch (error: unknown) {
      setPhase({ step: "error", message: toUserMessage(error) });
    }
  };

  const sign = async (readyQuote: RecoveryQuote) => {
    setPhase({ step: "sending" });
    try {
      const signature = await sendTransaction(readyQuote.tx, connection);
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });
      onSuccess({
        signature,
        mintAddress,
        excess: readyQuote.excess,
        fee: readyQuote.fee,
        net: readyQuote.net,
      });
    } catch (error: unknown) {
      setPhase({ step: "error", message: toUserMessage(error) });
    }
  };

  return (
    <div className="border border-edge rounded-lg bg-surface p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-display">
          {label ?? <Address value={mintAddress} />}
        </div>
        {label && <Address value={mintAddress} />}
      </div>

      {phase.step === "ready" ? (
        <div className="border border-teal/40 rounded-md p-3 bg-surface-2">
          <div className="text-xs text-muted mb-1">
            Verified on-chain and simulated just now:
          </div>
          <div className="font-mono text-sm">
            You receive{" "}
            <span className="text-teal">{formatSol(phase.quote.net)} SOL</span>{" "}
            · Fee{" "}
            <span className="text-amber">
              {formatSol(phase.quote.fee)} SOL
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-baseline gap-4">
          <div>
            <div className="font-mono text-2xl text-teal">
              {formatSol(indexedExcess)} SOL
            </div>
            <div className="text-xs text-muted">recoverable</div>
          </div>
          <div>
            <div className="font-mono text-sm">
              {formatSol(preview.net)} SOL
            </div>
            <div className="text-xs text-muted">you receive (after fee)</div>
          </div>
        </div>
      )}

      {phase.step === "ready" ? (
        <button
          type="button"
          onClick={() => sign(phase.quote)}
          className="mt-1 py-2 rounded-md bg-teal text-[#05261f] font-semibold text-sm cursor-pointer"
        >
          Sign in wallet — receive {formatSol(phase.quote.net)} SOL
        </button>
      ) : (
        <button
          type="button"
          onClick={quote}
          disabled={phase.step === "quoting" || phase.step === "sending"}
          className="mt-1 py-2 rounded-md bg-teal text-[#05261f] font-semibold text-sm disabled:opacity-40 cursor-pointer"
        >
          {phase.step === "quoting"
            ? "Verifying on-chain…"
            : phase.step === "sending"
              ? "Confirm in your wallet…"
              : "Recover"}
        </button>
      )}

      {phase.step === "error" && (
        <p className="text-sm text-amber">{phase.message}</p>
      )}
    </div>
  );
}

function toUserMessage(error: unknown): string {
  if (error instanceof RecoveryError) return error.userMessage;
  if (error instanceof Error && /user rejected/i.test(error.message)) {
    return "You dismissed the signature request — nothing was sent.";
  }
  return "Something went wrong before anything was sent. Try again.";
}
