const LAMPORTS_PER_SOL = 1_000_000_000n;

// The single display boundary for lamports → SOL. Everything upstream stays
// bigint. Exact, full-precision — use for the user's actual money figures
// (recovery quote, success screen, mint card).
export function formatSol(lamports: bigint): string {
  const negative = lamports < 0n;
  const abs = negative ? -lamports : lamports;
  const whole = abs / LAMPORTS_PER_SOL;
  const fraction = (abs % LAMPORTS_PER_SOL)
    .toString()
    .padStart(9, '0')
    .replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

// Compact display for aggregate / discovery numbers (stat tiles, leaderboard):
// thousands-separated, sensibly rounded — never a 9-decimal tail. Values here
// are display-only and safely under 2^53, so number math is fine.
export function formatSolCompact(lamports: bigint): string {
  const sol = Number(lamports) / 1e9;
  const abs = Math.abs(sol);
  const digits = abs >= 1000 ? 0 : abs >= 1 ? 2 : abs >= 0.001 ? 4 : 6;
  return sol.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}
