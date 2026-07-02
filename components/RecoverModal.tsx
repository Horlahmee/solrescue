"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ArrowDown, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { buildRecoveryTx, type RecoveryQuote } from "@/lib/recovery";
import { RecoveryError } from "@/lib/errors";
import { formatSol } from "@/lib/formatSol";
import { Button, Spinner } from "./ui";
import { Address } from "./Address";
import type { RecoveryResult } from "./SuccessScreen";

type Stage =
  | { step: "verifying" }
  | { step: "ready"; quote: RecoveryQuote }
  | { step: "signing"; quote: RecoveryQuote }
  | { step: "confirming"; signature: string }
  | { step: "error"; message: string };

interface RecoverModalProps {
  mintAddress: string;
  label: string | null;
  feeWallet: string;
  feeBps: number;
  onSuccess: (result: RecoveryResult) => void;
  onClose: () => void;
}

export function RecoverModal({
  mintAddress,
  label,
  feeWallet,
  feeBps,
  onSuccess,
  onClose,
}: RecoverModalProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [stage, setStage] = useState<Stage>({ step: "verifying" });

  const busy = stage.step === "signing" || stage.step === "confirming";

  const verify = useCallback(async () => {
    if (!publicKey) return;
    if (!feeWallet) {
      setStage({
        step: "error",
        message: "Fee wallet not configured — set NEXT_PUBLIC_FEE_WALLET.",
      });
      return;
    }
    setStage({ step: "verifying" });
    try {
      const quote = await buildRecoveryTx(
        connection,
        new PublicKey(mintAddress),
        publicKey,
        new PublicKey(feeWallet),
        feeBps,
      );
      setStage({ step: "ready", quote });
    } catch (error: unknown) {
      setStage({ step: "error", message: toUserMessage(error) });
    }
  }, [connection, publicKey, mintAddress, feeWallet, feeBps]);

  useEffect(() => {
    void verify();
  }, [verify]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const sign = async (readyQuote: RecoveryQuote) => {
    setStage({ step: "signing", quote: readyQuote });
    try {
      const signature = await sendTransaction(readyQuote.tx, connection);
      setStage({ step: "confirming", signature });
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
      setStage({ step: "error", message: toUserMessage(error) });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Recover SOL"
    >
      <div
        className="w-full max-w-md bg-surface border-2 border-ink rounded-xl shadow-[8px_8px_0_var(--color-ink)] p-6 animate-fade-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-xl">Recover SOL</h3>
            <div className="text-sm text-muted mt-0.5">
              {label ? `${label} · ` : ""}
              <Address value={mintAddress} />
            </div>
          </div>
          {!busy && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="nb-press border-2 border-ink bg-surface-2 shadow-[2px_2px_0_var(--color-ink)] p-1 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {stage.step === "verifying" && (
          <StageShell>
            <Spinner className="size-6" />
            <p className="text-sm text-muted text-center">
              Reading the mint fresh from the chain and simulating the
              transaction…
            </p>
          </StageShell>
        )}

        {stage.step === "ready" && (
          <div className="flex flex-col gap-4 animate-fade-up">
            <QuoteBreakdown quote={stage.quote} />
            <div className="flex items-start gap-2 text-xs border-2 border-ink bg-surface-2 rounded-md p-3">
              <ShieldCheck className="size-4 shrink-0 mt-0.5" />
              <span>
                Simulated on-chain just now — your wallet will show these same
                numbers. Two instructions, nothing else: the withdrawal to
                your wallet, and the fee.
              </span>
            </div>
            <Button onClick={() => sign(stage.quote)} className="w-full">
              Sign — receive {formatSol(stage.quote.net)} SOL
            </Button>
          </div>
        )}

        {stage.step === "signing" && (
          <StageShell>
            <Spinner className="size-6" />
            <p className="text-sm font-bold text-center">
              Approve the transaction in your wallet
            </p>
            <p className="text-xs text-muted text-center">
              Check the figures there — they should read exactly{" "}
              <span className="font-mono font-bold text-ink">
                +{formatSol(stage.quote.net)} SOL
              </span>{" "}
              for you.
            </p>
          </StageShell>
        )}

        {stage.step === "confirming" && (
          <StageShell>
            <Spinner className="size-6" />
            <p className="text-sm font-bold text-center">
              Confirming on-chain…
            </p>
            <p className="font-mono text-xs text-muted break-all text-center">
              {stage.signature.slice(0, 20)}…
            </p>
          </StageShell>
        )}

        {stage.step === "error" && (
          <div className="flex flex-col gap-4 animate-fade-up">
            <div className="flex items-start gap-2 text-sm border-2 border-ink bg-amber rounded-md p-3 font-medium">
              <TriangleAlert className="size-4 shrink-0 mt-0.5" />
              <span>{stage.message}</span>
            </div>
            <div className="flex gap-3">
              <Button onClick={verify} className="flex-1">
                Try again
              </Button>
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 animate-fade-up">
      {children}
    </div>
  );
}

function QuoteBreakdown({ quote }: { quote: RecoveryQuote }) {
  return (
    <div className="border-2 border-ink rounded-md overflow-hidden">
      <Row label="Stuck in the mint" value={`${formatSol(quote.excess)} SOL`} />
      <Row
        label="Service fee (10%)"
        value={`− ${formatSol(quote.fee)} SOL`}
        muted
      />
      <div className="flex justify-center py-1 bg-surface-2 border-t-2 border-ink">
        <ArrowDown className="size-3.5" aria-hidden />
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-teal border-t-2 border-ink">
        <span className="text-sm font-bold">You receive</span>
        <span className="font-mono font-bold text-lg">
          {formatSol(quote.net)} SOL
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface not-first:border-t-2 not-first:border-ink">
      <span className="text-sm text-muted">{label}</span>
      <span className={`font-mono text-sm ${muted ? "text-muted" : "font-bold"}`}>
        {value}
      </span>
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
