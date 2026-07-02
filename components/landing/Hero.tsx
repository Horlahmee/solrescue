import Link from "next/link";
import { formatSol } from "@/lib/formatSol";
import { GithubIcon } from "@/components/icons";
import type { LandingStats } from "./data";

const GITHUB_URL = "https://github.com/Horlahmee/solrescue";

export function Nav() {
  return (
    <nav className="flex items-center justify-between py-6 border-b border-edge">
      <div className="font-display text-lg tracking-tight">
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
        className="inline-flex items-center h-9 px-4 rounded-md bg-teal text-[#05261f] font-semibold text-sm hover:brightness-110 transition-all"
      >
        Launch app
      </Link>
    </nav>
  );
}

export function Hero({ stats }: { stats: LandingStats }) {
  return (
    <section className="pt-24 pb-20 flex flex-col gap-10 animate-fade-up">
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="font-display text-5xl sm:text-6xl leading-[1.06] tracking-tight">
          Recover the SOL stuck in your mint accounts.
        </h1>
        <p className="text-muted text-lg leading-relaxed max-w-xl">
          If your wallet is the mint authority, one signed transaction returns
          it. Non-custodial, open source, simulated before you sign.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/app"
            className="inline-flex items-center h-11 px-6 rounded-md bg-teal text-[#05261f] font-semibold text-sm hover:brightness-110 transition-all"
          >
            Check your mints
          </Link>
          <a
            href="#how"
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            How it works
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-edge divide-x divide-edge">
        <Stat
          value={formatSol(BigInt(stats.total_recoverable_lamports))}
          unit="SOL"
          label="recoverable, indexed"
        />
        <Stat
          value={stats.recoverable_mints.toLocaleString()}
          label="mints with stuck SOL"
        />
        <Stat
          value={formatSol(BigInt(stats.total_recovered_lamports))}
          unit="SOL"
          label="recovered"
        />
        <Stat
          value={stats.total_recoveries.toLocaleString()}
          label="recoveries"
        />
      </div>
    </section>
  );
}

function Stat({
  value,
  unit,
  label,
}: {
  value: string;
  unit?: string;
  label: string;
}) {
  return (
    <div className="px-5 py-5 first:pl-0">
      <div className="font-mono text-xl text-ink">
        {value}
        {unit && <span className="text-xs text-muted ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
