import {
  CheckCircle2,
  Flame,
  Layers,
  Lock,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { billingTiers } from "@/lib/billing/lemonsqueezy";
import { PLANS, type PlanId } from "@/lib/plans";
import { getDb } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
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

const BENEFITS = [
  {
    icon: Sparkles,
    title: "20 papers + quizzes a month",
    body: "Generate as much as you need until exam day. Most students burn through 8–12 in the week before a paper.",
  },
  {
    icon: Layers,
    title: "Up to 5 subjects",
    body: "Add every paper this semester. Each subject keeps its own syllabus, PYQ pattern and blueprint.",
  },
  {
    icon: Flame,
    title: "Daily streak + topic mastery",
    body: "Practise every day to keep your streak alive. See which units you're solid on and which need more reps.",
  },
  {
    icon: Send,
    title: "Shareable quiz links",
    body: "Send the exact same MCQ test to your friends with one link. Compare scores in the group chat.",
  },
  {
    icon: RotateCcw,
    title: "Cancel anytime",
    body: "One click from this page. Keep all your generated papers even after cancelling.",
  },
  {
    icon: ShieldCheck,
    title: "Lemon Squeezy at checkout",
    body: "Payments handled by Lemon Squeezy (Merchant of Record). VAT/GST, international cards and local currency all just work.",
  },
];

const tier = billingTiers.educator;

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
  const [profile] = session?.user?.id
    ? await getDb()
        .select({
          name: users.name,
          email: users.email,
          institution: users.institution,
          plan: users.plan,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)
    : [];
  const { checkout } = await searchParams;
  const checkoutStatus = Array.isArray(checkout) ? checkout[0] : checkout;
  const currentPlan = profile?.plan ?? session?.user?.plan ?? "unpaid";
  const currentPlanLabel = PLANS[currentPlan as PlanId]?.name ?? "Unpaid";
  const isSubscribed = currentPlan !== "unpaid";
  const user = {
    name: profile?.name ?? session?.user?.name ?? null,
    email: profile?.email ?? session?.user?.email ?? "",
    institution: profile?.institution ?? session?.user?.institution ?? null,
    initials: deriveInitials(
      profile?.name ?? session?.user?.name,
      profile?.email ?? session?.user?.email,
    ),
  };

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar plan={currentPlan} />
      <Topbar subjects={subjects} user={user} plan={currentPlan} />
      <main className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          {/* HERO ----------------------------------------------------------- */}
          <div className="text-center">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
              {isSubscribed ? "Your subscription" : "Pricing"}
            </p>
            <h1 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-tight text-gradient sm:text-5xl">
              {isSubscribed
                ? `You're on ${currentPlanLabel}. Keep practising.`
                : "One plan. Cheaper than a single tutoring class."}
            </h1>
            {!isSubscribed && (
              <p className="mx-auto mt-4 max-w-lg text-[0.95rem] leading-relaxed text-fg-muted">
                Generate up to 20 mock papers and quizzes a month from your own
                syllabus. Cancel any time from this page — keep all your
                generated content forever.
              </p>
            )}
          </div>

          {/* SUCCESS BANNER -------------------------------------------------- */}
          {checkoutStatus === "success" && (
            <GlassCard className="mt-8 flex items-start gap-3 p-4 ring-1 ring-accent/35">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium">Checkout completed</p>
                <p className="mt-0.5 text-[0.82rem] text-fg-muted">
                  Your plan updates the moment LemonSqueezy confirms the
                  subscription. Refresh in a few seconds if it has not changed
                  yet.
                </p>
              </div>
            </GlassCard>
          )}

          {/* PRICING CARD --------------------------------------------------- */}
          <div className="mx-auto mt-10 max-w-md">
            <div className="relative overflow-hidden rounded-3xl glass-strong p-8 ring-1 ring-violet/35">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-violet/18 blur-[80px]" />
              <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet/40 to-transparent" />

              <div className="relative flex items-baseline justify-between">
                <div>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-violet-bright">
                    Solo plan
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    For one student
                  </h2>
                </div>
                {isSubscribed && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-accent">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>

              <div className="relative mt-6 flex items-baseline gap-1.5">
                <span className="text-5xl font-semibold tracking-tight text-gradient">
                  {tier.price}
                </span>
                <span className="text-sm text-fg-subtle">{tier.period}</span>
              </div>
              <p className="relative mt-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-fg-subtle">
                {tier.generationCap}
              </p>

              <div className="relative mt-6">
                <CheckoutButton tier={tier.tier}>
                  {isSubscribed
                    ? "Manage subscription"
                    : "Subscribe and start practising"}
                </CheckoutButton>
              </div>

              <p className="relative mt-3 text-center text-[0.7rem] text-fg-subtle">
                Secure checkout via LemonSqueezy · Cancel anytime
              </p>
            </div>
          </div>

          {/* BENEFITS GRID -------------------------------------------------- */}
          <div className="mt-14">
            <p className="text-center font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
              What you get
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl border border-line bg-tint/[0.02] p-5"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-tint/[0.04] text-violet-bright ring-1 ring-line">
                    <b.icon className="h-[18px] w-[18px]" />
                  </span>
                  <p className="mt-4 text-[0.92rem] font-medium">{b.title}</p>
                  <p className="mt-1 text-[0.8rem] leading-snug text-fg-muted">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SUBSCRIPTION STATUS -------------------------------------------- */}
          {isSubscribed && subscription && (
            <div className="mt-10 rounded-2xl border border-line bg-tint/[0.02] p-6">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
                Subscription details
              </p>
              <dl className="mt-4 grid gap-3 text-[0.86rem] sm:grid-cols-3">
                <div>
                  <dt className="text-fg-muted">Status</dt>
                  <dd
                    className={cn(
                      "mt-0.5 font-mono capitalize",
                      subscription.status === "active"
                        ? "text-accent"
                        : "text-gold",
                    )}
                  >
                    {subscription.status}
                  </dd>
                </div>
                {subscription.renewsAt && (
                  <div>
                    <dt className="text-fg-muted">Renews</dt>
                    <dd className="mt-0.5 font-mono text-fg">
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(subscription.renewsAt)}
                    </dd>
                  </div>
                )}
                {subscription.endsAt && (
                  <div>
                    <dt className="text-fg-muted">Ends</dt>
                    <dd className="mt-0.5 font-mono text-fg">
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(subscription.endsAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* FAQ ------------------------------------------------------------ */}
          <div className="mt-14 grid gap-3 lg:grid-cols-2">
            <FaqItem
              q="What happens to my papers if I cancel?"
              a="They stay in your account. You can still download them as PDF or Word — you just can't generate new ones until you resubscribe."
            />
            <FaqItem
              q="Are the questions guaranteed correct?"
              a="No. The output is AI-generated and meant for practice. Always check answers against your textbook before assuming they're right."
            />
            <FaqItem
              q="How is billing handled?"
              a="LemonSqueezy is the merchant of record. They handle international cards, VAT/GST and local currency display. Your card details never touch QraftPaper."
            />
            <FaqItem
              q="Can I switch payment methods later?"
              a="Yes — manage your card and download invoices from the LemonSqueezy customer portal linked from your receipt email."
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-line bg-tint/[0.02] p-5">
      <p className="flex items-start gap-2 text-[0.92rem] font-medium">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-bright" />
        {q}
      </p>
      <p className="mt-2 text-[0.82rem] leading-relaxed text-fg-muted">{a}</p>
    </div>
  );
}
