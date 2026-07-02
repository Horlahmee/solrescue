"use client";

import { useEffect, useState } from "react";
import { createAnonClient } from "@/lib/supabaseClient";
import { formatSol } from "@/lib/formatSol";
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
      stats ? formatSol(BigInt(stats.total_recoverable_lamports)) : null,
      "text-teal",
    ],
    [
      "mints with stuck SOL",
      stats ? stats.recoverable_mints.toLocaleString() : null,
      "text-violet",
    ],
    [
      "SOL recovered",
      stats ? formatSol(BigInt(stats.total_recovered_lamports)) : null,
      "text-teal",
    ],
    [
      "recoveries",
      stats ? stats.total_recoveries.toLocaleString() : null,
      "text-amber",
    ],
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-edge border border-edge rounded-xl overflow-hidden">
      {items.map(([label, value, tone]) => (
        <div key={label} className="bg-surface px-4 py-3.5">
          {value === null ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <div className={`font-mono text-lg animate-fade-in ${tone}`}>
              {value}
            </div>
          )}
          <div className="text-xs text-muted mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
