export function Problem() {
  return (
    <section className="py-20 grid lg:grid-cols-2 gap-12 items-start">
      <div className="flex flex-col gap-4">
        <SectionLabel n="01">The problem</SectionLabel>
        <h2 className="font-display text-3xl leading-snug">
          SOL sent to a mint address used to be gone forever.
        </h2>
        <p className="text-muted leading-relaxed">
          Mint addresses look like wallet addresses, so SOL ends up inside
          them — misdirected transfers, airdrops, royalties. The p-token
          upgrade (SIMD-0266) added a withdraw instruction to the token
          program, and the mint authority can now sign that SOL back out. A
          protocol feature, used as intended.
        </p>
      </div>

      <div className="border border-edge rounded-lg bg-surface p-6 font-mono text-sm flex flex-col gap-3">
        <div className="text-xs text-muted uppercase tracking-wider">
          A stuck mint
        </div>
        <Ledger label="Account balance" value="0.50146 SOL" tone="ink" />
        <Ledger label="Rent-exempt minimum" value="0.00146 SOL" tone="muted" />
        <div className="border-t border-edge my-1" />
        <Ledger label="Recoverable" value="0.50000 SOL" tone="teal" />
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      title: "Connect",
      body: "We look up every indexed mint where your wallet is the authority — or paste any mint address to check it directly.",
    },
    {
      title: "Verify",
      body: "The transaction is built from live chain state and simulated. You see the exact figures before the sign button exists.",
    },
    {
      title: "Recover",
      body: "One signature. The SOL moves from the mint directly to your wallet — it never passes through us.",
    },
  ];

  return (
    <section id="how" className="py-20 border-t border-edge flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <SectionLabel n="02">How it works</SectionLabel>
        <h2 className="font-display text-3xl leading-snug">
          Three steps, one signature.
        </h2>
      </div>

      <ol className="grid sm:grid-cols-3 gap-8">
        {steps.map(({ title, body }, i) => (
          <li key={title} className="flex flex-col gap-3">
            <span className="font-mono text-xs text-muted">0{i + 1}</span>
            <div className="font-display text-lg">{title}</div>
            <p className="text-sm text-muted leading-relaxed">{body}</p>
          </li>
        ))}
      </ol>

      <div className="border border-edge rounded-lg bg-surface p-6 flex flex-col gap-4">
        <div className="text-xs text-muted uppercase tracking-wider">
          What you sign — exactly two instructions
        </div>
        <div className="font-mono text-xs sm:text-sm leading-relaxed">
          <div>
            <span className="text-muted">1 </span>
            <span className="text-teal">withdraw_excess_lamports</span>
            <span className="text-muted"> mint → your wallet · 100%</span>
          </div>
          <div>
            <span className="text-muted">2 </span>
            <span className="text-ink">transfer</span>
            <span className="text-muted"> your wallet → fee wallet · 10%</span>
          </div>
        </div>
        <p className="text-sm text-muted">
          Your wallet’s preview shows precisely this. If it ever shows more,
          reject it.
        </p>
      </div>
    </section>
  );
}

export function SectionLabel({
  n,
  children,
}: {
  n: string;
  children: React.ReactNode;
}) {
  return (
    <div className="font-mono text-xs uppercase tracking-widest text-muted">
      <span className="text-teal">{n}</span> · {children}
    </div>
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
