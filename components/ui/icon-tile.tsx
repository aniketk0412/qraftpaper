import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "violet" | "gold" | "emerald" | "neutral";
type Size = "sm" | "md" | "lg";

/**
 * Editorial "register mark" — a crisp flat square with a hairline tone border,
 * a faint tone tint, and the glyph in the tone colour. No gradient, glow,
 * white highlight or drop-shadow: it reads like a stamped index mark on a
 * printing plate, part of the same ruled-line system as the surrounding
 * plate-grid. Token-driven, so every tone adapts to light/dark automatically.
 *
 *   violet  = indigo (the brand ink)         gold = exam-marker red
 *   neutral = indigo glyph on a paper chip    emerald = kept for API
 *             compatibility, rendered neutral (nothing uses it).
 */
const tones: Record<Tone, { box: string; glyph: string }> = {
  violet: { box: "border-violet/35 bg-violet/[0.07]", glyph: "text-violet-bright" },
  gold: { box: "border-gold/35 bg-gold/[0.07]", glyph: "text-gold" },
  emerald: { box: "border-line-strong bg-card-hi", glyph: "text-fg" },
  neutral: { box: "border-line-strong bg-card-hi", glyph: "text-violet-bright" },
};

const sizes: Record<Size, { box: string; icon: string }> = {
  sm: { box: "h-9 w-9", icon: "h-[18px] w-[18px]" },
  md: { box: "h-10 w-10", icon: "h-[18px] w-[18px]" },
  lg: { box: "h-11 w-11", icon: "h-5 w-5" },
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
  const t = tones[tone];
  const s = sizes[size];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-[2px] border",
        t.box,
        s.box,
        className,
      )}
    >
      <Icon className={cn(t.glyph, s.icon)} strokeWidth={2} />
    </span>
  );
}
