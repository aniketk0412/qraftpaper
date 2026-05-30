import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "violet" | "gold" | "emerald" | "neutral";
type Size = "sm" | "md" | "lg";

/**
 * Per-tone visual bundle. Three layers give the tile depth instead of the
 * old flat-tint-square look:
 *   tile  — a directional gradient (top-left bright -> bottom-right faint)
 *           so the surface reads as lit, plus the ring.
 *   glyph — the icon colour.
 *   glow  — a soft blurred disc behind the glyph in the tone colour,
 *           clipped by the tile, that makes the icon feel like it's
 *           sitting on a light source rather than painted on.
 *
 * Token-driven, so every tone adapts to light/dark automatically. The
 * "emerald" key is kept for API compatibility but rendered as a true
 * neutral — nothing in the app uses it, and the old version rendered it
 * as a flat grey anyway.
 */
const tones: Record<Tone, { tile: string; glyph: string; glow: string }> = {
  violet: {
    tile: "bg-gradient-to-br from-violet/25 to-violet/[0.05] ring-violet/30",
    glyph: "text-violet-bright",
    glow: "bg-violet/40",
  },
  gold: {
    tile: "bg-gradient-to-br from-gold/25 to-gold/[0.05] ring-gold/30",
    glyph: "text-gold",
    glow: "bg-gold/40",
  },
  emerald: {
    tile: "bg-gradient-to-br from-tint/[0.09] to-tint/[0.02] ring-line",
    glyph: "text-fg",
    glow: "bg-tint/20",
  },
  neutral: {
    tile: "bg-gradient-to-br from-tint/[0.08] to-tint/[0.015] ring-line",
    glyph: "text-violet-bright",
    glow: "bg-violet/25",
  },
};

const sizes: Record<
  Size,
  { box: string; icon: string; glow: string }
> = {
  sm: { box: "h-9 w-9 rounded-xl", icon: "h-[18px] w-[18px]", glow: "h-6 w-6" },
  md: { box: "h-10 w-10 rounded-xl", icon: "h-[18px] w-[18px]", glow: "h-7 w-7" },
  lg: { box: "h-11 w-11 rounded-2xl", icon: "h-5 w-5", glow: "h-8 w-8" },
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
        "relative grid shrink-0 place-items-center overflow-hidden ring-1",
        t.tile,
        s.box,
        className,
      )}
    >
      {/* Top-edge light catch — same 1px highlight language as the glass
          surfaces, so the tile feels part of the same material system. */}
      <span className="pointer-events-none absolute inset-x-1 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      {/* Soft tone glow behind the glyph, clipped by the tile. */}
      <span
        className={cn(
          "pointer-events-none absolute rounded-full blur-md opacity-70",
          t.glow,
          s.glow,
        )}
      />
      <Icon
        className={cn("relative drop-shadow-sm", t.glyph, s.icon)}
        strokeWidth={2}
      />
    </span>
  );
}
