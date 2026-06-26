"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { easeOut, fadeUp, staggerParent } from "@/lib/motion";
import { HeroVisual } from "./hero-visual";

// Plain technical facts, divider-separated — reads like a spec line, not a
// decorative tagline.
const capabilities = [
  "Mock papers + MCQ quizzes",
  "Matched to your blueprint",
  "PDF & Word export",
];

export function Hero({ signedIn = false }: { signedIn?: boolean }) {
  return (
    // Solid warm-paper canvas: opaque bg covers the page-wide blueprint grid
    // for the hero, so the masthead reads as a clean printed title page. The
    // grid resumes below the fold.
    <section className="relative overflow-hidden bg-canvas pb-16 pt-32 sm:pb-20 sm:pt-40">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Print-margin rule — a single thin vertical guide the copy is set
            against, like the ruled margin on a sheet of exam paper. */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-5 w-px bg-line-strong sm:left-8"
        />

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Text column — set just inside the margin rule. One coordinated
              reveal at the block level; the whole message rises together. */}
          <motion.div
            variants={staggerParent(0.1, 0.05)}
            initial="hidden"
            animate="visible"
            className="pl-5 sm:pl-7"
          >
            {/* Mechanical eyebrow: a hairline rule + small-caps mono label. */}
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <span className="h-px w-8 bg-accent" />
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-fg-muted">
                AI exam-prep platform
              </span>
            </motion.div>

            {/* Commanding editorial-serif headline in ink. One phrase carries a
                crisp indigo pen-rule — a deliberate mark, not a gradient. */}
            <motion.h1
              variants={fadeUp}
              className="mt-6 max-w-[16ch] text-balance text-[2.85rem] font-semibold leading-[1.04] tracking-[-0.025em] text-fg sm:text-6xl sm:leading-[1.02] lg:text-[4.25rem]"
            >
              Practice on papers that feel like{" "}
              <span className="relative whitespace-nowrap text-accent">
                the real exam
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1 h-[3px] bg-accent"
                />
              </span>
              .
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-xl text-pretty text-[1.05rem] leading-relaxed text-fg-muted"
            >
              Upload your syllabus and last year&apos;s question paper.
              QraftPaper drafts mock papers and instant MCQ quizzes that mirror
              your exam&apos;s sections, marks and difficulty — so your practice
              matches what you&apos;ll actually sit.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <GlowButton href={signedIn ? "/dashboard" : "/signup"} size="lg">
                {signedIn ? "Open dashboard" : "Generate your first paper"}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
              </GlowButton>
              <GlowButton href="#showcase" variant="secondary" size="lg">
                See a sample paper
              </GlowButton>
            </motion.div>

            {/* Capability strip — facts in mechanical mono, divider-separated,
                reading like a printed spec line. */}
            <motion.ul
              variants={fadeUp}
              className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-fg-muted"
            >
              {capabilities.map((item, i) => (
                <li key={item} className="flex items-center gap-5">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className="hidden h-3.5 w-px bg-line-strong sm:block"
                    />
                  )}
                  <span>{item}</span>
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* The authentic exam-paper sheet — settles in after the copy. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: easeOut }}
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
