import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-lg",
        hover &&
          "transition-colors duration-200 hover:border-line-strong hover:bg-tint/[0.045]",
        className,
      )}
    >
      {children}
    </div>
  );
}
