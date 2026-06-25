import type { ReactElement } from "react";

/**
 * Shared primitives for the next/og share cards:
 *   - app/opengraph-image.tsx          (site card)
 *   - app/take/[id]/opengraph-image.tsx        (shared quiz)
 *   - app/exam-papers/[slug]/opengraph-image.tsx (exam paper)
 *
 * Light "ivory paper" theme. Kept in one place so the cards stay visually
 * identical and a palette / brand / font tweak is a one-file change. Each
 * card keeps its own distinct layout inline; only the repeated boilerplate
 * lives here.
 */

export const OG = {
  INK: "#1a2332",
  MUTED: "#4a5f6f",
  SUBTLE: "#5a6c7a",
  TEAL: "#1f7d7d",
  TEAL_SOFT: "#2f9a9a",
  LINE: "rgba(26,35,50,0.12)",
} as const;

const gridSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'>
  <defs>
    <pattern id='minor' width='40' height='40' patternUnits='userSpaceOnUse'>
      <path d='M40 0H0V40' fill='none' stroke='rgba(26,35,50,0.06)' stroke-width='1'/>
    </pattern>
    <pattern id='major' width='200' height='200' patternUnits='userSpaceOnUse'>
      <path d='M200 0H0V200' fill='none' stroke='rgba(31,125,125,0.13)' stroke-width='1.2'/>
    </pattern>
  </defs>
  <rect width='1200' height='630' fill='url(#minor)'/>
  <rect width='1200' height='630' fill='url(#major)'/>
</svg>`;

/** Graph-paper grid as an inline SVG data URI (Satori doesn't tile CSS grids). */
export const ogGridUri = `data:image/svg+xml;utf8,${encodeURIComponent(gridSvg)}`;

/** The warm cream backdrop (grid sits on top of this) shared by every card. */
export const ogBackground =
  "radial-gradient(820px 520px at 88% -6%, rgba(31,125,125,0.16), transparent 60%), radial-gradient(620px 420px at -4% 104%, rgba(31,125,125,0.10), transparent 60%), #ece5d8";

const FONT_BASE =
  "https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest";

/**
 * Load the real brand font (Plus Jakarta Sans) for ImageResponse, ready to
 * spread into its `fonts` option. Fetched from the Fontsource CDN at
 * generation time — Satori can't see the app's next/font, and the
 * bundled-asset pattern isn't supported under Turbopack. Vercel caches the
 * generated card after first render.
 */
export async function loadOgFonts() {
  const weights = [400, 600, 700] as const;
  const data = await Promise.all(
    weights.map((w) =>
      fetch(`${FONT_BASE}/latin-${w}-normal.ttf`).then((r) => r.arrayBuffer()),
    ),
  );
  return weights.map((weight, i) => ({
    name: "Plus Jakarta Sans",
    data: data[i],
    weight,
    style: "normal" as const,
  }));
}

/**
 * Q mark + wordmark header, shared across all share cards. Called as a plain
 * function ({OgBrandHeader()}) rather than a JSX element so the returned tree
 * inlines directly — the safest form for Satori.
 */
export function OgBrandHeader({
  wordmarkSize = 32,
}: { wordmarkSize?: number } = {}): ReactElement {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "18px" }}>
      <div
        style={{
          display: "flex",
          width: "60px",
          height: "60px",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "16px",
          background: "#fbf8f1",
          border: `1px solid ${OG.LINE}`,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="qtail" x1="14" y1="15" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#1f7d7d" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <circle cx="10.8" cy="11" r="7" stroke={OG.INK} strokeWidth="2.8" />
          <path d="M14.8 15.2 L19.2 19.6" stroke="url(#qtail)" strokeWidth="3.6" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ display: "flex", fontSize: `${wordmarkSize}px`, fontWeight: 700, color: OG.INK }}>
        Qraft<span style={{ color: OG.SUBTLE }}>Paper</span>
      </div>
    </div>
  );
}
