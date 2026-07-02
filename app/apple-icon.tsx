import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — same mark as icon.svg, on the brand cream so it reads
// well against iOS rounded-corner masking.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f0e6",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 120,
            height: 120,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 14,
              width: 106,
              height: 106,
              background: "#14130f",
              borderRadius: 16,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 106,
              height: 106,
              background: "#00e5c3",
              border: "9px solid #14130f",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              fontWeight: 900,
              color: "#14130f",
            }}
          >
            S
          </div>
        </div>
      </div>
    ),
    size,
  );
}
