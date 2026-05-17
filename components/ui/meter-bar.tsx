"use client";

import { motion } from "motion/react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MeterBarProps {
  /** Fill width as a percentage (0-100). */
  pct: number;
  /** Tailwind classes for the fill (color/gradient). */
  fill?: string;
  /** Track height utility class. */
  height?: string;
  /** Animate the fill in on scroll. When false, renders statically. */
  animate?: boolean;
  delay?: number;
  className?: string;
}

const defaultFill = "bg-gradient-to-r from-violet to-violet-bright";

export function MeterBar({
  pct,
  fill = defaultFill,
  height = "h-1.5",
  animate = false,
  delay = 0,
  className,
}: MeterBarProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-white/5",
        height,
        className,
      )}
    >
      {animate ? (
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, delay, ease: easeOut }}
          className={cn("h-full rounded-full", fill)}
        />
      ) : (
        <div
          className={cn("h-full rounded-full", fill)}
          style={{ width: `${pct}%` }}
        />
      )}
    </div>
  );
}
