import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { IconTile } from "@/components/ui/icon-tile";
import { billingTiers } from "@/lib/billing/lemonsqueezy";
import { getDb } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { listUserSubjects } from "@/lib/subjects";
import { cn } from "@/lib/utils";
import { CheckoutButton } from "./checkout-button";

export const runtime = "nodejs";

function deriveInitials(name?: string | null, email?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email ?? "U").slice(0, 2).toUpperCase();
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string | string[] }>;
}) {
  const session = await auth();
  const subjects = session?.user?.id
    ? await listUserSubjects(session.user.id)
    : [];
  const [subscription] = session?.user?.id
    ? await getDb()
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.user.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)
    : [];
  const { checkout } = await searchParams;
  const checkoutStatus = Array.isArray(checkout) ? checkout[0] : checkout;
  const currentPlan = session?.user?.plan ?? "unpaid";
  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? "",
    institution: session?.user?.institution ?? null,
    initials: deriveInitials(session?.user?.name, session?.user?.email),
  };

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar />
      <Topbar subjects={subjects} user={user} />
      <main className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
                Billing
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
                Manage your QraftPaper plan
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">
                Lemon Squeezy is the merchant of record, so international cards,
                local currency display, VAT/GST and sales tax are handled outside
                your QraftPaper workspace.
              </p>
            </div>
          </div>

          {checkoutStatus === "success" && (
            <GlassCard className="mt-7 flex items-start gap-3 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium">Checkout completed</p>
                <p className="mt-0.5 text-[0.82rem] text-fg-muted">
                  Your plan updates after the Lemon Squeezy webhook confirms the
                  subscription. Refresh this page in a few seconds if it has not
                  changed yet.
                </p>
              </div>
            </GlassCard>
          )}

          <div className="mt-8 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
            <GlassCard className="p-6">
              <IconTile icon={CreditCard} />
              <p className="mt-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
                Current plan
              </p>
              <h2 className="mt-2 text-2xl font-semibold capitalize tracking-tight">
                {currentPlan}
              </h2>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-fg-muted">
                {subscription
                  ? `Subscription status: ${subscription.status}.`
                  : "No paid subscription is connected to this workspace yet."}
              </p>
              <div className="mt-5 rounded-xl border border-line bg-tint/[0.03] p-4">
                <p className="text-sm font-medium">Usage is plan-gated</p>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-fg-muted">
                  Educator includes 40 generations/month. Department includes 400
                  generations/month. Institution plans are handled directly.
                </p>
              </div>
            </GlassCard>

            <div className="grid gap-3 md:grid-cols-2">
              {Object.values(billingTiers).map((tier) => {
                const active = currentPlan === tier.tier;
                return (
                  <GlassCard
                    key={tier.tier}
                    hover
                    className={cn(
                      "flex h-full flex-col p-6",
                      active && "ring-1 ring-accent/35",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight">
                          {tier.label}
                        </h3>
                        <p className="mt-1 text-[0.84rem] leading-snug text-fg-muted">
                          {tier.blurb}
                        </p>
                      </div>
                      {active && (
                        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-accent">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="mt-6">
                      <p className="text-3xl font-semibold tracking-tight text-gradient">
                        {tier.priceLabel}
                      </p>
                      <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-fg-subtle">
                        {tier.generationCap}
                      </p>
                    </div>

                    <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-line pt-5">
                      {[
                        "Global checkout and tax handled by Lemon Squeezy",
                        "Paper and quiz generation credits included",
                        "Cancel or upgrade from the billing portal later",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-[0.84rem] text-fg-muted"
                        >
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      <CheckoutButton tier={tier.tier}>
                        {active ? "Open checkout again" : `Subscribe to ${tier.label}`}
                      </CheckoutButton>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
