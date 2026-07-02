"use client";

import { Loader2 } from "lucide-react";

export function Spinner({ className = "size-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} aria-hidden />;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-md border-2 border-ink/10 animate-shimmer bg-[linear-gradient(110deg,var(--color-surface-2)40%,var(--color-surface)50%,var(--color-surface-2)60%)] bg-[length:200%_100%] ${className}`}
    />
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "dark";
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
    "nb-press inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md font-bold text-sm border-2 border-ink shadow-[4px_4px_0_var(--color-ink)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-[4px_4px_0_var(--color-ink)]";
  const skin = {
    primary: "bg-teal text-ink",
    ghost: "bg-surface text-ink",
    dark: "bg-ink text-surface shadow-[4px_4px_0_var(--color-teal)]",
  }[variant];
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
