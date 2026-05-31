"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  BookOpen,
  Briefcase,
  Calculator,
  Check,
  CircuitBoard,
  Code2,
  Cog,
  FlaskConical,
  GraduationCap,
  HardHat,
  Landmark,
  Languages,
  Lightbulb,
  ListChecks,
  Microscope,
  Pill,
  Scale,
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

/** Subject → icon, BookOpen fallback so the catalog can grow without edits. */
const SUBJECT_ICON: Record<string, LucideIcon> = {
  Mathematics: Calculator,
  "Engineering Mathematics": Calculator,
  English: Languages,
  "General Knowledge": Lightbulb,
  Science: FlaskConical,
  "General Science": FlaskConical,
  "Social Science": Landmark,
  Physics: Atom,
  Chemistry: FlaskConical,
  Biology: Microscope,
  Accountancy: Landmark,
  Economics: Landmark,
  "Business Studies": Briefcase,
  History: BookOpen,
  "Political Science": Landmark,
  "Data Structures": Code2,
  "Programming Fundamentals": Code2,
  "Engineering Physics": Atom,
  "Basic Electronics": CircuitBoard,
  "Basic Electrical Engineering": Zap,
  "Accountancy & Economics": Landmark,
  "Principles of Management": Briefcase,
  "Civil Engineering Basics": HardHat,
  "Biotechnology Basics": Microscope,
  "Pharmacy Fundamentals": Pill,
  "Law Fundamentals": Scale,
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
  civil: HardHat,
  biotech: Microscope,
  pharmacy: Pill,
  law: Scale,
};

const subjectIcon = (subject: string): LucideIcon =>
  SUBJECT_ICON[subject] ?? BookOpen;

/** Where the conversion CTAs point — signed-out → sign up, signed-in → subscribe. */
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
 * The demo-quiz experience, built as a guided wizard so a visitor feels like
 * they're filling in a short form to set up their quiz: Level → Class/Department
 * → Subject → a "ready to start" review. A progress stepper shows where they
 * are and lets them jump back. Fully client-side and answer-key-inline: no
 * signup, no AI cost, no database.
 *
 * `signedIn` only swaps the conversion CTAs (sign up vs. subscribe).
 */
