import { CheckCircle2, FileText } from "lucide-react";
import { PaperSheet } from "@/components/paper-sheet";
import { GlassCard } from "@/components/ui/glass-card";
import { MeterBar } from "@/components/ui/meter-bar";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { examplePaper, exampleWeightage, maxUnitWeight } from "@/lib/demo-data";

export function PaperShowcase() {
  return (
    <section id="showcase" className="section-pad scroll-mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Live output"
          title={
            <>
              A real paper, generated to
              <br className="hidden sm:block" /> a{" "}
              <span className="text-accent">real blueprint</span>
            </>
          }
          description="This is genuine QraftPaper output — every mark, unit and difficulty level placed exactly where the blueprint asked."
        />

        <div className="mt-14 grid items-start gap-4 lg:grid-cols-[0.82fr_1.18fr]">
          <Reveal>
            <GlassCard className="p-7">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
                Exam blueprint
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                {examplePaper.subject}
              </h3>
              <p className="text-[0.8rem] text-fg-muted">
                {examplePaper.subjectCode} · {examplePaper.totalMarks} marks ·{" "}
                {examplePaper.durationMins / 60} hours
              </p>

              <div className="mt-6 flex flex-col gap-3.5">
                {exampleWeightage.map((u, i) => (
                  <div key={u.unit}>
                    <div className="flex items-center justify-between text-[0.78rem]">
                      <span className="text-fg-muted">
                        <span className="font-mono text-fg-subtle">
                          {u.unit}
                        </span>{" "}
                        · {u.title}
                      </span>
                      <span className="font-mono text-fg">{u.weight}%</span>
                    </div>
                    <MeterBar
                      pct={(u.weight / maxUnitWeight) * 100}
                      height="h-2"
                      animate
                      delay={0.15 + i * 0.1}
                      className="mt-1.5"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-fg" />
                <p className="text-[0.8rem] text-fg-muted">
                  <span className="font-medium text-fg">Blueprint match 100%</span>{" "}
                  — every unit weighted exactly to plan.
                </p>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-2xl glass-strong shadow-2xl">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                </div>
                <div className="flex items-center gap-2 text-fg-muted">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-mono text-[0.68rem]">
                    Question-Paper-CS-204.pdf
                  </span>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-violet/30 bg-violet/10 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-wider text-violet-bright">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-bright" />
                  Live
                </span>
              </div>
              <div className="max-h-[34rem] overflow-y-auto">
                <PaperSheet paper={examplePaper} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
