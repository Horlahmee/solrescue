import Link from "next/link";
import { SectionLabel } from "./Explain";
import { TopMintsTable } from "../TopMintsTable";
import { LEADERBOARD_LIMIT, type LeaderboardRow } from "./data";

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section className="py-16 border-t-2 border-ink flex flex-col gap-10">
      <div className="flex flex-col gap-5 max-w-2xl">
        <SectionLabel n="03" bg="bg-amber">
          Live index
        </SectionLabel>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
          The top {LEADERBOARD_LIMIT} claimable balances on mainnet
        </h2>
        <p className="text-muted leading-relaxed">
          Real, currently-recoverable balances from our continuous sweep of
          every legacy mint. If your wallet is the authority of one of these,
          it’s already yours — go get it.
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
