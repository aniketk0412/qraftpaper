"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { easeOut } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  blur?: boolean;
  once?: boolean;
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  blur = false,
  once = true,
}: RevealProps) {
  return (
    // Only touch `filter` when blur is explicitly requested. Otherwise Framer
    // leaves a residual `filter: blur(0px)` inline on this wrapper, and a
    // non-`none` filter creates a rasterization context that makes any
    // `text-gradient` (background-clip:text) heading inside it composite
    // against the page backdrop — i.e. the background bleeds through the text.
    <motion.div
      className={className}
      initial={blur ? { opacity: 0, y, filter: "blur(8px)" } : { opacity: 0, y }}
      whileInView={blur ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 1, y: 0 }}
      viewport={{ once, margin: "-90px" }}
      transition={{ duration: 0.75, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
