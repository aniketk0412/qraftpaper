"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

const SIZE = 900;

export function CursorGlow() {
  // Skip the effect entirely on devices that signal "I don't want fancy
  // animation" or where there's no fine cursor (touch / mobile). The element
  // is a 900x900 GPU layer with a radial gradient — cheap when used but
  // unnecessary cost when it can never improve the experience.
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fineCursor = window.matchMedia("(hover: hover) and (pointer: fine)");
    const decide = () => setEnabled(fineCursor.matches && !reducedMotion.matches);
    decide();
    reducedMotion.addEventListener("change", decide);
    fineCursor.addEventListener("change", decide);
    return () => {
      reducedMotion.removeEventListener("change", decide);
      fineCursor.removeEventListener("change", decide);
    };
  }, []);

  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 130, damping: 24, mass: 0.45 });
  const sy = useSpring(y, { stiffness: 130, damping: 24, mass: 0.45 });
  // Translate so the element's centre tracks the cursor — transform-only,
  // so this never triggers a paint of a viewport-sized layer.
  const tx = useTransform(sx, (v) => v - SIZE / 2);
  const ty = useTransform(sy, (v) => v - SIZE / 2);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{
        x: tx,
        y: ty,
        width: SIZE,
        height: SIZE,
        background:
          "radial-gradient(circle, rgba(20,32,46,0.05), transparent 66%)",
      }}
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden rounded-full will-change-transform md:block"
    />
  );
}
