"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

const SIZE = 900;

export function CursorGlow() {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 130, damping: 24, mass: 0.45 });
  const sy = useSpring(y, { stiffness: 130, damping: 24, mass: 0.45 });
  // Translate so the element's centre tracks the cursor — transform-only,
  // so this never triggers a paint of a viewport-sized layer.
  const tx = useTransform(sx, (v) => v - SIZE / 2);
  const ty = useTransform(sy, (v) => v - SIZE / 2);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      style={{
        x: tx,
        y: ty,
        width: SIZE,
        height: SIZE,
        background:
          "radial-gradient(circle, rgba(255,255,255,0.05), transparent 66%)",
      }}
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden rounded-full will-change-transform md:block"
    />
  );
}
