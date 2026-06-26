"use client";

import { ArrowRight, Check } from "lucide-react";
import { useSyncExternalStore } from "react";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { detectIndiaClient } from "@/lib/locale";
import { PRICING_TIERS } from "@/lib/plans";
import { cn } from "@/lib/utils";

// The INR flag never changes after mount (timezone/language don't shift live),
// so the external "store" has a no-op subscribe.
const noopSubscribe = () => () => {};

export function Pricing({
  country,
  signedIn = false,
}: {
  country?: string;
  signedIn?: boolean;
}) {
  // Show INR for visitors from India. USD is still what LemonSqueezy charges;
  // this is a perception fix so ₹579 reads cheaper than the abstract "$7".
  //
  // useSyncExternalStore is React's hydration-safe primitive for a value that
  // legitimately differs between server and client:
  //   - server snapshot: the Vercel geo header (correct + instant on prod).
  //   - client snapshot: header OR the browser's own timezone/language, which
  //     is the ONLY signal that works in local dev, on previews, and
  //     off-Vercel. React renders the server snapshot during SSR + the first
  //     hydration pass, then swaps to the client snapshot — no mismatch
  //     warning, and no setState-in-effect.
  const showInr = useSyncExternalStore(
    noopSubscribe,
    () => country === "IN" || detectIndiaClient(),
    () => country === "IN",
  );
  return (
    <section id="pricing" className="section-pad scroll-mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="Pricing"
          title={
            <>
              Cheaper than a single{" "}
              <span className="text-accent">tutoring session</span>
            </>
          }
          description="Try QraftPaper on your real exam with the 3-Day Pass, then upgrade to Solo when you want the full monthly allowance. No fake free tier — every plan includes real generations."
        />

        <div className="mx-auto mt-10 grid max-w-4xl items-stretch gap-4 lg:grid-cols-2">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.09}>
              {/* Bordered plate — featured plan framed in a 2px indigo rule
                  (no glow halo, no glass light-catch); the other in a hairline.
                  Structure and ink do the emphasis, not a blur. */}
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl p-7",
                  tier.featured
                    ? "border-2 border-accent bg-panel"
                    : "border border-line bg-card",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {tier.name}
                  </h3>
                  {tier.badge && (
                    <span
                      className={cn(
                        "rounded-[2px] border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em]",
                        tier.featured
                          ? "border-accent/50 bg-accent/10 text-violet-bright"
                          : "border-line-strong bg-card-hi text-fg-muted",
                      )}
                    >
                      {tier.badge}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[0.84rem] leading-snug text-fg-muted">
                  {tier.tagline}
                </p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-display text-fg">
                      {showInr && tier.priceInr ? tier.priceInr : tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-sm text-fg-subtle">
                        {tier.period}
                      </span>
                    )}
                  </div>
                  {/* Currency context under the price. India sees the USD
                      anchor (since we display an approximate ₹); everyone
                      else gets told they can pay in their own currency — the
                      reassurance international visitors were missing when all
                      they saw was an abstract "$7". */}
                  <p className="mt-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-fg-subtle">
                    {showInr && tier.priceInr
                      ? `Billed as ${tier.price} ${tier.period} · local currency at checkout`
                      : "Pay in your local currency at checkout"}
                  </p>
                  {/* Per-paper value anchor on the primary plan — reframes the
                      monthly price as the trivial per-unit cost it really is. */}
                  {tier.featured && (
                    <p className="mt-2.5 text-[0.74rem] leading-snug text-fg-muted">
                      That&apos;s about{" "}
                      <span className="font-medium text-fg">
                        {showInr && tier.priceInr ? "₹29 a paper" : "$0.35 a paper"}
                      </span>{" "}
                      — cheaper than one tuition class.
                    </p>
                  )}
                </div>

                <div className="relative mt-6">
                  <GlowButton
                    href={signedIn ? "/billing" : "/signup"}
                    variant={tier.featured ? "primary" : "secondary"}
                    size="md"
                    className="w-full"
                  >
                    {tier.cta}
                    <ArrowRight className="h-4 w-4" />
                  </GlowButton>
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-2.5 border-t border-line pt-5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          tier.featured ? "text-accent" : "text-fg-subtle",
                        )}
                        strokeWidth={2.5}
                      />
                      <span className="text-[0.86rem] text-fg-muted">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-col items-center gap-3">
            {/* International-payments trust row — the signal a global product
                needs and was missing. Lemon Squeezy (Merchant of Record)
                handles all of this; we just surface it so a visitor outside
                the US/India knows they can actually pay. */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-fg-subtle">
              <span>130+ currencies</span>
              <span aria-hidden>·</span>
              <span>All major cards</span>
              <span aria-hidden>·</span>
              <span>Taxes &amp; VAT included</span>
              <span aria-hidden>·</span>
              <span>Cancel anytime</span>
            </div>
            <p className="text-center font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg-subtle/80">
              Secure checkout via Lemon Squeezy — pay in your local currency
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
