import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  dotless,
}: {
  children: ReactNode;
  className?: string;
  dotless?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.24em] text-fg-muted",
        className,
      )}
    >
      {/* Crisp accent rule — same editorial mark as the hero eyebrow. Was a
          glowing dot (with a stale teal halo); a flat pen-rule reads as
          deliberate typographic punctuation, not a UI light. */}
      {!dotless && <span className="h-px w-6 bg-accent" />}
      {children}
    </span>
  );
}
