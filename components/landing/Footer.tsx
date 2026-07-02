import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GITHUB_URL = "https://github.com/Horlahmee/solrescue";
const SIMD_URL =
  "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0266-efficient-token-program.md";

export function FinalCta() {
  return (
    <section className="py-20 border-t border-edge">
      <div className="bg-aurora-soft border border-edge rounded-3xl px-8 py-14 flex flex-col items-center text-center gap-6">
        <h2 className="font-display text-3xl sm:text-4xl leading-snug max-w-xl">
          Find out in 30 seconds if you have SOL waiting.
        </h2>
        <p className="text-muted max-w-md">
          Connect a wallet or just paste a mint address. No sign-ups, no
          deposits, nothing to lose — literally.
        </p>
        <Link
          href="/app"
          className="glow-teal inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-teal text-[#05261f] font-semibold hover:brightness-110 transition-all"
        >
          Launch app
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
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
        Source code (MIT)
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
      <span className="sm:ml-auto">
        Non-custodial. Your keys never leave your wallet.
      </span>
    </footer>
  );
}
