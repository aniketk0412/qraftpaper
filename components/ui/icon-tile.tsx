import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "violet" | "gold" | "emerald" | "neutral";
type Size = "sm" | "md" | "lg";

const tones: Record<Tone, string> = {
  violet: "bg-violet/15 text-violet-bright ring-violet/25",
  gold: "bg-gold/15 text-gold ring-gold/25",
  emerald: "bg-tint/[0.06] text-fg ring-line",
  neutral: "bg-tint/[0.04] text-violet-bright ring-line",
};

const sizes: Record<Size, { box: string; icon: string }> = {
  sm: { box: "h-9 w-9 rounded-lg", icon: "h-[18px] w-[18px]" },
  md: { box: "h-10 w-10 rounded-xl", icon: "h-[18px] w-[18px]" },
  lg: { box: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
};

export function IconTile({
  icon: Icon,
  tone = "violet",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: Size;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span
      className={cn("grid shrink-0 place-items-center ring-1", tones[tone], s.box, className)}
    >
      <Icon className={s.icon} />
    </span>
  );
}
