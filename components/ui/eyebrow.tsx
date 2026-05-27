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
      {!dotless && (
        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(45,139,139,0.6)]" />
      )}
      {children}
    </span>
  );
}
