import { Counter } from "@/components/ui/counter";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal } from "@/components/ui/reveal";

const stats = [
  { to: 128, suffix: "K+", label: "Question papers generated" },
  { to: 98.7, decimals: 1, suffix: "%", label: "Blueprint accuracy" },
  { to: 4200, suffix: "+", label: "Faculty hours saved weekly" },
  { to: 42, suffix: "", label: "Institutions onboarded" },
];

export function Stats() {
  return (
    <section className="section-pad">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <GlassCard hover className="h-full p-6 sm:p-7">
                <p className="text-4xl font-semibold tracking-tight text-gradient sm:text-5xl">
                  <Counter to={s.to} decimals={s.decimals} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-[0.82rem] leading-snug text-fg-muted">
                  {s.label}
                </p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
