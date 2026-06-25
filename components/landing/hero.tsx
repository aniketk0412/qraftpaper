"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { easeOut, fadeUp, staggerParent } from "@/lib/motion";
import { HeroVisual } from "./hero-visual";

// Concrete capabilities, stated plainly. This replaces the old "cramming the
// week before exams" tagline — enterprise heroes earn trust with specifics,
// not mood. Each item is something the product actually does (see Features).
const capabilities = [
  "Mock papers + MCQ quizzes",
  "Matched to your blueprint",
  "PDF & Word export",
];

export function Hero({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-32 sm:pb-20 sm:pt-40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Text column — one coordinated reveal at the block level. No
              per-word choreography; the whole message rises together so the
              eye reads the value prop, not the animation. */}
          <motion.div
            variants={staggerParent(0.1, 0.05)}
            initial="hidden"
            animate="visible"
          >
            {/* Quiet kicker: a hairline rule + small-caps label. Sets the
                category without the over-used sparkle-in-a-pill motif. */}
            <motion.div
              variants={fadeUp}
              className="flex items-center gap-3"
            >
              <span className="h-px w-8 bg-accent" />
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent">
                AI exam-prep platform
              </span>
            </motion.div>

            {/* Solid, confident headline. One accented phrase carries the
                emphasis via a restrained underline mark — no gradient fill,
                which is the single biggest "AI template" tell. */}
            <motion.h1
              variants={fadeUp}
              className="mt-6 text-balance text-[2.7rem] font-semibold leading-[1.06] tracking-[-0.03em] text-fg sm:text-6xl sm:leading-[1.03] lg:text-[4.1rem]"
            >
              Practice on papers that feel like{" "}
              <span className="relative whitespace-nowrap text-accent">
                the real exam
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1.5 h-[0.12em] rounded-full bg-accent/35"
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

            {/* Capability strip — replaces the decorative gold-dot tagline.
                Plain facts, divider-separated, reading like a spec line. */}
            <motion.ul
              variants={fadeUp}
              className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-[0.82rem] text-fg-muted"
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

          {/* Product visual — the credibility anchor. Single, slower entrance
              so it settles after the copy rather than competing with it. */}
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
