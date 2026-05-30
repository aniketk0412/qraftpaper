import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Home-screen icon for installed PWAs (iOS / Android / desktop). The
 * QraftPaper Q on deep navy.
 *
 * Geometry mirrors components/logo.tsx (cx 10.8, cy 11, r 7 in a 24-unit
 * box, tail from 14.8/15.2 to 19.2/19.6). At the 180 px iOS size each
 * SVG unit scales to 7.5 px after the 24→144 mapping below — the tail
 * pulled mostly outside the ring reads as "Q" even on a 60 px desktop
 * favicon, where the previous stub-tail design read as "circle with a
 * mark."
 */
export default function AppleIcon() {
  // Cream + accent so the mark sits comfortably on deep navy without the
  // teal disappearing into the background. Same palette as the favicon
  // and components/logo.tsx.
  // Tail runs a teal -> gold gradient (the brand's two-hue system), the
  // same treatment as components/logo.tsx and app/icon.svg.
  const ringColor = "#f1faee";
  const tailStart = "#5fc4c4";
  const tailEnd = "#f59e0b";
  const bg = "#1a2332";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
        }}
      >
        <svg
          width="144"
          height="144"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="qmark-tail"
              x1="14"
              y1="15"
              x2="20"
              y2="20"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor={tailStart} />
              <stop offset="1" stopColor={tailEnd} />
            </linearGradient>
          </defs>
          <circle
            cx="10.8"
            cy="11"
            r="7"
            stroke={ringColor}
            strokeWidth="2.8"
          />
          <path
            d="M14.8 15.2 L19.2 19.6"
            stroke="url(#qmark-tail)"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
