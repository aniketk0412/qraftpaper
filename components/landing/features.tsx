import {
  BookMarked,
  FileOutput,
  Fingerprint,
  Layers3,
  ScanSearch,
  Scale,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { IconTile } from "@/components/ui/icon-tile";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function Features() {
  return (
    <section id="features" className="section-pad scroll-mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="The platform"
          title={
            <>
              Built for assessment teams
              <br className="hidden sm:block" /> that{" "}
              <span className="text-accent">need review control</span>
            </>
          }
          description="QraftPaper drafts structured papers from your material, then gives educators the checks and editing flow needed before anything reaches students."
          className="max-w-2xl"
        />

        <div className="mt-14 grid grid-cols-1 gap-3 lg:grid-cols-6">
          <Reveal className="lg:col-span-3">
            <GlassCard hover className="h-full p-7">
              <IconTile icon={Layers3} size="lg" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                Format-faithful generation
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-fg-muted">
                Upload text-based reference material, configure sections and
                marks, and generate drafts that follow the structure you set.
              </p>
              <div className="mt-6 flex gap-2">
                {["Section A", "Section B", "Section C"].map((s, i) => (
                  <div
                    key={s}
                    className="flex-1 rounded-lg border border-line bg-tint/[0.03] p-3"
                  >
                    <p className="font-mono text-[0.6rem] uppercase tracking-wider text-violet-bright">
                      {s}
                    </p>
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="h-1.5 rounded-full bg-tint/10" />
                      <div
                        className="h-1.5 rounded-full bg-tint/10"
                        style={{ width: `${70 - i * 12}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          <Reveal className="lg:col-span-3" delay={0.08}>
            <GlassCard hover className="h-full p-7">
              <IconTile icon={ScanSearch} tone="gold" size="lg" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                PYQ pattern intelligence
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-fg-muted">
                Previous papers help guide topic coverage and question style,
                while the editor keeps every generated paper reviewable.
              </p>
              <div className="mt-6 flex items-end gap-1.5">
                {[40, 62, 48, 78, 56, 88, 70, 94, 66].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-gold/20 to-gold/70"
                    style={{ height: `${h * 0.6}px` }}
                  />
                ))}
              </div>
            </GlassCard>
          </Reveal>

          {[
            {
              icon: Scale,
              title: "Blueprint report",
              body: "Compare generated sections, question counts, marks and difficulty against the requested structure.",
            },
            {
              icon: BookMarked,
              title: "Difficulty & Bloom's balance",
              body: "Set the intended Easy/Normal/Hard mix and review where the draft needs adjustment.",
            },
            {
              icon: Fingerprint,
              title: "Repeat reduction",
              body: "Uses past papers as context so drafts avoid obvious repeated wording where possible.",
            },
          ].map((f, i) => (
            <Reveal key={f.title} className="lg:col-span-2" delay={i * 0.07}>
              <GlassCard hover className="h-full p-6">
                <IconTile icon={f.icon} tone="neutral" />
                <h3 className="mt-4 text-base font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[0.86rem] leading-relaxed text-fg-muted">
                  {f.body}
                </p>
              </GlassCard>
            </Reveal>
          ))}

          <Reveal className="lg:col-span-6" delay={0.05}>
            <GlassCard hover className="h-full p-7">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <IconTile icon={FileOutput} size="lg" />
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">
                      Export anywhere
                    </h3>
                    <p className="mt-1.5 max-w-xl text-[0.9rem] leading-relaxed text-fg-muted">
                      PDF and editable Word export for papers, plus shareable
                      practice quiz links for students.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["PDF export", "Word export", "Shareable quiz links"].map(
                    (t) => (
                      <span
                        key={t}
                        className="rounded-lg border border-line bg-tint/[0.03] px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-wider text-fg-muted"
                      >
                        {t}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
