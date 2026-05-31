import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { NewSubjectForm } from "@/components/dashboard/new-subject-form";
import { GlassCard } from "@/components/ui/glass-card";
import { IconTile } from "@/components/ui/icon-tile";
import { Reveal } from "@/components/ui/reveal";
import { BackLink } from "@/components/dashboard/back-link";

export const metadata: Metadata = {
  title: "New subject — QraftPaper",
};

export const runtime = "nodejs";

export default function NewSubjectPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/dashboard/subjects" label="Back to subjects" />
      <Reveal>
        <GlassCard className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <IconTile icon={BookOpen} tone="violet" size="lg" />
            <div>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
                New subject
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
                Add a subject to generate your own quizzes
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                A subject is what QraftPaper generates from — once it&apos;s
                added you can create mock papers and timed MCQ quizzes on it.
                Upload one combined PDF, or separate syllabus, sample and PYQ
                files; we extract the text once and store a compact profile for
                generation.
              </p>
            </div>
          </div>

          <NewSubjectForm />
        </GlassCard>
      </Reveal>
    </div>
  );
}