export function DemoQuizClient({ signedIn = false }: { signedIn?: boolean }) {
  const cta = ctaFor(signedIn);
  const [track, setTrack] = useState<DemoTrack | null>(null);
  const [grade, setGrade] = useState<number | null>(null);
  const [deptId, setDeptId] = useState<string | null>(null);
  const [subject, setSubject] = useState<DemoSubject | null>(null);
  const [started, setStarted] = useState(false);

  // Context shown in the quiz header + review, e.g. "Class 11 · Science" or
  // "Computer Science / IT".
  const context =
    track === "school"
      ? `Class ${grade ?? ""}${subject?.stream ? ` · ${subject.stream}` : ""}`
      : (deptById(deptId ?? "")?.label ?? "College");

  if (started && subject) {
    return (
      <QuizView
        subject={subject}
        context={context}
        cta={cta}
        onBack={() => setStarted(false)}
      />
    );
  }

  /* ---- derive the current step (0..3) -------------------------------- */
  const stageDone = track === "school" ? grade !== null : deptId !== null;
  let stepIndex = 0;
  if (track) stepIndex = 1;
  if (track && stageDone) stepIndex = 2;
  if (subject) stepIndex = 3;

  const steps = [
    { label: "Level" },
    { label: track === "college" ? "Department" : "Class" },
    { label: "Subject" },
    { label: "Start" },
  ];

  /* ---- navigation ---------------------------------------------------- */
  function chooseTrack(next: DemoTrack) {
    setTrack(next);
    setGrade(null);
    setDeptId(null);
    setSubject(null);
  }
  function back() {
    if (subject) setSubject(null);
    else if (stageDone) {
      setGrade(null);
      setDeptId(null);
    } else if (track) setTrack(null);
  }
  /** Jump back to an earlier (already-completed) step via the stepper. */
  function goToStep(i: number) {
    if (i >= stepIndex) return;
    setSubject(null);
    if (i <= 1) {
      setGrade(null);
      setDeptId(null);
    }
    if (i <= 0) setTrack(null);
  }

  const subjects: DemoSubject[] =
    track === "school"
      ? grade
        ? subjectsForGrade(grade)
        : []
      : deptId
        ? (deptById(deptId)?.subjects ?? [])
        : [];

  const band = grade ? bandForGrade(grade) : undefined;

  return (
    <div>
      <div className="mb-6">
        <p className="flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
          <ListChecks className="h-3.5 w-3.5" />
          Set up your sample quiz
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">
          A quiz built for what you study
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-fg-muted">
          Answer three quick questions and we&apos;ll run a real sample quiz —
          timer, instant scoring, no signup, no credits.
        </p>
      </div>

      {/* Progress stepper */}
      <ol className="mb-7 flex items-center">
        {steps.map((s, i) => {
          const state = i < stepIndex ? "done" : i === stepIndex ? "current" : "todo";
          return (
            <li key={s.label} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={state === "todo"}
                onClick={() => goToStep(i)}
                className={cn(
                  "flex items-center gap-2",
                  state !== "todo" && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-[0.72rem] font-medium transition-colors",
                    state === "done" && "border-violet/50 bg-violet/20 text-violet-bright",
                    state === "current" && "border-violet bg-violet text-on-accent",
                    state === "todo" && "border-line text-fg-subtle",
                  )}
                >
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-[0.78rem] sm:inline",
                    state === "current" ? "font-medium text-fg" : "text-fg-muted",
                  )}
                >
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "mx-2 h-px flex-1",
                    i < stepIndex ? "bg-violet/40" : "bg-line",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Back control (everything except the first step) */}
      {stepIndex > 0 && (
        <button
          type="button"
          onClick={back}
          className="mb-4 inline-flex items-center gap-1.5 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      )}

      {/* STEP CONTENT */}
      {stepIndex === 0 && <LevelStep onPick={chooseTrack} />}

      {stepIndex === 1 && track === "school" && (
        <ClassStep grade={grade} band={band} onPick={setGrade} />
      )}
      {stepIndex === 1 && track === "college" && (
        <DepartmentStep deptId={deptId} onPick={setDeptId} />
      )}

      {stepIndex === 2 && (
        <SubjectStep subjects={subjects} onPick={setSubject} />
      )}

      {stepIndex === 3 && subject && (
        <ReadyStep
          subject={subject}
          context={context}
          onStart={() => setStarted(true)}
        />
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
/*  Steps                                                                      */
/* -------------------------------------------------------------------------- */

function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-subtle">
      Step {n} of 4 · {title}
    </p>
  );
}

function LevelStep({ onPick }: { onPick: (t: DemoTrack) => void }) {
  const levels = [
    { id: "school" as const, label: "School", blurb: "Classes 1–12, board syllabus", icon: School },
    { id: "college" as const, label: "College / University", blurb: "Undergraduate & professional courses", icon: GraduationCap },
  ];
  return (
    <div>
      <StepHeading n={1} title="Where are you studying?" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {levels.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onPick(l.id)}
            className="group flex items-center gap-3.5 rounded-2xl border border-line bg-tint/[0.02] p-4 text-left transition-all duration-200 hover:border-violet/40 hover:bg-violet/[0.06]"
          >
            <IconTile icon={l.icon} tone="neutral" size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.95rem] font-medium">{l.label}</p>
              <p className="text-[0.8rem] text-fg-muted">{l.blurb}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-fg-subtle transition-all group-hover:translate-x-0.5 group-hover:text-violet-bright" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ClassStep({
  grade,
  band,
  onPick,
}: {
  grade: number | null;
  band: ReturnType<typeof bandForGrade>;
  onPick: (g: number) => void;
}) {
  return (
    <div>
      <StepHeading n={2} title="Pick your class" />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {SCHOOL_GRADES.map((g) => {
          const active = grade === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onPick(g)}
              aria-pressed={active}
              aria-label={`Class ${g}`}
              className={cn(
                "rounded-xl border py-3 text-center font-mono text-[0.95rem] font-medium tabular-nums transition-all duration-200",
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
        <p className="mt-3 text-[0.78rem] text-fg-subtle">
          <span className="text-fg-muted">{band.label}</span> · {band.range}
        </p>
      )}
    </div>
  );
}

function DepartmentStep({
  deptId,
  onPick,
}: {
  deptId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <StepHeading n={2} title="Pick your department" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COLLEGE_DEPTS.map((dept) => {
          const Icon = DEPT_ICON[dept.id] ?? GraduationCap;
          const active = deptId === dept.id;
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => onPick(dept.id)}
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
                <p className="text-[0.92rem] font-medium leading-snug">{dept.label}</p>
                <p className="mt-0.5 text-[0.78rem] leading-snug text-fg-muted">{dept.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubjectStep({
  subjects,
  onPick,
}: {
  subjects: DemoSubject[];
  onPick: (s: DemoSubject) => void;
}) {
  // Group by stream when present (Class 11–12), otherwise one flat grid.
  const streams = [...new Set(subjects.map((s) => s.stream).filter(Boolean))] as string[];

  function grid(list: DemoSubject[]) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {list.map((entry) => {
          const Icon = subjectIcon(entry.subject);
          return (
            <button
              key={entry.subject}
              type="button"
              onClick={() => onPick(entry)}
              className="group flex items-start gap-3.5 rounded-2xl border border-line bg-tint/[0.02] p-4 text-left transition-all duration-200 hover:border-violet/40 hover:bg-violet/[0.06]"
            >
              <IconTile icon={Icon} tone="neutral" size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-[0.92rem] font-medium leading-snug">{entry.subject}</p>
                <p className="mt-1 text-[0.8rem] leading-snug text-fg-muted">{entry.blurb}</p>
                <p className="mt-2 inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-wider text-violet-bright opacity-0 transition-opacity group-hover:opacity-100">
                  Choose
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <StepHeading n={3} title="Pick a subject" />
      {streams.length > 0 ? (
        <div className="flex flex-col gap-5">
          {streams.map((stream) => (
            <div key={stream}>
              <p className="mb-2.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-violet-bright">
                {stream} stream
              </p>
              {grid(subjects.filter((s) => s.stream === stream))}
            </div>
          ))}
        </div>
      ) : (
        grid(subjects)
      )}
    </div>
  );
}

function ReadyStep({
  subject,
  context,
  onStart,
}: {
  subject: DemoSubject;
  context: string;
  onStart: () => void;
}) {
  const { quiz } = subject;
  return (
    <div>
      <StepHeading n={4} title="Ready to start" />
      <div className="overflow-hidden rounded-2xl glass-strong p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet/15 text-violet-bright ring-1 ring-violet/30">
          <ListChecks className="h-5 w-5" />
        </span>
        <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-subtle">
          {context}
        </p>
        <h2 className="mt-1.5 text-xl font-semibold tracking-tight">{subject.subject}</h2>
        <p className="mt-1 text-sm text-fg-muted">{quiz.title}</p>

        <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2 text-[0.78rem] text-fg-muted">
          <span className="rounded-full border border-line bg-tint/[0.03] px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider">
            {quiz.questions.length} questions
          </span>
          <span className="rounded-full border border-line bg-tint/[0.03] px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider">
            {quiz.durationMins} min
          </span>
          <span className="rounded-full border border-line bg-tint/[0.03] px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider">
            instant scoring
          </span>
        </div>

        <div className="mt-6 flex justify-center">
          <GlowButton onClick={onStart} size="md">
            Start the quiz
            <ArrowRight className="h-4 w-4" />
          </GlowButton>
        </div>
        <p className="mt-3 text-[0.74rem] text-fg-subtle">
          No signup, no credits used.
        </p>
      </div>
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
        Change quiz setup
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
