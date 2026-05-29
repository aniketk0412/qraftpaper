import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileUp,
  ListChecks,
  Wand2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { exampleQuiz } from "@/lib/demo-data";

/**
 * First-run empty state for a brand-new dashboard (no subjects yet).
 * Replaces the empty SubjectsSection + cold GenerationPanel pair with:
 *  - A 3-step "this is how it works" path
 *  - A "Try a sample MCQ right now" link to a real quiz so they experience
 *    the product before being asked to upload anything
 *  - One clear primary CTA: Create your first subject
 *
 * Goal: stop new users bouncing on a wall of empty cards.
 */
export function FirstRunEmptyState() {
  const steps = [
    {
      icon: FileUp,
      title: "Drop in one PDF",
      body: "Your syllabus and last year's question paper in a single combined PDF. Text-based, not scanned.",
    },
    {
      icon: Wand2,
      title: "Tell it the format",
      body: "Total marks, hours, number of sections, difficulty mix. Save once, reuse forever.",
    },
    {
      icon: ListChecks,
      title: "Practise — print, share, retake",
      body: "Generate mock papers and timed MCQ quizzes. Solve them. Send them to friends. Repeat.",
    },
  ];

  return (
    <div className="mt-10 flex flex-col gap-6">
      {/* Primary path: create a subject */}
      <GlassCard className="overflow-hidden p-8 ring-1 ring-violet/30">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
              Start in two minutes
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Your first practice paper is one upload away.
            </h2>
            <p className="mt-2 max-w-xl text-[0.92rem] leading-relaxed text-fg-muted">
              Create a subject, drop in your syllabus and last year&apos;s
              question paper, and you&apos;ll have a mock paper ready in under
              a minute. No credit card needed to set this up.
            </p>
          </div>
          <div className="flex justify-start lg:justify-end">
            <GlowButton href="/dashboard/subjects/new" size="lg">
              Create your first subject
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-xl border border-line bg-tint/[0.02] p-4"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-tint/[0.04] text-violet-bright ring-1 ring-line">
                  <step.icon className="h-3.5 w-3.5" />
                </span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-fg-subtle">
                  Step {i + 1}
                </span>
              </div>
              <p className="mt-3 text-[0.86rem] font-medium">{step.title}</p>
              <p className="mt-1 text-[0.78rem] leading-snug text-fg-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Secondary path: experience the product NOW without uploading */}
      <GlassCard className="flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/25">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[0.95rem] font-medium">
              Want to see what it looks like before uploading?
            </p>
            <p className="mt-1 max-w-md text-[0.82rem] leading-snug text-fg-muted">
              Take a real {exampleQuiz.subjectCode} sample MCQ quiz right now.
              No signup decisions. Just 5 questions with instant scoring.
            </p>
          </div>
        </div>
        <Link
          href="/demo/quiz"
          className="inline-flex shrink-0 items-center gap-2 rounded-full glass-strong px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-tint/[0.08]"
        >
          Try the sample quiz
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </GlassCard>
    </div>
  );
}
