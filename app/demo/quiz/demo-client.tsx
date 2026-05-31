"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  BookOpen,
  Briefcase,
  Calculator,
  CircuitBoard,
  Code2,
  Cog,
  FlaskConical,
  GraduationCap,
  Landmark,
  Languages,
  Lightbulb,
  ListChecks,
  School,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { QuizRunner } from "@/components/quiz-runner";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import {
  COLLEGE_DEPTS,
  SCHOOL_GRADES,
  bandForGrade,
  deptById,
  subjectsForGrade,
  type DemoSubject,
  type DemoTrack,
} from "@/lib/demo-quizzes";
import { cn } from "@/lib/utils";

/** Subject → icon, with a BookOpen fallback so the catalog can grow without
 *  editing this map. */
const SUBJECT_ICON: Record<string, LucideIcon> = {
  Mathematics: Calculator,
  "Engineering Mathematics": Calculator,
  English: Languages,
  "General Knowledge": Lightbulb,
  Science: FlaskConical,
  "General Science": FlaskConical,
  "Social Science": Landmark,
  "Data Structures": Code2,
  "Programming Fundamentals": Code2,
  "Engineering Physics": Atom,
  "Basic Electronics": CircuitBoard,
  "Basic Electrical Engineering": Zap,
  "Accountancy & Economics": Landmark,
  "Principles of Management": Briefcase,
};

const DEPT_ICON: Record<string, LucideIcon> = {
  cse: Code2,
  ece: CircuitBoard,
  mech: Cog,
  eee: Zap,
  math: Calculator,
  commerce: Landmark,
  management: Briefcase,
  science: FlaskConical,
};

const subjectIcon = (subject: string): LucideIcon =>
  SUBJECT_ICON[subject] ?? BookOpen;

/** Where the conversion CTAs point — a signed-out visitor is pushed to sign
 *  up, a signed-in (unpaid) user is pushed to subscribe. */
interface Cta {
  primaryHref: string;
  primaryLabel: string;
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
 * The demo-quiz experience. The visitor first tells us who they are — a school
 * class (1–10) or a college department — and we run a level-appropriate sample
 * quiz instead of dropping everyone into the same Data Structures quiz. Fully
 * client-side and answer-key-inline: no signup, no AI cost, no database.
 *
 * `signedIn` only swaps the conversion CTAs (sign up vs. subscribe) so the same
 * picker serves both the public funnel and the in-app upsell.
 */
export function DemoQuizClient({ signedIn = false }: { signedIn?: boolean }) {
  const cta = ctaFor(signedIn);
  const [track, setTrack] = useState<DemoTrack>("school");
  const [grade, setGrade] = useState<number | null>(null);
  const [deptId, setDeptId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{
    subject: DemoSubject;
    context: string;
  } | null>(null);

  if (selection) {
    return (
      <QuizView
        subject={selection.subject}
        context={selection.context}
        cta={cta}
        onBack={() => setSelection(null)}
      />
    );
  }

  function switchTrack(next: DemoTrack) {
    setTrack(next);
    setGrade(null);
    setDeptId(null);
  }

  const subjects: DemoSubject[] =
    track === "school"
      ? grade
        ? subjectsForGrade(grade)
        : []
      : deptId
        ? (deptById(deptId)?.subjects ?? [])
        : [];

  function pick(subject: DemoSubject) {
    const context =
      track === "school"
        ? `Class ${grade}`
        : (deptById(deptId ?? "")?.label ?? "College");
    setSelection({ subject, context });
  }

  const band = grade ? bandForGrade(grade) : undefined;

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
          Tell us your level and subject — we&apos;ll run a real sample quiz with
          a timer and instant scoring. No signup, no credits used.
        </p>
      </div>

      {/* Step 1a: school vs college */}
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-subtle">
        1 · Where are you studying?
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl glass p-1.5">
        {(
          [
            { id: "school", label: "School", icon: School },
            { id: "college", label: "College", icon: GraduationCap },
          ] as const
        ).map((t) => {
          const active = track === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTrack(t.id)}
              aria-pressed={active}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-2.5 text-[0.9rem] font-medium transition-all duration-200",
                active
                  ? "bg-violet/15 text-fg ring-1 ring-violet/40"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Step 1b: class (school) or department (college) */}
      {track === "school" ? (
        <>
          <p className="mt-7 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-subtle">
            2 · Pick your class
          </p>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {SCHOOL_GRADES.map((g) => {
              const active = grade === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  aria-pressed={active}
                  aria-label={`Class ${g}`}
                  className={cn(
                    "rounded-xl border py-2.5 text-center font-mono text-[0.9rem] font-medium tabular-nums transition-all duration-200",
                    active
                      ? "border-violet/50 bg-violet/15 text-violet-bright"
                      : "border-line bg-tint/[0.02] text-fg-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
          {band && (
            <p className="mt-2.5 text-[0.78rem] text-fg-subtle">
              <span className="text-fg-muted">{band.label}</span> · {band.range}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-7 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-subtle">
            2 · Pick your department
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {COLLEGE_DEPTS.map((dept) => {
              const Icon = DEPT_ICON[dept.id] ?? GraduationCap;
              const active = deptId === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setDeptId(dept.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200",
                    active
                      ? "border-violet/45 bg-violet/10"
                      : "border-line bg-tint/[0.02] hover:border-line-strong hover:bg-tint/[0.04]",
                  )}
                >
                  <IconTile
                    icon={Icon}
                    tone={active ? "violet" : "neutral"}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-[0.92rem] font-medium leading-snug">
                      {dept.label}
                    </p>
                    <p className="mt-0.5 text-[0.78rem] leading-snug text-fg-muted">
                      {dept.blurb}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Step 2: subject */}
      {subjects.length > 0 && (
        <>
          <p className="mt-8 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-subtle">
            3 · Pick a subject
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {subjects.map((entry) => {
              const Icon = subjectIcon(entry.subject);
              return (
                <button
                  key={entry.subject}
                  type="button"
                  onClick={() => pick(entry)}
                  className="group flex items-start gap-3.5 rounded-2xl border border-line bg-tint/[0.02] p-4 text-left transition-all duration-200 hover:border-violet/40 hover:bg-violet/[0.06]"
                >
                  <IconTile icon={Icon} tone="neutral" size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.92rem] font-medium leading-snug">
                      {entry.subject}
                    </p>
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
        </>
      )}

      <p className="mt-7 text-center text-[0.78rem] text-fg-subtle">
        Studying something else?{" "}
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
/*  Run the chosen quiz                                                        */
/* -------------------------------------------------------------------------- */

function QuizView({
  subject,
  context,
  cta,
  onBack,
}: {
  subject: DemoSubject;
  context: string;
  cta: Cta;
  onBack: () => void;
}) {
  const { quiz } = subject;
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
          {subject.subject} · {context}
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
