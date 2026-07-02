"use client";

import { useState } from "react";
import { formatSol } from "@/lib/formatSol";
import { computeFeeSplit } from "@/lib/fee";
import { Address } from "./Address";
import { Button } from "./ui";
import { RecoverModal } from "./RecoverModal";
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

export function MintCard({
  mintAddress,
  tokenName,
  tokenSymbol,
  indexedExcess,
  feeWallet,
  feeBps,
  onSuccess,
}: MintCardProps) {
  const [open, setOpen] = useState(false);

  // Indexed figures are display-only; the signable numbers come from the
  // fresh on-chain fetch + simulation inside the modal.
  const preview = computeFeeSplit(indexedExcess, feeBps);
  const label =
    tokenName && tokenSymbol
      ? `${tokenName} (${tokenSymbol})`
      : (tokenName ?? tokenSymbol ?? null);

  return (
    <div className="group border border-edge hover:border-edge-2 transition-colors rounded-xl bg-surface p-5 flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center justify-between gap-2">
        <div className="font-display truncate">
          {label ?? <Address value={mintAddress} />}
        </div>
        {label && <Address value={mintAddress} />}
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-mono text-2xl text-teal">
            {formatSol(indexedExcess)}
            <span className="text-sm text-muted ml-1.5">SOL</span>
          </div>
          <div className="text-xs text-muted mt-0.5">recoverable</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm">{formatSol(preview.net)} SOL</div>
          <div className="text-xs text-muted mt-0.5">you receive</div>
        </div>
      </div>

      <Button onClick={() => setOpen(true)} className="w-full">
        Recover
      </Button>

      {open && (
        <RecoverModal
          mintAddress={mintAddress}
          label={label}
          feeWallet={feeWallet}
          feeBps={feeBps}
          onSuccess={onSuccess}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
