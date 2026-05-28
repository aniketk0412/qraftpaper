"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Staged progress shown during a real generation call. The stages are FAKE
 * (the API doesn't stream stage events back yet) but cycle on a realistic
 * cadence so a 30 s wait reads as steady progress instead of "the app
 * froze." When the parent unmounts this (pending → null) it goes away.
 */

const paperStages = [
  "Reading your syllabus",
  "Picking topics from your PYQ",
  "Drafting questions",
  "Balancing difficulty",
  "Finalising the paper",
];

const quizStages = [
  "Reading your syllabus",
  "Picking topics from your PYQ",
  "Writing answer options",
  "Adding explanations",
  "Finalising the quiz",
];

export function GenerationProgress({
  kind,
  open,
  errorMessage,
}: {
  kind: "paper" | "quiz";
  open: boolean;
  errorMessage?: string | null;
}) {
  const stages = kind === "paper" ? paperStages : quizStages;
  const [active, setActive] = useState(0);

  // Drift through stages on a 4 s cadence so a typical 25-30 s generation
  // lights up most of them. Resetting on close is handled by the parent —
  // it passes a fresh `key` on each open so this component remounts and
  // `active` starts back at 0 cleanly.
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setActive((current) =>
        current < stages.length - 1 ? current + 1 : current,
      );
    }, 4000);
    return () => clearInterval(id);
  }, [open, stages.length]);

  const total = stages.length;
  const pct = errorMessage
    ? 100
    : Math.round(((active + 0.4) / total) * 100);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/65 backdrop-blur-md"
          aria-live="polite"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.22, ease: easeOut }}
            className="w-full max-w-md overflow-hidden rounded-2xl glass-strong p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent">
                {errorMessage ? (
                  <Sparkles className="h-4 w-4 text-on-accent opacity-50" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-on-accent" />
                )}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium">
                  {errorMessage
                    ? `Couldn't generate ${kind}`
                    : `Generating your ${kind}`}
                </p>
                <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                  {errorMessage
                    ? "Try again in a moment"
                    : "This usually takes 20–30 seconds"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {stages.map((label, i) => {
                const state = errorMessage
                  ? "pending"
                  : i < active
                    ? "done"
                    : i === active
                      ? "active"
                      : "pending";
                return (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 text-[0.85rem]"
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                        state === "done" && "bg-accent text-on-accent",
                        state === "active" && "bg-violet/20 text-violet-bright",
                        state === "pending" && "bg-tint/[0.04] text-fg-subtle",
                      )}
                    >
                      {state === "done" ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : state === "active" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={cn(
                        state === "done" && "text-fg",
                        state === "active" && "text-fg",
                        state === "pending" && "text-fg-subtle",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-tint/5">
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: easeOut }}
                className={cn(
                  "h-full rounded-full",
                  errorMessage
                    ? "bg-tint/20"
                    : "bg-gradient-to-r from-violet to-violet-bright",
                )}
              />
            </div>

            {errorMessage && (
              <p className="mt-4 rounded-xl border border-line bg-tint/[0.02] px-3.5 py-2.5 text-[0.78rem] leading-relaxed text-fg-muted">
                {errorMessage}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
