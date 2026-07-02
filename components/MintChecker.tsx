"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { CircleCheck, Info, ShieldAlert } from "lucide-react";
import { checkMint, type MintStatus } from "@/lib/checkMint";
import { formatSol } from "@/lib/formatSol";
import { analytics } from "@/lib/analytics";
import { Button } from "./ui";

type CheckState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "bad-address" }
  | { phase: "error" }
  | { phase: "done"; status: MintStatus; address: string };

interface MintCheckerProps {
  // Lets the connected view offer recovery when the checked mint is the user's.
  onRecoverable?: (mintAddress: string, authority: string, excess: bigint) => void;
}

export function MintChecker({ onRecoverable }: MintCheckerProps) {
  const { connection } = useConnection();
  const [input, setInput] = useState("");
  const [state, setState] = useState<CheckState>({ phase: "idle" });

  const check = async () => {
    let mint: PublicKey;
    try {
      mint = new PublicKey(input.trim());
    } catch {
      setState({ phase: "bad-address" });
      return;
    }
    setState({ phase: "checking" });
    try {
      const status = await checkMint(connection, mint);
      analytics.mintChecked(status.kind);
      setState({ phase: "done", status, address: mint.toBase58() });
      if (status.kind === "recoverable" && onRecoverable) {
        onRecoverable(mint.toBase58(), status.authority, status.excess);
      }
    } catch {
      setState({ phase: "error" });
    }
  };

  return (
    <div className="nb rounded-lg p-5 animate-fade-up">
      <h3 className="font-display font-bold text-lg">Check any mint address</h3>
      <p className="text-sm text-muted mt-1 mb-4">
        No wallet needed — see instantly whether an address holds recoverable
        SOL.
      </p>
      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && check()}
          placeholder="Paste a mint address"
          spellCheck={false}
          className="flex-1 min-w-0 h-11 bg-surface border-2 border-ink rounded-md px-3 font-mono text-sm placeholder:text-muted placeholder:font-body focus:outline-none focus:shadow-[3px_3px_0_var(--color-ink)] transition-shadow"
        />
        <Button
          onClick={check}
          busy={state.phase === "checking"}
          disabled={input.trim() === ""}
        >
          Check
        </Button>
      </div>
      {state.phase !== "idle" && state.phase !== "checking" && (
        <div className="mt-4 animate-fade-up">
          {state.phase === "bad-address" && (
            <ResultNote tone="amber" icon={<ShieldAlert className="size-4" />}>
              That’s not a valid Solana address.
            </ResultNote>
          )}
          {state.phase === "error" && (
            <ResultNote tone="amber" icon={<ShieldAlert className="size-4" />}>
              Couldn’t reach the network — try again in a moment.
            </ResultNote>
          )}
          {state.phase === "done" && <CheckResult status={state.status} />}
        </div>
      )}
    </div>
  );
}

function CheckResult({ status }: { status: MintStatus }) {
  switch (status.kind) {
    case "recoverable":
      return (
        <ResultNote tone="teal" icon={<CircleCheck className="size-4" />}>
          Recoverable by{" "}
          <span className="font-mono font-bold">
            {status.authority.slice(0, 4)}…{status.authority.slice(-4)}
          </span>{" "}
          —{" "}
          <span className="font-mono font-bold">
            {formatSol(status.excess)} SOL
          </span>
          . Connect that wallet to recover it.
        </ResultNote>
      );
    case "revoked":
      return (
        <ResultNote tone="amber" icon={<ShieldAlert className="size-4" />}>
          Authority revoked — recovery requires the original mint keypair. We
          can’t help with this, and don’t trust anyone who asks you to paste
          it.
        </ResultNote>
      );
    case "no-excess":
      return (
        <ResultNote tone="plain" icon={<Info className="size-4" />}>
          No excess SOL on this mint.
        </ResultNote>
      );
    case "not-a-mint":
      return (
        <ResultNote tone="plain" icon={<Info className="size-4" />}>
          This address isn’t a token mint account.
        </ResultNote>
      );
  }
}

function ResultNote({
  tone,
  icon,
  children,
}: {
  tone: "teal" | "amber" | "plain";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const tones = {
    teal: "bg-teal",
    amber: "bg-amber",
    plain: "bg-surface-2",
  };
  return (
    <div
      className={`flex items-start gap-2 text-sm rounded-md border-2 border-ink p-3 font-medium ${tones[tone]}`}
    >
      <span className="shrink-0 mt-0.5">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
