import { PlugZap, ScanSearch, Send } from "lucide-react";

export function Problem() {
  return (
    <section className="py-16 border-t border-edge grid lg:grid-cols-2 gap-10 items-start">
      <div className="flex flex-col gap-4">
        <SectionTag tone="violet">The problem</SectionTag>
        <h2 className="font-display text-3xl leading-snug">
          How does SOL get stuck in a mint?
        </h2>
        <p className="text-muted leading-relaxed">
          A token mint address looks exactly like a wallet address. People
          airdrop to it, route royalties to it, or fat-finger a transfer — and
          the SOL lands inside the mint account, above its rent-exempt
          minimum. Across Solana, public analyses count{" "}
          <span className="text-ink">hundreds of thousands of mints</span>{" "}
          holding stranded SOL this way.
        </p>
        <p className="text-muted leading-relaxed">
          Until 2026 that SOL was unreachable — mint accounts had no withdraw
          instruction. The p-token upgrade (SIMD-0266) added{" "}
          <code className="font-mono text-sm text-teal">
            withdraw_excess_lamports
          </code>
          , and the mint authority can now sign it out. That’s the entire
          trick. No loopholes, no exploits — a protocol feature, used as
          intended.
        </p>
      </div>

      <div className="border border-edge rounded-2xl bg-surface p-6 font-mono text-sm flex flex-col gap-3">
        <div className="text-xs text-muted uppercase tracking-wider">
          Anatomy of a stuck mint
        </div>
        <Ledger label="Mint account balance" value="0.50146 SOL" tone="ink" />
        <Ledger
          label="Rent-exempt minimum (locked)"
          value="0.00146 SOL"
          tone="muted"
        />
        <div className="border-t border-dashed border-edge-2 my-1" />
        <Ledger label="Excess — recoverable" value="0.50000 SOL" tone="teal" />
        <div className="text-xs text-muted font-body mt-2 leading-relaxed">
          Anything above the rent floor is excess. The authority signs once and
          it moves back to their wallet.
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      icon: PlugZap,
      title: "Connect",
      body: "Connect Phantom or Solflare. We look up every mint in our index where your wallet is the authority — or paste any mint address to check it directly.",
    },
    {
      icon: ScanSearch,
      title: "Verify",
      body: "Before you can sign, we re-read the mint from the chain, build the transaction, and simulate it. You see the exact figures: what you receive, what the fee is.",
    },
    {
      icon: Send,
      title: "Recover",
      body: "One signature in your wallet. The SOL moves from the mint directly to you — it never passes through us. Done in seconds, verifiable on Solscan.",
    },
  ];

  return (
    <section id="how" className="py-16 border-t border-edge flex flex-col gap-10">
      <div className="flex flex-col gap-4 max-w-2xl">
        <SectionTag tone="teal">How it works</SectionTag>
        <h2 className="font-display text-3xl leading-snug">
          Three steps. One signature. Zero trust required.
        </h2>
      </div>

      <ol className="grid sm:grid-cols-3 gap-4">
        {steps.map(({ icon: Icon, title, body }, i) => (
          <li
            key={title}
            className="card-hover border border-edge rounded-2xl bg-surface p-6 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <Icon className="size-5 text-teal" aria-hidden />
              <span className="font-mono text-xs text-muted">0{i + 1}</span>
            </div>
            <div className="font-display text-lg">{title}</div>
            <p className="text-sm text-muted leading-relaxed">{body}</p>
          </li>
        ))}
      </ol>

      <div className="border border-edge rounded-2xl bg-surface-2 p-6 lg:p-8 grid lg:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-xl">What you actually sign</h3>
          <p className="text-sm text-muted leading-relaxed max-w-xl">
            The transaction contains exactly two instructions — nothing else,
            ever. Your wallet’s preview will show precisely this. If it shows
            anything more, reject it.
          </p>
        </div>
        <div className="font-mono text-xs sm:text-sm bg-bg border border-edge rounded-xl p-4 leading-relaxed min-w-0">
          <div>
            <span className="text-muted">1</span>{" "}
            <span className="text-teal">withdraw_excess_lamports</span>
            <span className="text-muted"> · mint → </span>
            <span className="text-ink">your wallet</span>
            <span className="text-muted"> (100%)</span>
          </div>
          <div>
            <span className="text-muted">2</span>{" "}
            <span className="text-violet">system_transfer</span>
            <span className="text-muted"> · your wallet → fee wallet </span>
            <span className="text-amber">(10%)</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionTag({
  tone,
  children,
}: {
  tone: "teal" | "violet" | "amber";
  children: React.ReactNode;
}) {
  const tones = {
    teal: "text-teal border-teal/30 bg-teal/5",
    violet: "text-violet border-violet/30 bg-violet/5",
    amber: "text-amber border-amber/30 bg-amber/5",
  };
  return (
    <span
      className={`self-start font-mono text-xs uppercase tracking-widest border rounded-full px-3 py-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Ledger({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ink" | "muted" | "teal";
}) {
  const tones = { ink: "text-ink", muted: "text-muted", teal: "text-teal" };
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted font-body text-sm">{label}</span>
      <span className={tones[tone]}>{value}</span>
    </div>
  );
}
