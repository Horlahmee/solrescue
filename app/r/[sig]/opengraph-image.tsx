import { ImageResponse } from "next/og";
import { getRecovery, netLamports } from "@/lib/recoveries";
import { formatSol } from "@/lib/formatSol";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SOL recovered with SolRescue";

// The neubrutalist share card X unfurls when a recovery link is tweeted.
export default async function OgImage({
  params,
}: {
  params: Promise<{ sig: string }>;
}) {
  const { sig } = await params;
  const recovery = await getRecovery(sig);
  const net = recovery
    ? formatSol(netLamports(recovery))
    : "";
  const mint = recovery
    ? `${recovery.mint_address.slice(0, 4)}…${recovery.mint_address.slice(-4)}`
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f0e6",
          gap: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 800,
            color: "#14130f",
            alignItems: "center",
            gap: 4,
          }}
        >
          Sol
          <span
            style={{
              background: "#00e5c3",
              border: "4px solid #14130f",
              padding: "0 10px",
              display: "flex",
            }}
          >
            Rescue
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "#fffdf7",
            border: "5px solid #14130f",
            boxShadow: "14px 14px 0 #14130f",
            borderRadius: 18,
            padding: "56px 88px",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontSize: 88,
              fontWeight: 800,
              color: "#14130f",
            }}
          >
            <span
              style={{
                background: "#00e5c3",
                border: "5px solid #14130f",
                padding: "0 20px",
                display: "flex",
              }}
            >
              {net ? net : "SOL"}
            </span>
            <span style={{ display: "flex" }}>
              {net ? "SOL recovered" : "recovered"}
            </span>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#56534a" }}>
            {mint
              ? `from a stuck mint account · ${mint} · one signed transaction`
              : "from stuck Solana mint accounts — one signed transaction"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            color: "#14130f",
          }}
        >
          solrescue.techgeniehq.com · non-custodial · open source
        </div>
      </div>
    ),
    size,
  );
}
