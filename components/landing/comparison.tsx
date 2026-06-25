import { Check, X } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

// The single objection in every student's head: "why pay when ChatGPT is
// free?" This section answers it head-on. Each row is a dimension where a
// purpose-built tool beats a general chatbot — read ACROSS the row to feel
// the gap. Keep claims to things the product genuinely does (see Features).
const dimensions: { label: string; chatgpt: string; qraft: string }[] = [
  {
    label: "Question format",
    chatgpt: "Generic, random questions",
    qraft: "Matches your sections & marks",
  },
  {
    label: "Knows your syllabus",
    chatgpt: "You re-paste it every time",
    qraft: "Learns it once, reuses it",
  },
  {
    label: "Knows your prof's style",
    chatgpt: "No idea",
    qraft: "Trained on your previous papers",
  },
  {
    label: "Difficulty control",
    chatgpt: "Hit or miss",
    qraft: "Set the Easy / Medium / Hard split",
  },
  {
    label: "Repeats",
    chatgpt: "Asks the same thing again",
    qraft: "Cross-checks — no repeats",
  },
  {
    label: "What you walk away with",
    chatgpt: "A chat you scroll and lose",
    qraft: "PDF, Word & a shareable quiz",
  },
  {
    label: "Matches the real blueprint",
    chatgpt: "No way to tell",
    qraft: "Live blueprint-match score",
  },
];

export function Comparison() {
  return (
    <section id="why-not-chatgpt" className="section-pad scroll-mt-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="ChatGPT vs QraftPaper"
          align="center"
          title={
            <>
              ChatGPT gives you questions.{" "}
              <span className="text-accent">
                QraftPaper gives you your exam.
              </span>
            </>
          }
          description="Free question generation is everywhere. Practising in the exact shape of your paper isn't — that's the difference between feeling ready and being ready."
        />

        <Reveal delay={0.1} className="mt-10">
          <div className="overflow-hidden rounded-2xl glass-strong shadow-2xl">
            {/* Header row — the two contenders. */}
            <div className="grid grid-cols-[1fr_1fr] border-b border-line sm:grid-cols-[1.2fr_1fr_1fr]">
              {/* Spacer cell, hidden on mobile where labels stack inline. */}
              <div className="hidden sm:block" />
              <div className="border-l border-line px-4 py-4 text-center">
                <p className="text-[0.8rem] font-semibold text-fg-muted sm:text-[0.92rem]">
                  ChatGPT
                </p>
                <p className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-fg-subtle">
                  Generic chatbot
                </p>
              </div>
              <div className="border-l border-line bg-accent/[0.06] px-4 py-4 text-center">
                <p className="text-[0.8rem] font-semibold text-accent sm:text-[0.92rem]">
                  QraftPaper
                </p>
                <p className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-violet-bright">
                  Built for your exam
                </p>
              </div>
            </div>

            {dimensions.map((d, i) => (
              <div
                key={d.label}
                className={cn(
                  "grid grid-cols-[1fr_1fr] sm:grid-cols-[1.2fr_1fr_1fr]",
                  i % 2 === 1 && "bg-tint/[0.015]",
                )}
              >
                {/* Dimension label — full width on mobile, first column on sm+. */}
                <div className="col-span-2 border-b border-line px-4 pb-1 pt-3 text-[0.78rem] font-medium text-fg sm:col-span-1 sm:border-b-0 sm:border-t sm:border-line sm:py-4 sm:text-[0.86rem]">
                  {d.label}
                </div>
                <div className="flex items-start gap-2 border-l border-t border-line px-4 py-3.5">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
                  <span className="text-[0.78rem] leading-snug text-fg-muted sm:text-[0.82rem]">
                    {d.chatgpt}
                  </span>
                </div>
                <div className="flex items-start gap-2 border-l border-t border-line bg-accent/[0.06] px-4 py-3.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-[0.78rem] font-medium leading-snug text-fg sm:text-[0.82rem]">
                    {d.qraft}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.16} className="mt-6">
          <p className="text-center text-[0.82rem] text-fg-subtle">
            Same AI underneath — pointed at <em>your</em> paper instead of a
            blank prompt.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
