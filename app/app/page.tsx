import type { Metadata } from "next";
import { Home } from "@/components/Home";

export const metadata: Metadata = {
  title: "SolRescue App — recover your stuck SOL",
};

// Server component: FEE_BPS is server-side env (spec §3.3); the fee wallet is
// a public key, safe to pass to the client.
export default function AppPage() {
  return (
    <Home
      feeWallet={process.env.NEXT_PUBLIC_FEE_WALLET ?? ""}
      feeBps={Number(process.env.FEE_BPS ?? 1000)}
    />
  );
}
