"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useState } from "react";

import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A single billing FAQ row. Controlled (React state) rather than a native
 * <details> so it (a) animates open/closed smoothly and (b) can't fall into the
 * native-details paint quirk that left the panel blank after a theme switch.
 * Each card owns its open state so two columns can be open at once; `self-start`
 * keeps a closed card from stretching to a tall open sibling's height.
 */
export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "h-fit self-start overflow-hidden rounded-2xl border transition-colors",
        open
          ? "border-line-strong bg-tint/[0.035]"
          : "border-line bg-tint/[0.02] hover:border-line-strong",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-3 p-5 text-left text-[0.92rem] font-medium"
      >
        <span>{q}</span>
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-fg-subtle transition-all duration-300",
            open && "rotate-45 border-violet/40 bg-violet/15 text-violet-bright",
          )}
        >
          <Plus className="h-4 w-4" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
          >
            <p className="px-5 pb-5 text-[0.82rem] leading-relaxed text-fg-muted">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
