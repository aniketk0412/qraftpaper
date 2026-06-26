import {
  BookMarked,
  FileOutput,
  Fingerprint,
  Layers3,
  ScanSearch,
  Scale,
} from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const smallFeatures = [
  {
    icon: Scale,
    title: "Blueprint-match score",
    body: "Live % score showing how close each generated paper is to your requested marks, sections and difficulty mix.",
  },
  {
    icon: BookMarked,
    title: "Difficulty mix you control",
    body: "Set Easy / Medium / Hard percentages and the draft balances toward it. Easier paper for revision, harder for mocks.",
  },
  {
    icon: Fingerprint,
    title: "Doesn't repeat itself",
    body: "Cross-checks against your previous papers so the same question doesn't show up twice in your study set.",
  },
];

export function Features() {
  return (
    <section id="features" className="section-pad scroll-mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Why it beats pasting into ChatGPT"
          title={
            <>
              Practice papers that
              <br className="hidden sm:block" /> actually{" "}
              <span className="text-accent">look like your exam</span>
            </>
          }
          description="ChatGPT spits out random questions. QraftPaper learns your syllabus and your previous-year paper format — so the drafts mirror the real exam, not generic LLM filler."
          className="max-w-2xl"
        />

        {/* Structure over cards: one ruled printing plate. No gaps, no rounded
            boxes, no drop shadows — hairline grid lines do the dividing, like
            cells on an exam blueprint. The plate reveals as a single unit so
            the shared rules never fall out of alignment mid-animation. */}
        <Reveal className="mt-10">
          <div className="plate-grid grid grid-cols-1 lg:grid-cols-6">
            <div className="p-7 transition-colors duration-150 hover:bg-card-hi lg:col-span-3">
              <IconTile icon={Layers3} size="lg" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                Structured like the real paper
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-fg-muted">
                Sections, marks per question, hours — set them once and every
                generation follows that blueprint. Not a wall of random Q&A.
              </p>
              <div className="mt-6 flex gap-2">
                {["Section A", "Section B", "Section C"].map((s, i) => (
                  <div
                    key={s}
                    className="flex-1 border border-line bg-canvas p-3"
                  >
                    <p className="font-mono text-[0.6rem] uppercase tracking-wider text-violet-bright">
                      {s}
                    </p>
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="h-1.5 bg-line-strong" />
                      <div
                        className="h-1.5 bg-line-strong"
                        style={{ width: `${70 - i * 12}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-7 transition-colors duration-150 hover:bg-card-hi lg:col-span-3">
              <IconTile icon={ScanSearch} tone="gold" size="lg" />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                Trained on your PYQs
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-fg-muted">
                Upload last year&apos;s paper and the model picks up your
                professor&apos;s favourite topics, phrasing and weightage — so
                practice feels like the actual paper, not a stranger&apos;s.
              </p>
              {/* Flat printed histogram — exam-marker red bars, no gradient. */}
              <div className="mt-6 flex items-end gap-1.5">
                {[40, 62, 48, 78, 56, 88, 70, 94, 66].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gold/70"
                    style={{ height: `${h * 0.6}px` }}
                  />
                ))}
              </div>
            </div>

            {smallFeatures.map((f) => (
              <div
                key={f.title}
                className="p-6 transition-colors duration-150 hover:bg-card-hi lg:col-span-2"
              >
                <IconTile icon={f.icon} tone="neutral" />
                <h3 className="mt-4 text-base font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[0.86rem] leading-relaxed text-fg-muted">
                  {f.body}
                </p>
              </div>
            ))}

            <div className="p-7 transition-colors duration-150 hover:bg-card-hi lg:col-span-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <IconTile icon={FileOutput} size="lg" />
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">
                      Print, share, practise
                    </h3>
                    <p className="mt-1.5 max-w-xl text-[0.9rem] leading-relaxed text-fg-muted">
                      PDF export to print and solve by hand. Word export to
                      edit. Shareable quiz links to send the same MCQ test to
                      your study group.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["PDF export", "Word export", "Shareable quiz links"].map(
                    (t) => (
                      <span
                        key={t}
                        className="border border-line bg-canvas px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-wider text-fg-muted"
                      >
                        {t}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
