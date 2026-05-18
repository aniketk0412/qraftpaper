import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Home-screen icon for installed PWAs (iOS / Android / desktop) — the
// QraftPaper "Q" mark (white ring + azure tail) on the brand black.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080808",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "108px",
            height: "108px",
          }}
        >
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              border: "13px solid #ffffff",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "0px",
              bottom: "0px",
              width: "48px",
              height: "14px",
              borderRadius: "7px",
              background: "#4d93ff",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
