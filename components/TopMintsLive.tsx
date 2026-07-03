"use client";

import { useEffect, useState } from "react";
import { createAnonClient } from "@/lib/supabaseClient";
import {
  LEADERBOARD_LIMIT,
  type LeaderboardRow,
} from "./landing/data";
import { IndexTotals, TopMintsTable } from "./TopMintsTable";
import { Skeleton } from "./ui";

interface Totals {
  mints: number;
  lamports: number;
}

// Pre-connect leaderboard for the app page — client-fetched, hidden by the
// parent as soon as a wallet connects.
export function TopMintsLive() {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    const client = createAnonClient();
    // Swallow errors to an empty list — this is a secondary marketing widget,
    // not the recovery path, so a DB hiccup just hides it rather than erroring.
    client
      .from("mints")
      .select(
        "mint_address, authority, excess_lamports, token_name, token_symbol",
      )
      .eq("authority_revoked", false)
      .gt("excess_lamports", 0)
      .order("excess_lamports", { ascending: false })
      .limit(LEADERBOARD_LIMIT)
      .then(({ data }) => setRows((data as LeaderboardRow[]) ?? []))
      .then(undefined, () => setRows([]));

    client
      .from("stats")
      .select("recoverable_mints, total_recoverable_lamports")
      .single()
      .then(({ data }) => {
        if (data)
          setTotals({
            mints: data.recoverable_mints as number,
            lamports: data.total_recoverable_lamports as number,
          });
      })
      .then(undefined, () => {});
  }, []);

  if (rows !== null && rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 animate-fade-up">
      <div className="flex flex-col gap-3">
        <h3 className="font-display font-bold text-xl">
          Top {LEADERBOARD_LIMIT} of every recoverable mint
        </h3>
        <IndexTotals
          mints={totals?.mints ?? null}
          totalLamports={totals?.lamports ?? null}
        />
        <p className="text-sm text-muted">
          Live from our mainnet index, still counting. Connect the authority
          wallet and it’s yours.
        </p>
      </div>
      {rows === null ? (
        <Skeleton className="h-72 rounded-lg" />
      ) : (
        <TopMintsTable rows={rows} />
      )}
    </section>
  );
}
