"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  ListChecks,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";
import { easeOut } from "@/lib/motion";
import { difficultyDarkChip } from "@/lib/difficulty";
import { exampleQuiz } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

const points = [
  {
    icon: ListChecks,
    title: "MCQs from your actual syllabus",
    desc: "Four plausible options each — not the kind of garbage where three answers are obviously wrong.",
  },
  {
    icon: SlidersHorizontal,
    title: "Built-in timer + score history",
    desc: "Take it like a real exam. We track every attempt so you can see if you're actually improving.",
  },
  {
    icon: Check,
    title: "Explanation for every answer",
    desc: "Don't just learn what's right — learn why. Each question ships with a short rationale.",
  },
  {
    icon: Send,
    title: "Send the same quiz to your friends",
    desc: "One public link, everyone takes the same questions. Compare scores in the group chat.",
  },
];

export function Quiz() {
  return (
    <section id="quiz" className="section-pad scroll-mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <div className="flex items-center gap-3">
                <Eyebrow>Quiz generation</Eyebrow>
                <Badge tone="accent">New</Badge>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="text-gradient mt-5 max-w-md text-pretty text-[2.1rem] font-semibold leading-[1.06] tracking-[-0.02em] sm:text-5xl">
                Same syllabus, now a{" "}
                <span className="text-accent">timed MCQ test</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-4 max-w-md text-[0.97rem] leading-relaxed text-fg-muted">
                Same syllabus, same PYQ context — but as a 20-question MCQ test
                with a timer, instant scoring and answer explanations. Take it
                solo, or share the link and race your friends.
              </p>
            </Reveal>

            <div className="mt-8 flex flex-col gap-3">
              {points.map((p, i) => (
                <Reveal key={p.title} delay={0.16 + i * 0.07}>
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-tint/[0.04] text-violet-bright ring-1 ring-line">
                      <p.icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="text-[0.92rem] font-medium">{p.title}</p>
                      <p className="mt-0.5 text-[0.84rem] leading-snug text-fg-muted">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.5}>
              <div className="mt-8">
                <GlowButton href="/signup" size="lg">
                  Generate your own quiz
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                </GlowButton>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <QuizPreviewCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function QuizPreviewCard() {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const question = exampleQuiz.questions[qi];
  const answered = picked !== null;

  function pick(index: number) {
    if (answered) return;
    setPicked(index);
  }

  function another() {
    setQi((qi + 1) % exampleQuiz.questions.length);
    setPicked(null);
  }

  return (
    <div className="relative">
      <div className="absolute -inset-8 -z-10 rounded-full bg-violet/10 blur-[90px]" />
      <div className="overflow-hidden rounded-2xl glass-strong shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent">
              <Sparkles className="h-4 w-4 text-on-accent" />
            </span>
            <div className="leading-tight">
              <p className="text-[0.82rem] font-medium">AI Quiz</p>
              <p className="font-mono text-[0.58rem] uppercase tracking-wider text-fg-subtle">
                {exampleQuiz.subjectCode} · question {qi + 1}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-wider",
              difficultyDarkChip[question.difficulty],
            )}
          >
            {question.difficulty}
          </span>
        </div>

        <div className="px-5 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.26, ease: easeOut }}
            >
              <p className="text-[0.95rem] font-medium leading-snug">
                {question.prompt}
              </p>

              <div className="mt-4 flex flex-col gap-2">
                {question.options.map((option, i) => {
                  const isCorrect = i === question.correctIndex;
                  const isPicked = i === picked;
                  const state = !answered
                    ? "idle"
                    : isCorrect
                      ? "correct"
                      : isPicked
                        ? "wrong"
                        : "dim";
                  return (
                    <button
                      key={option}
                      onClick={() => pick(i)}
                      disabled={answered}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all duration-200",
                        state === "idle" &&
                          "border-line bg-tint/[0.02] hover:border-line-strong hover:bg-tint/[0.05]",
                        state === "correct" &&
                          "border-accent/45 bg-accent/[0.12]",
                        state === "wrong" &&
                          "border-tint/20 bg-tint/[0.045]",
                        state === "dim" && "border-line opacity-45",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded font-mono text-[0.66rem] font-medium",
                          state === "idle" &&
                            "bg-tint/[0.05] text-fg-muted group-hover:bg-tint/15 group-hover:text-fg",
                          state === "correct" && "bg-accent text-on-accent",
                          state === "wrong" && "bg-tint/12 text-fg",
                          state === "dim" && "bg-tint/[0.04] text-fg-subtle",
                        )}
                      >
                        {state === "correct" ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : state === "wrong" ? (
                          <X className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : (
                          LETTERS[i]
                        )}
                      </span>
                      <span className="text-[0.84rem] text-fg/90">{option}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {answered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.28, ease: easeOut }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-lg border border-line bg-tint/[0.02] p-3">
                      <p className="text-[0.78rem] leading-relaxed text-fg-muted">
                        {question.explanation}
                      </p>
                    </div>
                    <button
                      onClick={another}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-[0.78rem] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Try another question
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!answered && (
                <p className="mt-3 text-center font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg-subtle">
                  Pick an answer to check it
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
