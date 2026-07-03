"use client";

import { useEffect, useState } from "react";
import { createAnonClient } from "@/lib/supabaseClient";
import { formatSolCompact } from "@/lib/formatSol";
import { Skeleton } from "./ui";

interface Stats {
  total_recoverable_lamports: number;
  recoverable_mints: number;
  total_recovered_lamports: number;
  total_recoveries: number;
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    createAnonClient()
      .from("stats")
      .select("*")
      .single()
      .then(({ data }) => {
        if (data) setStats(data as Stats);
      });
  }, []);

  const items: Array<[string, string | null, string]> = [
    [
      "recoverable SOL indexed",
      stats ? formatSolCompact(BigInt(stats.total_recoverable_lamports)) : null,
      "bg-teal",
    ],
    [
      "mints with stuck SOL",
      stats ? stats.recoverable_mints.toLocaleString() : null,
      "bg-surface",
    ],
    [
      "SOL recovered",
      stats ? formatSolCompact(BigInt(stats.total_recovered_lamports)) : null,
      "bg-amber",
    ],
    [
      "recoveries",
      stats ? stats.total_recoveries.toLocaleString() : null,
      "bg-surface",
    ],
  ];

  return (
    <div className="nb rounded-lg grid grid-cols-2 sm:grid-cols-4 divide-x-2 divide-y-2 sm:divide-y-0 divide-ink overflow-hidden">
      {items.map(([label, value, bg]) => (
        <div key={label} className={`px-4 py-4 ${bg}`}>
          {value === null ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <div className="font-mono font-bold text-lg animate-fade-in">
              {value}
            </div>
          )}
          <div className="text-xs font-semibold uppercase tracking-wide mt-1">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
