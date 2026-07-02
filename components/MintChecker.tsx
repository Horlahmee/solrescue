"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { checkMint, type MintStatus } from "@/lib/checkMint";
import { formatSol } from "@/lib/formatSol";

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
      setState({ phase: "done", status, address: mint.toBase58() });
      if (status.kind === "recoverable" && onRecoverable) {
        onRecoverable(mint.toBase58(), status.authority, status.excess);
      }
    } catch {
      setState({ phase: "error" });
    }
  };

  return (
    <div className="border border-edge rounded-lg bg-surface p-5">
      <h3 className="font-display text-lg mb-3">Check any mint address</h3>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && check()}
          placeholder="Paste a mint address"
          className="flex-1 bg-bg border border-edge rounded-md px-3 py-2 font-mono text-sm placeholder:text-muted focus:outline-none focus:border-teal"
        />
        <button
          type="button"
          onClick={check}
          disabled={state.phase === "checking" || input.trim() === ""}
          className="px-4 py-2 rounded-md bg-teal text-[#05261f] font-semibold text-sm disabled:opacity-40 cursor-pointer"
        >
          {state.phase === "checking" ? "Checking…" : "Check"}
        </button>
      </div>
      <div className="mt-3 text-sm min-h-5">
        {state.phase === "bad-address" && (
          <span className="text-amber">That’s not a valid Solana address.</span>
        )}
        {state.phase === "error" && (
          <span className="text-amber">
            Couldn’t reach the network — try again in a moment.
          </span>
        )}
        {state.phase === "done" && <CheckResult status={state.status} />}
      </div>
    </div>
  );
}

function CheckResult({ status }: { status: MintStatus }) {
  switch (status.kind) {
    case "recoverable":
      return (
        <span className="text-teal">
          Recoverable by{" "}
          <span className="font-mono">
            {status.authority.slice(0, 4)}…{status.authority.slice(-4)}
          </span>{" "}
          — <span className="font-mono">{formatSol(status.excess)} SOL</span>
        </span>
      );
    case "revoked":
      return (
        <span className="text-amber">
          Authority revoked — recovery requires the original mint keypair. We
          can’t help with this, and don’t trust anyone who asks you to paste it.
        </span>
      );
    case "no-excess":
      return <span className="text-muted">No excess SOL on this mint.</span>;
    case "not-a-mint":
      return (
        <span className="text-muted">
          This address isn’t a token mint account.
        </span>
      );
  }
}
