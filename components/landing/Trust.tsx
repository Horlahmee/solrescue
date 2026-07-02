import { Eye, KeyRound, ShieldCheck } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { SectionTag } from "./Explain";

const GITHUB_URL = "https://github.com/Horlahmee/solrescue";

export function Trust() {
  return (
    <section
      id="security"
      className="py-16 border-t border-edge flex flex-col gap-10"
    >
      <div className="flex flex-col gap-4 max-w-2xl">
        <SectionTag tone="teal">Security model</SectionTag>
        <h2 className="font-display text-3xl leading-snug">
          Built for people who assume every recovery tool is a drainer
        </h2>
        <p className="text-muted leading-relaxed">
          Healthy instinct. Here’s why you don’t have to trust us — you can
          verify every claim below against the source code and against the
          transaction your own wallet shows you.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <TrustCard
          icon={<KeyRound className="size-5 text-teal" aria-hidden />}
          title="We never touch keys. Ever."
          body="No key input exists anywhere in this product — not for wallets, not for mints, not in scripts. Signing happens exclusively inside your wallet extension. If your mint authority is revoked, we tell you the truth: we can't help."
        />
        <TrustCard
          icon={<Eye className="size-5 text-violet" aria-hidden />}
          title="Simulation before signature"
          body="Every transaction is simulated on-chain and the exact figures shown before the sign button exists. Your wallet's own preview shows the same two instructions. If simulation fails, signing is blocked."
        />
        <TrustCard
          icon={<ShieldCheck className="size-5 text-teal" aria-hidden />}
          title="Your SOL never routes through us"
          body="The withdraw instruction pays the full excess from the mint straight to your wallet. Our 10% fee is a separate instruction in the same atomic transaction — both happen or neither does. No deposits, no escrow, no upfront cost."
        />
        <TrustCard
          icon={<GithubIcon className="size-5 text-amber" />}
          title="Open source from commit one"
          body={
            <>
              The entire codebase — app, transaction builder, indexer — is
              public under MIT.{" "}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:underline underline-offset-4"
              >
                Read it, fork it, run it yourself.
              </a>
            </>
          }
        />
      </div>

      <div className="border border-amber/30 bg-amber/5 rounded-2xl p-6 flex flex-col gap-2">
        <div className="font-display text-lg text-amber">
          A warning about “revoked authority” recovery
        </div>
        <p className="text-sm text-muted leading-relaxed max-w-3xl">
          If a mint’s authority is revoked, the only thing that can sign a
          withdrawal is the mint account’s own private keypair. Some tools
          offer to do this if you paste that keypair into their website —
          promising it stays “in the browser” and gets “wiped after”.{" "}
          <span className="text-ink">
            You cannot verify either claim, and a pasted key is a compromised
            key.
          </span>{" "}
          We will never ask for a keypair, and we’d rather lose that market
          than normalize the habit that gets wallets drained.
        </p>
      </div>
    </section>
  );
}

export function Faq() {
  const items: Array<[string, React.ReactNode]> = [
    [
      "Is this a drainer?",
      "No — and you shouldn't take our word for it. The transaction you sign contains exactly two instructions, visible in your wallet's preview: the withdrawal from the mint to your wallet, and the fee transfer. The full source code is public. We never ask for keys, seeds, or deposits.",
    ],
    [
      "What does it cost?",
      "Nothing upfront. If a recovery succeeds, 10% of the recovered amount goes to us as a fee, inside the same transaction — you receive 90% plus you never risk a cent. If there's nothing to recover, you pay nothing.",
    ],
    [
      "How do I know if I have stuck SOL?",
      "Launch the app and connect your wallet — we check our index of every mainnet mint instantly. Or paste any mint address into the checker, no wallet needed.",
    ],
    [
      "My mint's authority is revoked. Can you help?",
      "No — and neither can anyone else, unless they hold the mint account's original private keypair. Be extremely wary of tools that ask you to paste that keypair into a website. That is exactly how wallets get drained.",
    ],
    [
      "Which wallets are supported?",
      "Phantom and Solflare, via the standard Solana wallet adapter. Desktop-first for now.",
    ],
    [
      "What about Token-2022 mints?",
      "Not yet — Token-2022 mints have different rent math due to extensions. Legacy SPL Token mints (the overwhelming majority) are fully supported. Token-2022 is on the roadmap.",
    ],
    [
      "What if my mint is owned by a multisig?",
      "We detect multisig authorities and flag them — the one-click flow only handles single-key authorities today. Reach out via GitHub and we'll help you build the transaction for your multisig.",
    ],
    [
      "Why does this work now when it never did before?",
      "The p-token upgrade (SIMD-0266, live on mainnet since epoch 971) rewrote the SPL Token program and added a withdraw_excess_lamports instruction. Stuck SOL became recoverable at the protocol level — SolRescue is an interface to that instruction, nothing more.",
    ],
  ];

  return (
    <section id="faq" className="py-16 border-t border-edge flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <SectionTag tone="violet">FAQ</SectionTag>
        <h2 className="font-display text-3xl leading-snug">
          Everything else you’d want to ask
        </h2>
      </div>
      <div className="flex flex-col gap-3 max-w-3xl">
        {items.map(([q, a]) => (
          <details
            key={q as string}
            className="group border border-edge rounded-xl bg-surface open:border-edge-2 transition-colors"
          >
            <summary className="cursor-pointer list-none px-5 py-4 font-medium flex items-center justify-between gap-4">
              {q}
              <span className="text-muted group-open:rotate-45 transition-transform text-lg leading-none">
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm text-muted leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function TrustCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="card-hover border border-edge rounded-2xl bg-surface p-6 flex flex-col gap-3">
      {icon}
      <div className="font-display">{title}</div>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </div>
  );
}
