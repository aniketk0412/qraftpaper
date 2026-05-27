import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * QraftMark — a bold "Q" monogram: an ink ring with a short tail that crosses
 * the ring at the lower-right (the crossing is what reads as a letter Q rather
 * than a magnifying glass). The tail carries the azure brand accent. Colours
 * are hard-coded so the mark is self-contained (also used as the favicon).
 */
function QraftMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="10.8" r="7.3" stroke="currentColor" strokeWidth="2.7" />
      <path
        d="M12.7 12.5 17 16.8"
        stroke="#5fb3b3"
        strokeWidth="3.1"
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
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="QraftPaper home"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-[0.7rem] bg-fg text-canvas shadow-[0_6px_22px_-9px_rgba(20,32,46,0.55)] transition-transform duration-300 group-hover:scale-105">
        <span className="absolute inset-0 rounded-[0.7rem] ring-1 ring-inset ring-white/12" />
        <QraftMark className="h-[20px] w-[20px]" />
      </span>
      <span className="text-[1.06rem] font-semibold tracking-[-0.02em]">
        Qraft<span className="text-fg-muted">Paper</span>
      </span>
    </Link>
  );
}
