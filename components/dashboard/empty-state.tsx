import Link from "next/link";
import { ArrowRight, BookOpen, FileUp, ListChecks, Wand2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { exampleQuiz } from "@/lib/demo-data";

/**
 * First-run empty state for a brand-new dashboard. It gives the user one clear
 * path from source documents to a reusable subject profile, plus a sample quiz
 * so they can inspect the product before adding their own material.
 */
export function FirstRunEmptyState() {
  const steps = [
    {
      icon: FileUp,
      title: "Upload source material",
      body: "Add the syllabus, previous papers, PYQs, and unit weightage notes for one subject.",
    },
    {
      icon: Wand2,
      title: "Define the blueprint",
      body: "Set marks, duration, sections, unit weightage, and difficulty mix once.",
    },
    {
      icon: ListChecks,
      title: "Generate exam assets",
      body: "Create exam-ready papers and quizzes from the same verified subject profile.",
    },
  ];

  return (
    <div className="mt-10 flex flex-col gap-6">
      <GlassCard className="overflow-hidden p-8 ring-1 ring-violet/30">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
              Build the subject profile
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Turn syllabus data into a reusable paper engine.
            </h2>
            <p className="mt-2 max-w-xl text-[0.92rem] leading-relaxed text-fg-muted">
              Create a subject workspace, attach the source documents, and
              QraftPaper will prepare the structure needed for papers and
              quizzes built around your actual exam pattern.
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
              className="rounded-xl border border-line bg-tint/[0.025] p-4"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-tint/[0.05] text-violet-bright ring-1 ring-line">
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

      <GlassCard className="flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/25">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[0.95rem] font-medium">
              Review the generated quiz experience first.
            </p>
            <p className="mt-1 max-w-md text-[0.82rem] leading-snug text-fg-muted">
              Open a sample {exampleQuiz.subjectCode} quiz with instant scoring
              before adding your own syllabus and PYQ data.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/demo-quiz"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-tint/[0.05]"
        >
          Open sample quiz
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </GlassCard>
    </div>
  );
}
