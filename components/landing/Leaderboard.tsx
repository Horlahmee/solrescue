import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatSol } from "@/lib/formatSol";
import { SectionTag } from "./Explain";
import type { LeaderboardRow } from "./data";

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section className="py-16 border-t border-edge flex flex-col gap-8">
      <div className="flex flex-col gap-4 max-w-2xl">
        <SectionTag tone="amber">Live index</SectionTag>
        <h2 className="font-display text-3xl leading-snug">
          The biggest recoverable balances we’ve found
        </h2>
        <p className="text-muted leading-relaxed">
          Our indexer continuously sweeps every legacy token mint on mainnet.
          These are real, currently-recoverable balances — waiting for their
          authority to claim them.
        </p>
      </div>

      <div className="border border-edge rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2 text-muted text-xs uppercase tracking-wider">
              <th className="text-left font-medium px-5 py-3">#</th>
              <th className="text-left font-medium px-5 py-3">Mint</th>
              <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">
                Authority
              </th>
              <th className="text-right font-medium px-5 py-3">Recoverable</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.mint_address}
                className="bg-surface border-t border-edge"
              >
                <td className="px-5 py-3.5 font-mono text-muted">{i + 1}</td>
                <td className="px-5 py-3.5">
                  <span className="font-mono">
                    {row.token_symbol ??
                      `${row.mint_address.slice(0, 4)}…${row.mint_address.slice(-4)}`}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-muted hidden sm:table-cell">
                  {row.authority
                    ? `${row.authority.slice(0, 4)}…${row.authority.slice(-4)}`
                    : "—"}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-teal">
                  {formatSol(BigInt(row.excess_lamports))} SOL
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/app"
        className="self-start inline-flex items-center gap-2 text-sm text-teal hover:underline underline-offset-4"
      >
        One of these yours? Connect and claim it
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
