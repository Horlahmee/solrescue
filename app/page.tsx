import { Home } from "@/components/Home";

// Server component: FEE_BPS is server-side env (spec §3.3); the fee wallet is
// a public key, safe to pass to the client.
export default function Page() {
  return (
    <Home
      feeWallet={process.env.NEXT_PUBLIC_FEE_WALLET ?? ""}
      feeBps={Number(process.env.FEE_BPS ?? 1000)}
    />
  );
}
