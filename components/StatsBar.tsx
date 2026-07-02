"use client";

import { useEffect, useState } from "react";
import { createAnonClient } from "@/lib/supabaseClient";
import { formatSol } from "@/lib/formatSol";

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

  if (!stats) return null;

  const items: Array<[string, string]> = [
    [
      "recoverable SOL indexed",
      formatSol(BigInt(stats.total_recoverable_lamports)),
    ],
    ["mints with stuck SOL", stats.recoverable_mints.toLocaleString()],
    ["SOL recovered", formatSol(BigInt(stats.total_recovered_lamports))],
    ["recoveries", stats.total_recoveries.toLocaleString()],
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-edge border border-edge rounded-lg overflow-hidden">
      {items.map(([label, value]) => (
        <div key={label} className="bg-surface px-4 py-3">
          <div className="font-mono text-lg text-teal">{value}</div>
          <div className="text-xs text-muted mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
