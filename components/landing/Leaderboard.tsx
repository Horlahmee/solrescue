import Link from "next/link";
import { formatSol } from "@/lib/formatSol";
import { SectionLabel } from "./Explain";
import type { LeaderboardRow } from "./data";

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section className="py-20 border-t border-edge flex flex-col gap-12">
      <div className="flex flex-col gap-4 max-w-2xl">
        <SectionLabel n="03">Live index</SectionLabel>
        <h2 className="font-display text-3xl leading-snug">
          The largest recoverable balances we’ve indexed
        </h2>
        <p className="text-muted leading-relaxed">
          Real, currently-recoverable balances from our continuous sweep of
          every legacy mint on mainnet.
        </p>
      </div>

      <table className="w-full text-sm border-y border-edge">
        <thead>
          <tr className="text-muted text-xs uppercase tracking-wider border-b border-edge">
            <th className="text-left font-medium py-3 pr-4 w-10">#</th>
            <th className="text-left font-medium py-3 pr-4">Mint</th>
            <th className="text-left font-medium py-3 pr-4 hidden sm:table-cell">
              Authority
            </th>
            <th className="text-right font-medium py-3">Recoverable</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge">
          {rows.map((row, i) => (
            <tr key={row.mint_address}>
              <td className="py-3.5 pr-4 font-mono text-muted">{i + 1}</td>
              <td className="py-3.5 pr-4 font-mono">
                {row.token_symbol ??
                  `${row.mint_address.slice(0, 4)}…${row.mint_address.slice(-4)}`}
              </td>
              <td className="py-3.5 pr-4 font-mono text-muted hidden sm:table-cell">
                {row.authority
                  ? `${row.authority.slice(0, 4)}…${row.authority.slice(-4)}`
                  : "—"}
              </td>
              <td className="py-3.5 text-right font-mono text-teal">
                {formatSol(BigInt(row.excess_lamports))} SOL
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link
        href="/app"
        className="text-sm text-muted hover:text-teal transition-colors self-start"
      >
        One of these yours? Connect and claim it →
      </Link>
    </section>
  );
}
