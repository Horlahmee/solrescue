import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecovery } from "@/lib/recoveries";
import { formatSol } from "@/lib/formatSol";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sig: string }>;
}): Promise<Metadata> {
  const { sig } = await params;
  const recovery = await getRecovery(sig);
  if (!recovery) return { title: "SolRescue" };
  const net = formatSol(
    BigInt(recovery.recovered_lamports - recovery.fee_lamports),
  );
  return {
    title: `${net} SOL recovered — SolRescue`,
    description:
      "SOL that was stuck in a mint account, recovered in one signed transaction. Non-custodial, open source.",
    twitter: { card: "summary_large_image" },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ sig: string }>;
}) {
  const { sig } = await params;
  const recovery = await getRecovery(sig);
  if (!recovery) notFound();

  const net = BigInt(recovery.recovered_lamports - recovery.fee_lamports);
  const short = `${recovery.mint_address.slice(0, 4)}…${recovery.mint_address.slice(-4)}`;

  return (
    <main className="max-w-xl mx-auto px-6 py-16 flex flex-col gap-8 min-h-dvh justify-center">
      <div className="nb rounded-xl p-8 sm:p-10 flex flex-col items-center gap-6 shadow-[8px_8px_0_var(--color-ink)]">
        <div className="font-display font-bold text-lg">
          Sol<span className="bg-teal px-1 border-2 border-ink">Rescue</span>
        </div>
        <div className="text-center">
          <div className="font-display font-bold text-4xl">
            <span className="font-mono bg-teal border-2 border-ink px-2">
              {formatSol(net)}
            </span>{" "}
            SOL recovered
          </div>
          <p className="text-muted mt-3 text-sm">
            from mint <span className="font-mono">{short}</span> — SOL that
            used to be stuck forever, returned in one signed transaction.
          </p>
        </div>
        <a
          href={`https://solscan.io/tx/${recovery.tx_signature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm font-bold hover:underline underline-offset-4 decoration-2"
        >
          Verify on Solscan →
        </a>
        <Link
          href="/app"
          className="nb-press inline-flex items-center h-12 px-7 rounded-md bg-ink text-surface font-bold border-2 border-ink shadow-[5px_5px_0_var(--color-teal)]"
        >
          Check your own mints →
        </Link>
      </div>
      <p className="text-center text-sm text-muted">
        Non-custodial. Open source. Your keys never leave your wallet.
      </p>
    </main>
  );
}
