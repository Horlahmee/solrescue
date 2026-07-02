import Link from "next/link";

const GITHUB_URL = "https://github.com/Horlahmee/solrescue";
const SIMD_URL =
  "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0266-efficient-token-program.md";

export function FinalCta() {
  return (
    <section className="py-24 border-t border-edge flex flex-col items-start gap-6">
      <h2 className="font-display text-3xl sm:text-4xl leading-snug max-w-xl">
        Find out in thirty seconds.
      </h2>
      <p className="text-muted max-w-md">
        Connect a wallet or paste a mint address. No sign-up, no deposit.
      </p>
      <Link
        href="/app"
        className="inline-flex items-center h-11 px-6 rounded-md bg-teal text-[#05261f] font-semibold text-sm hover:brightness-110 transition-all"
      >
        Launch app
      </Link>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-edge py-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
      <div className="font-display text-ink">
        Sol<span className="text-teal">Rescue</span>
      </div>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-teal transition-colors"
      >
        Source (MIT)
      </a>
      <a
        href={SIMD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-teal transition-colors"
      >
        SIMD-0266
      </a>
      <a
        href={`${GITHUB_URL}/blob/main/SECURITY.md`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-teal transition-colors"
      >
        Security
      </a>
      <span className="sm:ml-auto">Non-custodial by construction.</span>
    </footer>
  );
}
