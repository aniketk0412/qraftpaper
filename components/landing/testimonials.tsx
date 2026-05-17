import { Quote } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { testimonials } from "@/lib/demo-data";

export function Testimonials() {
  return (
    <section className="section-pad">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="Proof"
          title={
            <>
              Examination cells already{" "}
              <span className="text-accent">rely on it</span>
            </>
          }
          description="Decision-makers at universities and institutes use QraftPaper to set papers their boards trust."
        />

        <div className="mt-14 grid gap-3 lg:grid-cols-3">
          {testimonials.map((q, i) => (
            <Reveal key={q.name} delay={i * 0.09}>
              <GlassCard hover className="flex h-full flex-col p-7">
                <Quote className="h-7 w-7 text-violet/50" fill="currentColor" />
                <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-fg/90">
                  {q.text}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-card-hi font-mono text-sm font-medium text-fg ring-1 ring-line">
                    {q.initials}
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{q.name}</p>
                    <p className="text-[0.76rem] text-fg-muted">
                      {q.role}, {q.org}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
