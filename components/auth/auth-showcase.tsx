"use client";

import { motion } from "motion/react";
import { Check, FileCheck2, TrendingUp, Trophy } from "lucide-react";
import { Logo } from "@/components/logo";
import { GridBackdrop } from "@/components/landing/grid-backdrop";
import { fadeUp, staggerParent } from "@/lib/motion";

const points = [
  "Mock papers shaped by your actual syllabus and PYQs",
  "Timed MCQ quizzes with score history across attempts",
  "Print, export or share quiz links with your study group",
];

// Answered-question rows for the demo card — illustrative, shows the
// "practice a real paper, get it scored" loop the product is built around.
const answered = [
  { n: "01", text: "Explain demand paging with a page-fault example.", marks: "10/10" },
  { n: "02", text: "Compare preemptive vs. non-preemptive scheduling.", marks: "8/10" },
];

export function AuthShowcase() {
  return (
    <div className="relative hidden overflow-hidden border-r border-line lg:flex lg:flex-col lg:justify-between">
      {/* Same enhanced grid + cursor glow as the landing page, for one
          continuous brand surface from marketing into the product. */}
      <GridBackdrop />

      <div className="relative p-12">
        <Logo />
      </div>

      <motion.div
        variants={staggerParent(0.12, 0.1)}
        initial="hidden"
        animate="visible"
        className="relative px-12"
      >
        <motion.p
          variants={fadeUp}
          className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-violet-bright"
        >
          Exam-prep that doesn&apos;t feel like cheating
        </motion.p>
        <motion.h2
          variants={fadeUp}
          className="mt-4 max-w-md text-pretty text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-gradient"
        >
          Practice papers built from your own syllabus.
        </motion.h2>

        {/* Product card — the practice→score loop made visible. */}
        <motion.div variants={fadeUp} className="relative mt-9 max-w-md">
          {/* Floating "score trending up" chip, like the landing hero. */}
          <motion.div
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-3 -top-4 z-20 flex items-center gap-2 rounded-xl glass-strong px-3 py-2 shadow-xl"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold/15 text-gold">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-[0.72rem] font-medium">+14% in a week</p>
              <p className="font-mono text-[0.58rem] uppercase tracking-wider text-fg-subtle">
                3 attempts
              </p>
            </div>
          </motion.div>

          <div className="overflow-hidden rounded-2xl glass-strong p-1.5 shadow-2xl">
            <div className="rounded-[0.85rem] bg-canvas p-5">
              {/* header */}
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent">
                    <FileCheck2 className="h-[18px] w-[18px] text-on-accent" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">Operating Systems</p>
                    <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                      CS-305 · Unit Test · 50 marks
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-wider text-accent">
                  <Check className="h-3 w-3" strokeWidth={3} />
                  Graded
                </span>
              </div>

              {/* answered rows */}
              <div className="mt-4 flex flex-col gap-2.5">
                {answered.map((row) => (
                  <div
                    key={row.n}
                    className="flex items-center gap-3 rounded-xl border border-line bg-tint/[0.015] p-3"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-accent/15 font-mono text-[0.62rem] text-accent">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[0.78rem] text-fg/90">
                      {row.text}
                    </p>
                    <span className="shrink-0 rounded-md bg-tint/5 px-1.5 py-0.5 font-mono text-[0.6rem] text-fg-muted">
                      {row.marks}
                    </span>
                  </div>
                ))}
              </div>

              {/* score footer */}
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gold" />
                  <span className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-muted">
                    Best attempt
                  </span>
                </div>
                <span className="text-lg font-semibold tabular-nums text-fg">84%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-tint/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "84%" }}
                  transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-accent to-violet-bright"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.ul variants={fadeUp} className="mt-9 flex flex-col gap-3.5">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet/20 text-violet-bright">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="text-[0.92rem] text-fg-muted">{p}</span>
            </li>
          ))}
        </motion.ul>
      </motion.div>

      <div className="relative p-12" />
    </div>
  );
}
