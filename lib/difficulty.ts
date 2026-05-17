import type { Difficulty } from "./demo-data";

/**
 * Difficulty is expressed through monochrome brightness tiers rather than hue,
 * so Easy reads faint and Hard reads bright on any surface.
 */

/** Chip styling for the dark app surfaces (editor, hero visual, quiz). */
export const difficultyDarkChip: Record<Difficulty, string> = {
  Easy: "border-white/10 bg-white/[0.03] text-fg-subtle",
  Medium: "border-white/[0.16] bg-white/[0.07] text-fg-muted",
  Hard: "border-white/30 bg-white/[0.14] text-fg",
};

/** Chip styling for the light paper sheet. */
export const difficultyLightChip: Record<Difficulty, string> = {
  Easy: "bg-[#e7e7e2] text-[#88887e]",
  Medium: "bg-[#d8d8d1] text-[#5a5a52]",
  Hard: "bg-[#c5c5bd] text-[#2c2c26]",
};

/** Solid fill for difficulty meter bars. */
export const difficultyBarFill: Record<Difficulty, string> = {
  Easy: "bg-white/25",
  Medium: "bg-white/50",
  Hard: "bg-white/85",
};
