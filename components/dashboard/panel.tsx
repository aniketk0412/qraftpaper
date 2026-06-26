import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Draftsman field panel — a flat bordered block with a mono titleblock header
 * and a hairline divider, matching the dashboard's blueprint metric grid. No
 * rounded corners, no shadow, no glass: structure comes from the ruled border,
 * the surface is the page canvas itself, so every panel reads as a field on
 * one continuous sheet of technical drawing paper.
 */
export function Panel({
  label,
  right,
  children,
  className,
  bodyClassName,
}: {
  label: string;
  /** Optional header-right slot (a count, a status stamp, a "view all" link). */
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("border border-line bg-canvas", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-2.5">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-fg-subtle">
          {label}
        </p>
        {right}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
