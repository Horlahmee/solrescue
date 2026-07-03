import { formatSolCompact } from "@/lib/formatSol";
import type { LeaderboardRow } from "./landing/data";

// Shared presentational table — server-rendered on the landing page,
// client-fetched on the app's pre-connect view.
export function TopMintsTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="nb rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-terminal text-terminal-ink text-xs uppercase tracking-wider">
              <th className="text-left font-bold px-5 py-3 w-10">#</th>
              <th className="text-left font-bold px-5 py-3">Mint</th>
              <th className="text-left font-bold px-5 py-3 hidden sm:table-cell">
                Authority
              </th>
              <th className="text-right font-bold px-5 py-3">Claimable</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-ink">
            {rows.map((row, i) => (
              <tr
                key={row.mint_address}
                className={i % 2 ? "bg-surface-2" : "bg-surface"}
              >
                <td className="px-5 py-3 font-mono text-muted">{i + 1}</td>
                <td className="px-5 py-3 font-mono font-bold whitespace-nowrap">
                  {row.token_symbol ??
                    `${row.mint_address.slice(0, 4)}…${row.mint_address.slice(-4)}`}
                </td>
                <td className="px-5 py-3 font-mono text-muted hidden sm:table-cell">
                  {row.authority
                    ? `${row.authority.slice(0, 4)}…${row.authority.slice(-4)}`
                    : "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="font-mono font-bold bg-teal border-2 border-ink px-2 py-0.5 whitespace-nowrap">
                    {formatSolCompact(BigInt(row.excess_lamports))} SOL
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
