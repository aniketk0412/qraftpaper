import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * QraftMark — the Q monogram.
 *
 * Design intent (senior-designer pass, see CHANGELOG: "Brand foundation"):
 *   - The ring is the body of the Q. Stroke is 2.8 so it reads at 16-20 px
 *     favicon scale, but the geometry stays balanced at the 96 px PWA-icon
 *     scale used by apple-icon.tsx.
 *   - The tail crosses the lower-right ring perimeter and extends OUTWARD.
 *     Previous version had the tail mostly inside the ring, which read as
 *     "circle with a stub" at favicon size instead of "Q." About 65% of the
 *     new tail lives outside the ring, which is the proportion serif Q's
 *     have always used.
 *   - Tail colour is the accent teal — gives the mark a two-tone read even
 *     when rendered on a coloured background, and lets it pull double duty
 *     as both pure-currentColor (inline use in navs) and accent-marked
 *     (favicon, PWA icon).
 *   - The wordmark beside this mark drops its leading "Q" so the lockup
 *     doesn't carry two Qs side by side. Mark + "raftPaper" reads as one
 *     word, not "Q QraftPaper."
 */
function QraftMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="10.8"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth="2.8"
      />
      <path
        d="M14.8 15.2 19.2 19.6"
        stroke="#5fb3b3"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2", className)}
      aria-label="QraftPaper home"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-[0.7rem] bg-fg text-canvas shadow-[0_6px_22px_-9px_rgba(20,32,46,0.55)] transition-transform duration-300 group-hover:scale-105">
        <span className="absolute inset-0 rounded-[0.7rem] ring-1 ring-inset ring-white/12" />
        <QraftMark className="h-[20px] w-[20px]" />
      </span>
      {/* Wordmark keeps the full "QraftPaper" — dropping the leading Q to
          merge with the mark only reads clearly when the mark is a
          drop-in type-matched glyph. Our mark is iconic, not typographic,
          so we keep the wordmark intact and use "Paper" as the muted
          half-step so the brand reads as Qraft + product-type. */}
      <span className="text-[1.06rem] font-semibold tracking-[-0.02em] leading-none">
        Qraft<span className="text-fg-muted">Paper</span>
      </span>
    </Link>
  );
}
