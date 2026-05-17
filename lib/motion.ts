import type { Variants } from "motion/react";

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
};

export function staggerParent(gap = 0.09, delay = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: gap, delayChildren: delay },
    },
  };
}
