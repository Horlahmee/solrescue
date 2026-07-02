"use client";

import { useEffect, useState } from "react";
import { createAnonClient } from "@/lib/supabaseClient";
import {
  LEADERBOARD_LIMIT,
  type LeaderboardRow,
} from "./landing/data";
import { TopMintsTable } from "./TopMintsTable";
import { Skeleton } from "./ui";

// Pre-connect leaderboard for the app page — client-fetched, hidden by the
// parent as soon as a wallet connects.
export function TopMintsLive() {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    createAnonClient()
      .from("mints")
      .select(
        "mint_address, authority, excess_lamports, token_name, token_symbol",
      )
      .eq("authority_revoked", false)
      .gt("excess_lamports", 0)
      .order("excess_lamports", { ascending: false })
      .limit(LEADERBOARD_LIMIT)
      .then(({ data }) => setRows((data as LeaderboardRow[]) ?? []));
  }, []);

  if (rows !== null && rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 animate-fade-up">
      <div>
        <h3 className="font-display font-bold text-xl">
          Top {LEADERBOARD_LIMIT} claimable balances
        </h3>
        <p className="text-sm text-muted mt-1">
          Live from our mainnet index. Connect the authority wallet and it’s
          yours.
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
