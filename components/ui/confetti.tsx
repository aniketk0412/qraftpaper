"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

/**
 * Pure-CSS-and-motion confetti burst. No deps, no canvas, no offscreen
 * worker — 28 small rectangles get random positions/colors and animate
 * once on mount. Designed to ride alongside the StreakMilestone banner
 * (and any other earned-it moment we add later).
 *
 * Honours `prefers-reduced-motion`: renders nothing when the user has
 * asked for less animation. Habit reinforcement still works fine without
 * the visual flourish.
 *
 * Seeded deterministically on mount via a useMemo so React's strict-mode
 * double-render doesn't produce a different burst per render. The same
 * mount gets the same particles — re-mounting (new milestone) gets a
 * fresh burst.
 */
export function Confetti({
  particleCount = 28,
  durationMs = 2400,
}: {
  particleCount?: number;
  durationMs?: number;
}) {
  const reduce = useReducedMotion();
  // Pre-bake every particle's random shape on mount using useState's lazy
  // initializer. The initializer runs once per mount — same lifecycle as
  // componentDidMount, so Math.random is safe here (it doesn't get
  // re-rolled on subsequent renders). React's "no impure calls during
  // render" rule applies to the render body, not to lazy-init callbacks.
  const [particles] = useState(() => {
    // 4 colours: amber, deep amber, teal, deep teal — matches the
    // two-hue token system from docs/design-notes.md.
    const palette = ["#f59e0b", "#d97706", "#46b3b3", "#5fc4c4"];
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      // Horizontal start anywhere across the banner
      left: Math.random() * 100,
      // Fall a random horizontal drift so they don't form lines
      drift: (Math.random() - 0.5) * 60,
      // Each particle waits a fraction of the total before launching —
      // gives the burst a "popcorn" feel instead of a single sheet
      delay: Math.random() * 0.4,
      // Each falls at a slightly different speed
      duration: (durationMs / 1000) * (0.7 + Math.random() * 0.6),
      // Sizes oscillate 4–9 px so the cloud has depth
      size: 4 + Math.random() * 5,
      rotation: Math.random() * 720 - 360,
      color: palette[i % palette.length],
    }));
  });

  if (reduce) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{
            x: 0,
            y: -8,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: p.drift,
            y: "120%",
            opacity: [1, 1, 0],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 1,
            // Mild box-shadow gives a vague paper-confetti feel without an
            // extra DOM element.
            boxShadow: `0 0 0 1px ${p.color}33`,
          }}
        />
      ))}
    </div>
  );
}
