export function Problem() {
  return (
    <section className="py-16 grid lg:grid-cols-2 gap-12 items-start">
      <div className="flex flex-col gap-5">
        <SectionLabel n="01" bg="bg-pink">
          The problem
        </SectionLabel>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
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

      <div className="nb rounded-lg p-6 font-mono text-sm flex flex-col gap-3 rotate-1">
        <div className="self-start bg-ink text-surface text-xs uppercase tracking-wider px-2 py-1 font-bold">
          A stuck mint
        </div>
        <Ledger label="Account balance" value="0.50146 SOL" />
        <Ledger label="Rent-exempt minimum" value="0.00146 SOL" muted />
        <div className="border-t-2 border-dashed border-ink my-1" />
        <div className="flex items-center justify-between gap-4 bg-teal border-2 border-ink px-3 py-2 font-bold">
          <span className="font-body text-sm">Recoverable</span>
          <span>0.50000 SOL</span>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      title: "Connect",
      bg: "bg-teal",
      body: "We look up every indexed mint where your wallet is the authority — or paste any mint address to check it directly.",
    },
    {
      title: "Verify",
      bg: "bg-amber",
      body: "The transaction is built from live chain state and simulated. You see the exact figures before the sign button exists.",
    },
    {
      title: "Recover",
      bg: "bg-pink",
      body: "One signature. The SOL moves from the mint directly to your wallet — it never passes through us.",
    },
  ];

  return (
    <section id="how" className="py-16 border-t-2 border-ink flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <SectionLabel n="02" bg="bg-teal">
          How it works
        </SectionLabel>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
          Three steps, one signature.
        </h2>
      </div>

      <ol className="grid sm:grid-cols-3 gap-6">
        {steps.map(({ title, body, bg }, i) => (
          <li key={title} className="nb rounded-lg p-6 flex flex-col gap-4">
            <span
              className={`${bg} border-2 border-ink size-10 flex items-center justify-center font-mono font-bold shadow-[3px_3px_0_var(--color-ink)]`}
            >
              {i + 1}
            </span>
            <div className="font-display font-bold text-xl">{title}</div>
            <p className="text-sm text-muted leading-relaxed">{body}</p>
          </li>
        ))}
      </ol>

      <div className="nb rounded-lg overflow-hidden">
        <div className="bg-terminal text-terminal-ink px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold">
          What you sign — exactly two instructions
        </div>
        <div className="bg-terminal text-terminal-ink px-6 pb-5 font-mono text-xs sm:text-sm leading-loose">
          <div>
            <span className="opacity-50">1 </span>
            <span className="text-teal">withdraw_excess_lamports</span>
            <span className="opacity-70"> mint → your wallet · 100%</span>
          </div>
          <div>
            <span className="opacity-50">2 </span>
            <span className="text-amber">transfer</span>
            <span className="opacity-70"> your wallet → fee wallet · 10%</span>
          </div>
        </div>
        <p className="px-6 py-4 text-sm font-semibold border-t-2 border-ink bg-surface">
          Your wallet’s preview shows precisely this. If it ever shows more —
          reject it.
        </p>
      </div>
    </section>
  );
}

export function SectionLabel({
  n,
  bg,
  children,
}: {
  n: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`self-start inline-flex items-center gap-2 ${bg} border-2 border-ink px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0_var(--color-ink)] -rotate-1`}
    >
      {n} / {children}
    </div>
  );
}

function Ledger({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted font-body text-sm">{label}</span>
      <span className={muted ? "text-muted" : "font-bold"}>{value}</span>
    </div>
  );
}
