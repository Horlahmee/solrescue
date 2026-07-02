"use client";

import { Loader2 } from "lucide-react";

export function Spinner({ className = "size-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} aria-hidden />;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-md animate-shimmer bg-[linear-gradient(110deg,var(--color-surface-2)40%,var(--color-edge)50%,var(--color-surface-2)60%)] bg-[length:200%_100%] ${className}`}
    />
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  busy?: boolean;
}

export function Button({
  variant = "primary",
  busy = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-semibold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";
  const skin =
    variant === "primary"
      ? "bg-teal text-[#05261f] hover:brightness-110"
      : "border border-edge text-ink hover:border-edge-2 hover:bg-surface-2";
  return (
    <button
      type="button"
      disabled={disabled || busy}
      aria-busy={busy}
      className={`${base} ${skin} ${className}`}
      {...rest}
    >
      {busy && <Spinner />}
      {children}
    </button>
  );
}
