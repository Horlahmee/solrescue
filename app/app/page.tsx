import type { Metadata } from "next";
import { Home } from "@/components/Home";

export const metadata: Metadata = {
  title: "SolRescue App — recover your stuck SOL",
};

function resolveFeeBps(): number {
  const feeBps = Number(process.env.FEE_BPS ?? 1000);
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
    // Fail loud in the server logs rather than passing NaN into the fee math.
    throw new Error(`FEE_BPS must be an integer in [0, 10000], got "${process.env.FEE_BPS}"`);
  }
  return feeBps;
}

// Server component: FEE_BPS is server-side env (spec §3.3); the fee wallet is
// a public key, safe to pass to the client.
export default function AppPage() {
  return (
    <Home
      feeWallet={process.env.NEXT_PUBLIC_FEE_WALLET ?? ""}
      feeBps={resolveFeeBps()}
    />
  );
}
