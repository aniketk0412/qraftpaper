import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "violet" | "gold" | "neutral" | "accent";

const tones: Record<Tone, string> = {
  violet: "border-violet/30 bg-violet/10 text-violet-bright",
  gold: "border-gold/30 bg-gold/10 text-gold",
  neutral: "border-line-strong bg-white/[0.04] text-fg-muted",
  accent: "border-accent/40 bg-accent/15 text-accent-soft",
};

export function Badge({
  children,
  className,
  tone = "violet",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
