"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { ArrowRight, FileUp, Sliders, Wand2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  {
    icon: FileUp,
    title: "Upload your reference material",
    body: "Drop in one combined text-based PDF, or separate syllabus, sample paper and PYQ files. QraftPaper extracts readable text once and rejects image-only scans before they cost you credits.",
    chips: ["Syllabus.pdf", "PYQ-2023.pdf", "Blueprint.pdf"],
  },
  {
    icon: Sliders,
    title: "Configure the exam blueprint",
    body: "Set unit weightages, section structure, question types, mark distribution and the difficulty mix. Save it once and reuse it every cycle.",
    chips: ["Unit III - 26%", "Hard - 30%", "70 marks"],
  },
  {
    icon: Wand2,
    title: "Generate, refine and export",
    body: "AI drafts a balanced paper for review. Edit inline, regenerate any single question, then export to PDF or Word.",
    chips: ["Draft ready", "Regenerate Q5", "Export PDF"],
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 65%", "end 65%"],
  });
  // The connecting line fills as you scroll down — but we ratchet the high-
  // water mark and never run it backwards, so scrolling back up doesn't make
  // the filled gradient un-fill (which read as "the animation disappears").
  const [maxProgress, setMaxProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setMaxProgress((prev) => (latest > prev ? latest : prev));
  });
  const scaleY = useTransform(scrollYProgress, (latest) =>
    Math.max(latest, maxProgress),
  );

  return (
    <section id="how" className="section-pad scroll-mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="The workflow"
          title={
            <>
              Three steps from blueprint
              <br className="hidden sm:block" /> to{" "}
              <span className="text-accent">finished paper</span>
            </>
          }
          description="A workflow your examination cell can standardise across every department and every semester."
        />

        <div ref={ref} className="relative mx-auto mt-16 max-w-3xl">
          <div className="absolute bottom-10 left-6 top-10 hidden w-px bg-line sm:block" />
          <motion.div
            style={{ scaleY }}
            className="absolute bottom-10 left-6 top-10 hidden w-px origin-top bg-gradient-to-b from-violet-bright to-violet sm:block"
          />

          <div className="flex flex-col gap-6">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06}>
                <div className="relative flex flex-col gap-5 sm:flex-row sm:gap-7">
                  <div className="relative z-10 shrink-0">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent shadow-[0_8px_26px_-10px_rgba(45,139,139,0.45)]">
                      <step.icon className="h-5 w-5 text-on-accent" />
                    </div>
                  </div>
                  <GlassCard hover className="flex-1 p-6 sm:p-7">
                    <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
                      Step {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[0.92rem] leading-relaxed text-fg-muted">
                      {step.body}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {step.chips.map((c) => (
                        <span
                          key={c}
                          className="rounded-lg border border-line bg-tint/[0.03] px-2.5 py-1 font-mono text-[0.66rem] text-fg-muted"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-center gap-3">
            <GlowButton href="/signup" size="lg">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
            </GlowButton>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-fg-subtle">
              Set your first paper in minutes
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
