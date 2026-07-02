import Link from "next/link";
import { formatSol } from "@/lib/formatSol";
import { GithubIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { LandingStats } from "./data";

const GITHUB_URL = "https://github.com/Horlahmee/solrescue";

export function Nav() {
  return (
    <nav className="flex items-center justify-between py-5">
      <div className="font-display font-bold text-lg tracking-tight">
        Sol<span className="bg-teal px-1 border-2 border-ink">Rescue</span>
      </div>
      <div className="hidden sm:flex items-center gap-7 text-sm font-semibold">
        <a href="#how" className="hover:underline underline-offset-4 decoration-2">
          How it works
        </a>
        <a href="#security" className="hover:underline underline-offset-4 decoration-2">
          Security
        </a>
        <a href="#faq" className="hover:underline underline-offset-4 decoration-2">
          FAQ
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline underline-offset-4 decoration-2 inline-flex items-center gap-1.5"
        >
          <GithubIcon className="size-4" /> Source
        </a>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/app"
          className="nb-press inline-flex items-center h-10 px-4 rounded-md bg-teal font-bold text-sm border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]"
        >
          Launch app
        </Link>
      </div>
    </nav>
  );
}

export function Hero({ stats }: { stats: LandingStats }) {
  return (
    <section className="pt-20 pb-16 flex flex-col gap-12 animate-fade-up">
      <div className="flex flex-col gap-7 max-w-3xl">
        <h1 className="font-display font-bold text-5xl sm:text-[4.2rem] leading-[1.04] tracking-tight">
          Recover the SOL{" "}
          <span className="inline-block bg-teal border-2 border-ink px-3 shadow-[5px_5px_0_var(--color-ink)] -rotate-1">
            stuck
          </span>{" "}
          in your mint accounts.
        </h1>
        <p className="text-lg leading-relaxed max-w-xl text-muted font-medium">
          If your wallet is the mint authority,{" "}
          <em className="text-ink">one signed transaction</em> returns it.
          Non-custodial, open source, simulated before you sign.
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <Link
            href="/app"
            className="nb-press inline-flex items-center h-12 px-7 rounded-md bg-ink text-surface font-bold border-2 border-ink shadow-[5px_5px_0_var(--color-teal)]"
          >
            Check your mints →
          </Link>
          <a
            href="#how"
            className="font-semibold hover:underline underline-offset-4 decoration-2"
          >
            How it works
          </a>
        </div>
      </div>

      <div className="nb rounded-lg grid grid-cols-2 sm:grid-cols-4 divide-x-2 divide-y-2 sm:divide-y-0 divide-ink overflow-hidden">
        <Stat
          value={formatSol(BigInt(stats.total_recoverable_lamports))}
          unit="SOL"
          label="recoverable, indexed"
          bg="bg-teal"
        />
        <Stat
          value={stats.recoverable_mints.toLocaleString()}
          label="mints with stuck SOL"
          bg="bg-surface"
        />
        <Stat
          value={formatSol(BigInt(stats.total_recovered_lamports))}
          unit="SOL"
          label="recovered"
          bg="bg-amber"
        />
        <Stat
          value={stats.total_recoveries.toLocaleString()}
          label="recoveries"
          bg="bg-surface"
        />
      </div>
    </section>
  );
}

function Stat({
  value,
  unit,
  label,
  bg,
}: {
  value: string;
  unit?: string;
  label: string;
  bg: string;
}) {
  return (
    <div className={`px-5 py-5 ${bg}`}>
      <div className="font-mono font-bold text-2xl">
        {value}
        {unit && <span className="text-xs font-normal ml-1">{unit}</span>}
      </div>
      <div className="text-xs font-semibold mt-1 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
