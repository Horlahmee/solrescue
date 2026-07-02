"use client";

import { useState } from "react";

interface AddressProps {
  value: string;
}

// Addresses always truncated Ab3d…9xYz, mono, copy-on-click.
export function Address({ value }: AddressProps) {
  const [copied, setCopied] = useState(false);
  const short = `${value.slice(0, 4)}…${value.slice(-4)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — nothing to do, the full value is in the title
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={value}
      className="font-mono text-sm text-muted hover:text-ink hover:underline underline-offset-4 decoration-2 transition-colors cursor-pointer"
    >
      {copied ? "copied!" : short}
    </button>
  );
}
