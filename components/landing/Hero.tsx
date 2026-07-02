import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { formatSol } from "@/lib/formatSol";
import type { LandingStats } from "./data";

const GITHUB_URL = "https://github.com/Horlahmee/solrescue";

export function Nav() {
  return (
    <nav className="flex items-center justify-between py-6">
      <div className="font-display text-xl tracking-tight">
        Sol<span className="text-teal">Rescue</span>
      </div>
      <div className="hidden sm:flex items-center gap-8 text-sm text-muted">
        <a href="#how" className="hover:text-ink transition-colors">
          How it works
        </a>
        <a href="#security" className="hover:text-ink transition-colors">
          Security
        </a>
        <a href="#faq" className="hover:text-ink transition-colors">
          FAQ
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-ink transition-colors inline-flex items-center gap-1.5"
        >
          <GithubIcon className="size-4" /> Source
        </a>
      </div>
      <Link
        href="/app"
        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-teal text-[#05261f] font-semibold text-sm hover:brightness-110 transition-all"
      >
        Launch app
      </Link>
    </nav>
  );
}

export function Hero({ stats }: { stats: LandingStats }) {
  return (
    <section className="pt-16 pb-20 flex flex-col items-center text-center gap-8 animate-fade-up">
      <span className="font-mono text-xs uppercase tracking-widest text-violet border border-violet/30 bg-violet/5 rounded-full px-3 py-1">
        Powered by the p-token upgrade · SIMD-0266
      </span>
      <h1 className="font-display text-5xl sm:text-6xl leading-[1.08] tracking-tight max-w-3xl">
        There’s SOL locked in
        <br />
        <span className="text-teal">your mint accounts.</span>
        <br />
        Take it back.
      </h1>
      <p className="text-muted text-lg max-w-2xl leading-relaxed">
        SOL sent to a token mint address used to be gone forever. Not anymore.
        If your wallet is the mint authority, SolRescue returns it in one
        signed transaction — non-custodial, open source, and simulated before
        you sign.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/app"
          className="glow-teal inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-teal text-[#05261f] font-semibold hover:brightness-110 transition-all"
        >
          Launch app — check your mints
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <a
          href="#how"
          className="inline-flex items-center h-12 px-6 rounded-lg border border-edge text-sm font-semibold hover:border-edge-2 hover:bg-surface transition-all"
        >
          How it works
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-edge border border-edge rounded-2xl overflow-hidden w-full max-w-3xl mt-6">
        <Stat
          value={formatSol(BigInt(stats.total_recoverable_lamports))}
          unit="SOL"
          label="recoverable, indexed live"
          tone="text-teal"
        />
        <Stat
          value={stats.recoverable_mints.toLocaleString()}
          label="mints with stuck SOL"
          tone="text-violet"
        />
        <Stat
          value={formatSol(BigInt(stats.total_recovered_lamports))}
          unit="SOL"
          label="recovered through SolRescue"
          tone="text-teal"
        />
        <Stat
          value={stats.total_recoveries.toLocaleString()}
          label="recoveries completed"
          tone="text-amber"
        />
      </div>
    </section>
  );
}

function Stat({
  value,
  unit,
  label,
  tone,
}: {
  value: string;
  unit?: string;
  label: string;
  tone: string;
}) {
  return (
    <div className="bg-surface px-5 py-4 text-left">
      <div className={`font-mono text-xl ${tone}`}>
        {value}
        {unit && <span className="text-xs text-muted ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
