import { CheckCircle2, Clock, CreditCard, ExternalLink } from "lucide-react";
import { and, desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { GlowButton } from "@/components/ui/glow-button";
import { billingTiers, getCustomerPortalUrl } from "@/lib/billing/lemonsqueezy";
import { PLANS, type PlanId } from "@/lib/plans";
import { getDb } from "@/lib/db";
import { subscriptions, usage, users } from "@/lib/db/schema";
import { listUserSubjects } from "@/lib/subjects";
import { getStreakSummary } from "@/lib/streaks";
import { currentUsageMonth } from "@/lib/usage";
import { cn } from "@/lib/utils";
import { CheckoutButton } from "./checkout-button";

export const runtime = "nodejs";

const solo = billingTiers.educator;

function deriveInitials(name?: string | null, email?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email ?? "U").slice(0, 2).toUpperCase();
}

/** DD.MM.YYYY — the clinical ledger date stamp. */
function stampDate(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(d)
    .replace(/\//g, ".");
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string | string[] }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const subjects = userId ? await listUserSubjects(userId) : [];
  // Streak is read only to feed the Topbar (the page itself no longer shows it).
  const streak = userId
    ? await getStreakSummary(userId)
    : {
        current: 0,
        longest: 0,
        totalDays: 0,
        practisedToday: false,
        daysSinceLast: null,
      };
  const [subscription] = userId
    ? await getDb()
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)
    : [];
  const [profile] = userId
    ? await getDb()
        .select({
          name: users.name,
          email: users.email,
          institution: users.institution,
          plan: users.plan,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    : [];

  const monthKey = currentUsageMonth();
  const [usageRow] = userId
    ? await getDb()
        .select({ generations: usage.generations })
        .from(usage)
        .where(and(eq(usage.userId, userId), eq(usage.month, monthKey)))
        .limit(1)
    : [];
  const usedThisMonth = usageRow?.generations ?? 0;

  const { checkout } = await searchParams;
  const checkoutStatus = Array.isArray(checkout) ? checkout[0] : checkout;

  const currentPlan = (profile?.plan ?? session?.user?.plan ?? "unpaid") as PlanId;
  const plan = PLANS[currentPlan] ?? PLANS.unpaid;
  const planName = plan?.name ?? "Unpaid";
  const isSubscribed = currentPlan !== "unpaid";
  const isTrial = currentPlan === "trial";

  const portalUrl =
    isSubscribed && subscription?.lemonSubscriptionId
      ? await getCustomerPortalUrl(subscription.lemonSubscriptionId)
      : null;
  const trialPurchasable = Boolean(process.env.LEMONSQUEEZY_VARIANT_TRIAL);

  const generationCap = plan?.generationsPerMonth ?? 0;
  const subjectCap = plan?.maxSubjects ?? 0;
  const renewsAt = subscription?.renewsAt ?? null;
  const endsAt = subscription?.endsAt ?? null;
  const cancelled = subscription?.status === "cancelled";

  // The rate line on the active plan, e.g. "$7.00 / MO".
  const rateLabel = isTrial
    ? `${PLANS.trial.price} ONE-TIME`
    : `${solo.price}.00 ${String(solo.period).replace(/[^a-z]/gi, "").toUpperCase() || "MO"}`;

  const user = {
    name: profile?.name ?? session?.user?.name ?? null,
    email: profile?.email ?? session?.user?.email ?? "",
    institution: profile?.institution ?? session?.user?.institution ?? null,
    initials: deriveInitials(
      profile?.name ?? session?.user?.name,
      profile?.email ?? session?.user?.email,
    ),
  };

  // Show the upgrade ledger to anyone not already on the full Solo plan.
  const showTierOptions = !isSubscribed || isTrial;

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar
        plan={currentPlan}
        subjectCount={subjects.length}
        generationsUsed={usedThisMonth}
        generationsCap={plan?.generationsPerMonth ?? null}
      />
      <Topbar
        subjects={subjects}
        user={user}
        plan={currentPlan}
        streak={streak.current}
        practisedToday={streak.practisedToday}
        daysSinceLast={streak.daysSinceLast}
        generationsUsed={usedThisMonth}
        generationsCap={plan?.generationsPerMonth ?? null}
      />
      <main className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Document header — clinical, no marketing pitch. */}
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-fg-subtle">
            Account · Subscription ledger
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Billing
          </h1>

          {checkoutStatus === "success" && (
            <div className="mt-6 flex items-start gap-3 border border-accent/40 bg-accent/[0.06] px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium">Checkout completed</p>
                <p className="mt-0.5 text-[0.82rem] text-fg-muted">
                  Your plan updates the moment Lemon Squeezy confirms the
                  subscription. Refresh in a few seconds if it hasn&apos;t
                  changed yet.
                </p>
              </div>
            </div>
          )}

          {/* ACCOUNT SUMMARY — two fields split by a structural rule:
              current plan status (left) and the usage quota matrix (right). */}
          <p className="mb-2 mt-9 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-fg-subtle">
            Account summary
          </p>
          <div className="plate-grid grid sm:grid-cols-2">
            {/* Left — current plan status */}
            <div className="flex flex-col p-6">
              <p className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-fg-subtle">
                Current plan
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                {isSubscribed ? `Active plan: ${planName}` : "No active plan"}
              </h2>
              <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg-muted">
                {isSubscribed
                  ? cancelled && endsAt
                    ? `[ ACCESS UNTIL: ${stampDate(endsAt)} // CANCELLED ]`
                    : `[ NEXT RENEWAL: ${stampDate(renewsAt)} // ${rateLabel} ]`
                  : "[ STATUS: UNSUBSCRIBED ]"}
              </p>

              <div className="mt-auto pt-6">
                {isSubscribed && portalUrl ? (
                  <GlowButton
                    href={portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="ink"
                    size="md"
                  >
                    <CreditCard className="h-4 w-4" />
                    Manage subscription
                    <ExternalLink className="h-3.5 w-3.5" />
                  </GlowButton>
                ) : isTrial ? (
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-subtle">
                    Upgrade to Solo below for the full monthly allowance.
                  </p>
                ) : isSubscribed ? (
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-subtle">
                    Manage your card and invoices from your Lemon Squeezy
                    receipt email.
                  </p>
                ) : (
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-subtle">
                    Select a subscription tier below to activate generation.
                  </p>
                )}
              </div>
            </div>

            {/* Right — usage quota matrix */}
            <div className="flex flex-col p-6">
              <p className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-fg-subtle">
                Usage quota · {monthKey}
              </p>
              {isSubscribed ? (
                <div className="mt-4 flex flex-col gap-5">
                  <QuotaGauge
                    label="Generations"
                    sub="papers + quizzes"
                    used={usedThisMonth}
                    cap={generationCap}
                  />
                  <QuotaGauge
                    label="Subjects"
                    sub="active profiles"
                    used={subjects.length}
                    cap={subjectCap}
                  />
                </div>
              ) : (
                <div className="mt-4 flex flex-1 flex-col justify-center">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg-muted">
                    [ QUOTA: LOCKED ]
                  </p>
                  <p className="mt-2 text-[0.82rem] leading-relaxed text-fg-muted">
                    Subscribe to unlock {PLANS.educator.generationsPerMonth}{" "}
                    generations and {PLANS.educator.maxSubjects} subject profiles
                    per month.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SUBSCRIPTION DETAILS — clinical event ledger for active plans. */}
          {isSubscribed && subscription && (
            <>
              <p className="mb-2 mt-10 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-fg-subtle">
                Subscription record
              </p>
              <div className="grid border-y border-line font-mono text-[0.7rem] uppercase tracking-[0.12em] sm:grid-cols-3">
                <DetailField
                  label="Status"
                  value={subscription.status}
                  tone={subscription.status === "active" ? "accent" : "gold"}
                />
                <DetailField
                  label="Renews"
                  value={renewsAt ? stampDate(renewsAt) : "—"}
                  className="border-t border-line sm:border-l sm:border-t-0"
                />
                <DetailField
                  label="Ends"
                  value={endsAt ? stampDate(endsAt) : "—"}
                  className="border-t border-line sm:border-l sm:border-t-0"
                />
              </div>
            </>
          )}

          {/* SUBSCRIPTION TIERS — flat ledger pricing for upgrading users. */}
          {showTierOptions && (
            <>
              <p className="mb-2 mt-10 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-fg-subtle">
                Subscription tiers
              </p>
              <div className="plate-grid grid sm:grid-cols-2">
                {/* 3-Day Pass */}
                <div className="flex flex-col p-6">
                  <p className="font-mono text-[0.54rem] uppercase tracking-[0.2em] text-fg-subtle">
                    [ Trial access tier ]
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    {PLANS.trial.name}
                  </h3>
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
                      {PLANS.trial.price}
                    </span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-subtle">
                      {PLANS.trial.period}
                    </span>
                  </p>
                  <p className="mt-3 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-fg-subtle">
                    {PLANS.trial.generationsPerMonth} generations · 3-day access ·
                    no subscription
                  </p>
                  <div className="mt-auto pt-6">
                    {trialPurchasable ? (
                      <CheckoutButton tier="trial">
                        Start the {PLANS.trial.price} pass
                      </CheckoutButton>
                    ) : (
                      <span className="inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-[3px] border border-line bg-card-hi px-4 py-2.5 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-fg-subtle">
                        <Clock className="h-3.5 w-3.5" />
                        Available soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Solo */}
                <div className="flex flex-col p-6">
                  <p className="font-mono text-[0.54rem] uppercase tracking-[0.2em] text-violet-bright">
                    [ Premium account subscription tier ]
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    {PLANS.educator.name}
                  </h3>
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
                      {solo.price}
                    </span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-subtle">
                      {solo.period}
                    </span>
                  </p>
                  <p className="mt-3 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-fg-subtle">
                    {PLANS.educator.generationsPerMonth} generations ·{" "}
                    {PLANS.educator.maxSubjects} subjects · cancel anytime
                  </p>
                  <div className="mt-auto pt-6">
                    <CheckoutButton tier={solo.tier}>
                      {isTrial ? "Upgrade to Solo" : "Subscribe to Solo"}
                    </CheckoutButton>
                  </div>
                </div>
              </div>
              <p className="mt-3 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-fg-subtle">
                Secure checkout via Lemon Squeezy · 130+ currencies · taxes
                included · cancel anytime
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Flat black-and-white usage gauge — a bordered track with a solid ink fill,
 * square corners, monospace readout. Theme-safe (the ink fill / canvas track
 * invert together in dark mode).
 */
function QuotaGauge({
  label,
  sub,
  used,
  cap,
}: {
  label: string;
  sub: string;
  used: number;
  cap: number;
}) {
  const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  return (
    <div>
      <p className="flex items-baseline justify-between font-mono text-[0.6rem] uppercase tracking-[0.16em]">
        <span className="text-fg">
          [ {label}: {used} / {cap} ]
        </span>
        <span className="text-fg-subtle">{sub}</span>
      </p>
      <div className="mt-2 h-2.5 w-full border border-ink bg-canvas">
        <div className="h-full bg-fg" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  tone,
  className,
}: {
  label: string;
  value: string;
  tone?: "accent" | "gold";
  className?: string;
}) {
  return (
    <div className={cn("px-5 py-4", className)}>
      <p className="text-[0.56rem] tracking-[0.2em] text-fg-subtle">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[0.82rem] normal-case tracking-normal",
          tone === "accent" && "text-accent",
          tone === "gold" && "text-gold",
          !tone && "text-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}
