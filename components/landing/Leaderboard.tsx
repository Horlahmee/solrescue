import Link from "next/link";
import { formatSol } from "@/lib/formatSol";
import { SectionLabel } from "./Explain";
import type { LeaderboardRow } from "./data";

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section className="py-16 border-t-2 border-ink flex flex-col gap-10">
      <div className="flex flex-col gap-5 max-w-2xl">
        <SectionLabel n="03" bg="bg-amber">
          Live index
        </SectionLabel>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
          The largest recoverable balances we’ve indexed
        </h2>
        <p className="text-muted leading-relaxed">
          Real, currently-recoverable balances from our continuous sweep of
          every legacy mint on mainnet.
        </p>
      </div>

      <div className="nb rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink text-surface text-xs uppercase tracking-wider">
              <th className="text-left font-bold px-5 py-3 w-10">#</th>
              <th className="text-left font-bold px-5 py-3">Mint</th>
              <th className="text-left font-bold px-5 py-3 hidden sm:table-cell">
                Authority
              </th>
              <th className="text-right font-bold px-5 py-3">Recoverable</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-ink">
            {rows.map((row, i) => (
              <tr
                key={row.mint_address}
                className={i % 2 ? "bg-surface-2" : "bg-surface"}
              >
                <td className="px-5 py-3.5 font-mono text-muted">{i + 1}</td>
                <td className="px-5 py-3.5 font-mono font-bold">
                  {row.token_symbol ??
                    `${row.mint_address.slice(0, 4)}…${row.mint_address.slice(-4)}`}
                </td>
                <td className="px-5 py-3.5 font-mono text-muted hidden sm:table-cell">
                  {row.authority
                    ? `${row.authority.slice(0, 4)}…${row.authority.slice(-4)}`
                    : "—"}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="font-mono font-bold bg-teal border-2 border-ink px-2 py-0.5 whitespace-nowrap">
                    {formatSol(BigInt(row.excess_lamports))} SOL
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/app"
        className="self-start font-semibold hover:underline underline-offset-4 decoration-2"
      >
        One of these yours? Connect and claim it →
      </Link>
    </section>
  );
}
