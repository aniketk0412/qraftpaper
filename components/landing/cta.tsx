import { ArrowRight } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";

export function Cta() {
  return (
    <section className="section-pad">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] glass-strong px-6 py-16 text-center sm:px-16 sm:py-24">
            <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-violet/14 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-40 right-0 h-72 w-72 rounded-full bg-gold/[0.07] blur-[120px]" />
            <span className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-tint/30 to-transparent" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-fg-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(45,139,139,0.5)]" />
                Ready in minutes
              </span>

              <h2 className="mx-auto mt-6 max-w-2xl text-balance text-[2.2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-gradient sm:text-5xl">
                Set your next question paper{" "}
                <span className="text-accent">before this meeting ends</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-[0.97rem] leading-relaxed text-fg-muted">
                Replace weeks of paper-setting with a workflow that takes
                minutes — without compromising on rigour.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <GlowButton href="/signup" size="lg">
                  Sign up
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                </GlowButton>
                <GlowButton href="/login" variant="secondary" size="lg">
                  Sign in
                </GlowButton>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
