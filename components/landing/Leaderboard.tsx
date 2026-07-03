import Link from "next/link";
import { SectionLabel } from "./Explain";
import { IndexTotals, TopMintsTable } from "../TopMintsTable";
import { LEADERBOARD_LIMIT, type LeaderboardRow } from "./data";
import type { LandingStats } from "./data";

export function Leaderboard({
  rows,
  stats,
}: {
  rows: LeaderboardRow[];
  stats: LandingStats;
}) {
  if (rows.length === 0) return null;

  return (
    <section className="py-16 border-t-2 border-ink flex flex-col gap-10">
      <div className="flex flex-col gap-5 max-w-2xl">
        <SectionLabel n="03" bg="bg-amber">
          Live index
        </SectionLabel>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
          The top {LEADERBOARD_LIMIT} of every recoverable mint on mainnet
        </h2>
        <IndexTotals
          mints={stats.recoverable_mints}
          totalLamports={stats.total_recoverable_lamports}
        />
        <p className="text-muted leading-relaxed">
          Real, currently-recoverable balances from our continuous sweep of
          every legacy mint — and we’re still counting. If your wallet is the
          authority of one of these, it’s already yours; go get it.
        </p>
      </div>

      <TopMintsTable rows={rows} />

      <Link
        href="/app"
        className="self-start font-semibold hover:underline underline-offset-4 decoration-2"
      >
        One of these yours? Connect and claim it →
      </Link>
    </section>
  );
}
