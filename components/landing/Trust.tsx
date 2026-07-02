import { SectionLabel } from "./Explain";

const GITHUB_URL = "https://github.com/Horlahmee/solrescue";

export function Trust() {
  const claims = [
    [
      "No keys, ever",
      "There is no key or seed input anywhere in this product. Signing happens only inside your wallet.",
      "bg-teal",
    ],
    [
      "Funds never route through us",
      "The withdrawal pays your wallet directly. The 10% fee is a separate instruction in the same atomic transaction.",
      "bg-amber",
    ],
    [
      "Simulation before signature",
      "Exact figures are shown from an on-chain simulation before you can sign. If simulation fails, signing is blocked.",
      "bg-pink",
    ],
    [
      "Open source",
      "The entire codebase is public under MIT — app, transaction builder, indexer. Verify every claim on this page against it.",
      "bg-surface-2",
    ],
  ] as const;

  return (
    <section
      id="security"
      className="py-16 border-t-2 border-ink flex flex-col gap-10"
    >
      <div className="flex flex-col gap-5 max-w-2xl">
        <SectionLabel n="04" bg="bg-teal">
          Security
        </SectionLabel>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
          Assume every recovery tool is a drainer. Then verify this one.
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {claims.map(([title, body, bg]) => (
          <div key={title} className="nb rounded-lg overflow-hidden">
            <div className={`${bg} border-b-2 border-ink px-5 py-3 font-display font-bold`}>
              {title}
            </div>
            <p className="px-5 py-4 text-sm text-muted leading-relaxed">
              {body}
            </p>
          </div>
        ))}
      </div>

      <div className="nb rounded-lg bg-amber p-6 flex flex-col gap-2 -rotate-[0.5deg]">
        <div className="font-display font-bold text-lg">
          ⚠ About “revoked authority” recovery
        </div>
        <p className="text-sm leading-relaxed max-w-2xl">
          If a mint’s authority is revoked, recovery requires the mint’s
          original private keypair. Tools that ask you to paste that keypair
          into a website are asking you to compromise it — no “wiped after
          use” promise is verifiable.{" "}
          <span className="font-bold">
            We don’t offer this, and you shouldn’t accept it from anyone.
          </span>
        </p>
      </div>
    </section>
  );
}

export function Faq() {
  const items: Array<[string, string]> = [
    [
      "Is this a drainer?",
      "Verify it yourself: the transaction contains exactly two instructions, visible in your wallet's preview — the withdrawal to your wallet and the fee. The source code is public. We never ask for keys or deposits.",
    ],
    [
      "What does it cost?",
      "Nothing upfront. 10% of a successful recovery, taken inside the same transaction. No recovery, no cost.",
    ],
    [
      "How do I know if I have stuck SOL?",
      "Connect your wallet in the app, or paste any mint address into the checker — no wallet needed.",
    ],
    [
      "My mint's authority is revoked. Can you help?",
      "No. Only the mint's original keypair can sign, and we never accept keypairs. Be wary of anyone who does.",
    ],
    [
      "Why does this work now?",
      "The p-token upgrade (SIMD-0266, live since epoch 971) added withdraw_excess_lamports to the token program. SolRescue is an interface to that instruction — nothing more.",
    ],
  ];

  return (
    <section id="faq" className="py-16 border-t-2 border-ink flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <SectionLabel n="05" bg="bg-pink">
          FAQ
        </SectionLabel>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
          Questions
        </h2>
      </div>
      <div className="flex flex-col gap-4 max-w-3xl">
        {items.map(([q, a]) => (
          <details key={q} className="nb rounded-lg group open:shadow-none open:translate-x-[4px] open:translate-y-[4px] transition-all">
            <summary className="cursor-pointer list-none px-5 py-4 font-bold flex items-center justify-between gap-4">
              {q}
              <span className="border-2 border-ink size-6 flex items-center justify-center text-sm bg-surface-2 group-open:rotate-45 group-open:bg-teal transition-all shrink-0">
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm text-muted leading-relaxed max-w-2xl">
              {a}
            </p>
          </details>
        ))}
      </div>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold hover:underline underline-offset-4 decoration-2 self-start"
      >
        More questions? Open an issue on GitHub →
      </a>
    </section>
  );
}
