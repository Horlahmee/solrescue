import Link from "next/link";

const GITHUB_URL = "https://github.com/Horlahmee/solrescue";
const SIMD_URL =
  "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0266-efficient-token-program.md";

export function FinalCta() {
  return (
    <section className="py-20 border-t-2 border-ink">
      <div className="nb rounded-xl bg-teal p-10 sm:p-14 flex flex-col items-start gap-6 shadow-[8px_8px_0_var(--color-ink)]">
        <h2 className="font-display font-bold text-3xl sm:text-5xl leading-tight max-w-2xl">
          Find out in thirty seconds.
        </h2>
        <p className="max-w-md font-medium">
          Connect a wallet or paste a mint address. No sign-up, no deposit.
        </p>
        <Link
          href="/app"
          className="nb-press inline-flex items-center h-12 px-7 rounded-md bg-ink text-surface font-bold border-2 border-ink shadow-[5px_5px_0_var(--color-surface)]"
        >
          Launch app →
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t-2 border-ink py-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold">
      <div className="font-display font-bold">
        Sol<span className="bg-teal px-1 border-2 border-ink">Rescue</span>
      </div>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline underline-offset-4 decoration-2"
      >
        Source (MIT)
      </a>
      <a
        href={SIMD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline underline-offset-4 decoration-2"
      >
        SIMD-0266
      </a>
      <a
        href={`${GITHUB_URL}/blob/main/SECURITY.md`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline underline-offset-4 decoration-2"
      >
        Security
      </a>
      <span className="sm:ml-auto text-muted">
        Non-custodial by construction.
      </span>
    </footer>
  );
}
