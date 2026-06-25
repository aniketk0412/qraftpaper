import type { Readiness, ReadinessBand } from "@/lib/exam-readiness";

// Ring + label colour per band. Mirrors the subject card's existing mastery
// thresholds (gold → violet → accent) so readiness reads as native to the UI,
// not bolted on. `setup` (no profile yet) stays neutral.
const BAND_STROKE: Record<ReadinessBand, string> = {
  ready: "var(--color-accent)",
  solid: "var(--color-violet-bright)",
  building: "var(--color-gold)",
  starting: "var(--color-gold)",
  setup: "var(--color-fg-subtle)",
};

/**
 * Compact exam-readiness ring. Pure presentational + static SVG (no animation
 * loop), so it's cheap to render many on the dashboard. Shows the score, or a
 * neutral "–" when readiness isn't measurable yet (no profile).
 */
export function ReadinessRing({
  readiness,
  size = 46,
}: {
  readiness: Readiness;
  size?: number;
}) {
  const { score, band, label } = readiness;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - (score ?? 0) / 100);
  const colour = BAND_STROKE[band];

  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        score === null
          ? `Exam readiness: ${label}`
          : `Exam readiness ${score} out of 100 — ${label}`
      }
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        {score !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colour}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        )}
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        {score === null ? (
          <span className="font-mono text-[0.7rem] text-fg-subtle">–</span>
        ) : (
          <span
            className="font-mono text-[0.72rem] font-semibold tabular-nums"
            style={{ color: colour }}
          >
            {score}
          </span>
        )}
      </span>
    </span>
  );
}
