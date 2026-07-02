import { SectionLabel } from "./Explain";

const GITHUB_URL = "https://github.com/Horlahmee/solrescue";

export function Trust() {
  const claims = [
    [
      "No keys, ever",
      "There is no key or seed input anywhere in this product. Signing happens only inside your wallet.",
    ],
    [
      "Funds never route through us",
      "The withdrawal pays your wallet directly. The 10% fee is a separate instruction in the same atomic transaction.",
    ],
    [
      "Simulation before signature",
      "Exact figures are shown from an on-chain simulation before you can sign. If simulation fails, signing is blocked.",
    ],
    [
      "Open source",
      "The entire codebase is public under MIT — app, transaction builder, indexer. Verify every claim on this page against it.",
    ],
  ] as const;

  return (
    <section
      id="security"
      className="py-20 border-t border-edge flex flex-col gap-12"
    >
      <div className="flex flex-col gap-4 max-w-2xl">
        <SectionLabel n="04">Security</SectionLabel>
        <h2 className="font-display text-3xl leading-snug">
          Assume every recovery tool is a drainer. Then verify this one.
        </h2>
      </div>

      <dl className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
        {claims.map(([title, body]) => (
          <div key={title} className="flex flex-col gap-2">
            <dt className="font-display">{title}</dt>
            <dd className="text-sm text-muted leading-relaxed">{body}</dd>
          </div>
        ))}
      </dl>

      <p className="text-sm text-muted leading-relaxed border-l-2 border-amber pl-4 max-w-2xl">
        <span className="text-amber font-medium">
          If a mint’s authority is revoked,
        </span>{" "}
        recovery requires the mint’s original private keypair. Tools that ask
        you to paste that keypair into a website are asking you to compromise
        it — no “wiped after use” promise is verifiable. We don’t offer this,
        and you shouldn’t accept it from anyone.
      </p>
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
    <section id="faq" className="py-20 border-t border-edge flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <SectionLabel n="05">FAQ</SectionLabel>
        <h2 className="font-display text-3xl leading-snug">Questions</h2>
      </div>
      <div className="flex flex-col max-w-3xl divide-y divide-edge border-y border-edge">
        {items.map(([q, a]) => (
          <details key={q} className="group">
            <summary className="cursor-pointer list-none py-5 font-medium flex items-center justify-between gap-4">
              {q}
              <span className="text-muted group-open:rotate-45 transition-transform text-lg leading-none">
                +
              </span>
            </summary>
            <p className="pb-5 text-sm text-muted leading-relaxed max-w-2xl">
              {a}
            </p>
          </details>
        ))}
      </div>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted hover:text-teal transition-colors"
      >
        More questions? Open an issue on GitHub →
      </a>
    </section>
  );
}
