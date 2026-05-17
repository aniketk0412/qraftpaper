import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  FileText,
  Lock,
  Ruler,
  Sparkles,
} from "lucide-react";
import { PaperSheet } from "@/components/paper-sheet";
import { SubjectsSection } from "@/components/dashboard/subjects-section";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { Reveal } from "@/components/ui/reveal";
import { examplePaper } from "@/lib/demo-data";

const stats = [
  { icon: BookOpen, label: "Active subjects", value: "4", note: "across 3 departments" },
  { icon: FileText, label: "Papers generated", value: "33", note: "+6 this month" },
  { icon: Clock, label: "Faculty hours saved", value: "118", note: "this semester" },
  { icon: Ruler, label: "Saved blueprints", value: "9", note: "reusable templates" },
];

const activity = [
  { paper: "Data Structures — End-Sem", time: "2 hours ago", marks: 70 },
  { paper: "Signals & Systems — Mid-Sem", time: "Yesterday", marks: 50 },
  { paper: "Linear Algebra — Unit Test II", time: "3 days ago", marks: 30 },
  { paper: "Thermodynamics — End-Sem", time: "Last week", marks: 70 },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
              Workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
              Welcome back, Dr. Rao
            </h1>
            <p className="mt-1.5 text-sm text-fg-muted">
              {"Here's what's moving in your examination workspace today."}
            </p>
          </div>
          <GlowButton href="/papers/demo" size="md">
            <Sparkles className="h-4 w-4" />
            Generate a paper
          </GlowButton>
        </div>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <GlassCard hover className="h-full p-5">
              <IconTile icon={s.icon} tone="neutral" size="sm" />
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {s.value}
              </p>
              <p className="mt-0.5 text-[0.82rem] text-fg-muted">{s.label}</p>
              <p className="mt-2 font-mono text-[0.64rem] uppercase tracking-wider text-fg-subtle">
                {s.note}
              </p>
            </GlassCard>
          </Reveal>
        ))}
      </div>

      <SubjectsSection />

      <div className="mt-10 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Reveal>
          <div className="overflow-hidden rounded-2xl glass-strong">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-violet-bright" />
                <div className="leading-tight">
                  <p className="text-sm font-medium">Sample generated paper</p>
                  <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                    {examplePaper.subjectCode} · {examplePaper.totalMarks} marks
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-wider text-gold">
                <Lock className="h-3 w-3" />
                Sample
              </span>
            </div>

            <div className="relative">
              <div className="max-h-[26rem] overflow-hidden">
                <PaperSheet paper={examplePaper} />
              </div>
              {/* gradient fade masks the cut-off sheet and houses the upgrade CTA */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-canvas via-canvas/95 to-transparent px-6 pb-6 pt-24 text-center">
                <p className="max-w-sm text-sm text-fg-muted">
                  This is an example paper. Subscribe to generate papers from
                  your own syllabus, PYQs and weightages.
                </p>
                <GlowButton href="/signup" size="md">
                  Subscribe to unlock generation
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <GlassCard className="h-full p-5">
            <h2 className="text-sm font-semibold tracking-tight">
              Recent activity
            </h2>
            <div className="mt-4 flex flex-col gap-1">
              {activity.map((a) => (
                <div
                  key={a.paper}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.03]"
                >
                  <IconTile icon={FileText} tone="neutral" size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.84rem] font-medium">
                      {a.paper}
                    </p>
                    <p className="font-mono text-[0.64rem] uppercase tracking-wider text-fg-subtle">
                      {a.time} · {a.marks} marks
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/papers/demo"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[0.8rem] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              Open paper editor <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
}
