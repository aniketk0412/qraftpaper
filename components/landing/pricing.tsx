"use client";

import { ArrowRight, Check } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { PRICING_TIERS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="section-pad scroll-mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="Pricing"
          title={
            <>
              Priced for institutions,{" "}
              <span className="text-accent">not trials</span>
            </>
          }
          description="No free tier. Each plan includes a monthly generation allowance - you pay for review-ready drafts, not a sandbox."
        />

        <div className="mx-auto mt-14 grid max-w-3xl items-stretch gap-3 sm:grid-cols-2">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.09}>
              <div
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-2xl p-7",
                  tier.featured
                    ? "glass-strong ring-1 ring-violet/40"
                    : "glass",
                )}
              >
                {tier.featured && (
                  <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-violet/16 blur-[80px]" />
                )}
                <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-tint/25 to-transparent" />

                <div className="relative flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {tier.name}
                  </h3>
                  {tier.badge && (
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em]",
                        tier.featured
                          ? "border-violet/40 bg-violet/15 text-violet-bright"
                          : "border-line-strong bg-tint/[0.04] text-fg-muted",
                      )}
                    >
                      {tier.badge}
                    </span>
                  )}
                </div>

                <p className="relative mt-2 text-[0.84rem] leading-snug text-fg-muted">
                  {tier.tagline}
                </p>

                <div className="relative mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight text-gradient">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm text-fg-subtle">{tier.period}</span>
                  )}
                </div>

                <div className="relative mt-6">
                  <GlowButton
                    href="/signup"
                    variant={tier.featured ? "primary" : "secondary"}
                    size="md"
                    className="w-full"
                  >
                    {tier.cta}
                    <ArrowRight className="h-4 w-4" />
                  </GlowButton>
                </div>

                <ul className="relative mt-7 flex flex-1 flex-col gap-3 border-t border-line pt-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full",
                          tier.featured
                            ? "bg-violet/20 text-violet-bright"
                            : "bg-tint/[0.06] text-fg-muted",
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-[0.86rem] text-fg-muted">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-8 text-center font-mono text-[0.7rem] uppercase tracking-[0.16em] text-fg-subtle">
            Billed monthly - Cancel anytime - All purchases final
          </p>
        </Reveal>
      </div>
    </section>
  );
}
