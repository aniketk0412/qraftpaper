"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  BookOpen,
  Calculator,
  Cpu,
  FlaskConical,
  GraduationCap,
  Languages,
  ListChecks,
  School,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { QuizRunner } from "@/components/quiz-runner";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import {
  DEMO_LEVELS,
  demoQuizzesForLevel,
  type DemoLevel,
  type DemoQuizEntry,
} from "@/lib/demo-quizzes";
import { cn } from "@/lib/utils";

/** Subject → icon, with a sensible fallback so the catalog can grow without
 *  touching this map. */
const SUBJECT_ICON: Record<string, LucideIcon> = {
  "Computer Science": Cpu,
  Mathematics: Calculator,
  Physics: Atom,
  Science: FlaskConical,
  English: Languages,
};

const LEVEL_ICON: Record<DemoLevel, LucideIcon> = {
  school: School,
  college: GraduationCap,
};

/** Where the conversion CTAs point — a signed-out visitor is pushed to sign
 *  up, a signed-in (unpaid) user is pushed to subscribe. */
interface Cta {
  /** Primary "make your own" button. */
  primaryHref: string;
  primaryLabel: string;
  /** The runner's own back link + the picker's "don't see yours" hint. */
  backHref: string;
  backLabel: string;
}

function ctaFor(signedIn: boolean): Cta {
  return signedIn
    ? {
        primaryHref: "/billing",
        primaryLabel: "Subscribe to generate your own",
        backHref: "/dashboard",
        backLabel: "Back to dashboard",
      }
    : {
        primaryHref: "/signup",
        primaryLabel: "Generate from your own syllabus",
        backHref: "/signup",
        backLabel: "Build your own quiz",
      };
}

/**
 * The demo-quiz experience. Rather than dropping every visitor into one fixed
 * quiz, we first ask their level (school / college) and subject, then run a
 * sample quiz that actually matches — so a Class-10 student gets school
 * science, not undergraduate data structures. Entirely client-side and
 * answer-key-inline: no signup, no AI cost, no database.
 *
 * `signedIn` only swaps the conversion CTAs (sign up vs. subscribe) so the same
 * picker serves both the public funnel and the in-app upsell.
 */
export function DemoQuizClient({ signedIn = false }: { signedIn?: boolean }) {
  const [level, setLevel] = useState<DemoLevel>("school");
  const [selected, setSelected] = useState<DemoQuizEntry | null>(null);
  const cta = ctaFor(signedIn);

  if (selected) {
    return (
      <QuizView entry={selected} cta={cta} onBack={() => setSelected(null)} />
    );
  }
  return (
    <PickerView
      level={level}
      cta={cta}
      onLevel={setLevel}
      onPick={setSelected}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — pick your level + subject                                        */
/* -------------------------------------------------------------------------- */

function PickerView({
  level,
  cta,
  onLevel,
  onPick,
}: {
  level: DemoLevel;
  cta: Cta;
  onLevel: (level: DemoLevel) => void;
  onPick: (entry: DemoQuizEntry) => void;
}) {
  const subjects = demoQuizzesForLevel(level);

  return (
    <div>
      <div className="mb-7">
        <p className="flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
          <ListChecks className="h-3.5 w-3.5" />
          Sample QraftPaper quiz
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">
          Take a quiz built for what you study
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-fg-muted">
          Pick your level and subject — we&apos;ll run a real sample quiz with a
          timer and instant scoring. No signup, no credits used.
        </p>
      </div>

      {/* Step 1: level */}
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-subtle">
        1 · Where are you studying?
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DEMO_LEVELS.map((l) => {
          const Icon = LEVEL_ICON[l.id];
          const active = l.id === level;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onLevel(l.id)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200",
                active
                  ? "border-violet/45 bg-violet/10"
                  : "border-line bg-tint/[0.02] hover:border-line-strong hover:bg-tint/[0.04]",
              )}
            >
              <IconTile icon={Icon} tone={active ? "violet" : "neutral"} size="md" />
              <div className="min-w-0">
                <p className="text-[0.95rem] font-medium">{l.label}</p>
                <p className="text-[0.8rem] text-fg-muted">{l.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step 2: subject */}
      <p className="mt-8 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-subtle">
        2 · Pick a subject
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {subjects.map((entry) => {
          const Icon = SUBJECT_ICON[entry.subject] ?? BookOpen;
          return (
            <button
              key={entry.subject}
              type="button"
              onClick={() => onPick(entry)}
              className="group flex items-start gap-3.5 rounded-2xl border border-line bg-tint/[0.02] p-4 text-left transition-all duration-200 hover:border-violet/40 hover:bg-violet/[0.06]"
            >
              <IconTile icon={Icon} tone="neutral" size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.95rem] font-medium">{entry.subject}</p>
                  <span className="shrink-0 rounded-full border border-line bg-tint/[0.04] px-2 py-0.5 font-mono text-[0.56rem] uppercase tracking-wider text-fg-subtle">
                    {entry.stage}
                  </span>
                </div>
                <p className="mt-1 text-[0.8rem] leading-snug text-fg-muted">
                  {entry.blurb}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-wider text-violet-bright opacity-0 transition-opacity group-hover:opacity-100">
                  Start quiz
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[0.78rem] text-fg-subtle">
        More subjects are added regularly. Don&apos;t see yours?{" "}
        <Link
          href={cta.primaryHref}
          className="text-violet-bright underline-offset-2 hover:underline"
        >
          Build a quiz from your own syllabus
        </Link>
        .
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2 — run the chosen quiz                                              */
/* -------------------------------------------------------------------------- */

function QuizView({
  entry,
  cta,
  onBack,
}: {
  entry: DemoQuizEntry;
  cta: Cta;
  onBack: () => void;
}) {
  const { quiz } = entry;
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Choose a different quiz
      </button>

      <div className="mb-6">
        <p className="flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
          <ListChecks className="h-3.5 w-3.5" />
          {entry.subject} · {entry.stage}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">
          {quiz.title}
        </h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          {quiz.subjectCode} · {quiz.questions.length} questions ·{" "}
          {quiz.durationMins} min · instant scoring
        </p>
      </div>

      {/* QuizRunner grades client-side off the inline answer key — fine for a
          demo (no /grade round-trip, no DB row). Keyed by subjectCode so
          switching quizzes fully remounts the runner. */}
      <QuizRunner
        key={quiz.subjectCode}
        quiz={quiz}
        backHref={cta.backHref}
        backLabel={cta.backLabel}
      />

      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl glass p-6 text-center">
        <p className="text-sm text-fg-muted">
          This is a hand-picked sample. QraftPaper builds quizzes and full mock
          papers like this from your own syllabus and past papers.
        </p>
        <GlowButton href={cta.primaryHref} size="md">
          <Sparkles className="h-4 w-4" />
          {cta.primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </GlowButton>
        <Link
          href="/#how"
          className="text-[0.78rem] text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
        >
          How does it work?
        </Link>
      </div>
    </div>
  );
}
