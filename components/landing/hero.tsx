"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { easeOut, fadeUp, staggerParent } from "@/lib/motion";
import { HeroVisual } from "./hero-visual";

const words = [
  { t: "From" },
  { t: "syllabus" },
  { t: "to" },
  { t: "review-ready", accent: true },
  { t: "papers" },
  { t: "in" },
  { t: "minutes." },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-36 sm:pt-44">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easeOut }}
            >
              <span className="inline-flex items-center gap-2 rounded-full glass-strong px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
                <Sparkles className="h-3.5 w-3.5 text-violet-bright" />
                AI workspace for assessment design
              </span>
            </motion.div>

            <motion.h1
              variants={staggerParent(0.075, 0.18)}
              initial="hidden"
              animate="visible"
              className="mt-7 text-[2.6rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-6xl sm:leading-[1.05] lg:text-[4rem]"
            >
              {words.map((w, i) => (
                <motion.span
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
                    visible: {
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      transition: { duration: 0.7, ease: easeOut },
                    },
                  }}
                  className={
                    w.accent
                      ? "mr-[0.24em] inline-block text-accent"
                      : "text-gradient mr-[0.24em] inline-block"
                  }
                >
                  {w.t}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7, delay: 0.6, ease: easeOut }}
              className="mt-7 max-w-lg text-pretty text-[1.02rem] leading-relaxed text-fg-muted"
            >
              QraftPaper uses your syllabus, previous-year papers and unit
              weightages to draft structured question papers educators can
              review, edit and export.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7, delay: 0.74, ease: easeOut }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <GlowButton href="/signup" size="lg">
                Sign up
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
              </GlowButton>
              <GlowButton href="#showcase" variant="secondary" size="lg">
                See a live paper
              </GlowButton>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7, delay: 0.88, ease: easeOut }}
              className="mt-7 flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-fg-subtle"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Built for universities & institutions - No free tier
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: easeOut }}
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
