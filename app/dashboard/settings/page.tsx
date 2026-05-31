import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { Building2, CheckCircle2, CreditCard, GraduationCap, Lock, LogOut, Mail, Receipt, Trash2, User } from "lucide-react";
import { auth, signOut } from "@/auth";
import { AuthField } from "@/components/auth/auth-field";
import { EducationPicker } from "@/components/auth/education-picker";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";
import { BackLink } from "@/components/dashboard/back-link";
import {
  BillingHistory,
  type BillingHistoryItem,
} from "@/components/dashboard/billing-history";
import { getDb } from "@/lib/db";
import { billingEvents, subscriptions, users } from "@/lib/db/schema";
import {
  canChangeGrade,
  describeGrade,
  nextGradeChangeAt,
  type EducationLevel,
} from "@/lib/education";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import {
  deleteAccountAction,
  updateEducationAction,
  updateProfileAction,
} from "./actions";

export const runtime = "nodejs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { saved, error } = await searchParams;

  const [profile] = await getDb()
    .select({
      name: users.name,
      email: users.email,
      institution: users.institution,
      plan: users.plan,
      educationLevel: users.educationLevel,
      educationGrade: users.educationGrade,
      educationGradeUpdatedAt: users.educationGradeUpdatedAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  // The user's subscription record (system of record for state), and the raw
  // billing-event ledger for it (proof of what Lemon Squeezy told us). The
  // event query filters by the subscription's Lemon Squeezy id via a jsonb
  // path; wrapped in try/catch so a query hiccup never takes down the whole
  // settings page — billing history is informational, not load-bearing.
  const [subscription] = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  let history: BillingHistoryItem[] = [];
  if (subscription) {
    try {
      history = await getDb()
        .select({
          eventName: billingEvents.eventName,
          createdAt: billingEvents.createdAt,
        })
        .from(billingEvents)
        .where(
          sql`${billingEvents.payload} -> 'data' ->> 'id' = ${subscription.lemonSubscriptionId}`,
        )
        .orderBy(desc(billingEvents.createdAt))
        .limit(20);
    } catch {
      history = [];
    }
  }

  const planId = (profile?.plan ?? "unpaid") as PlanId;
  const planName = PLANS[planId]?.name ?? "Unpaid";
  const hasActivePlan = planId !== "unpaid";
  const renewsAt = subscription?.renewsAt ?? null;
  const endsAt = subscription?.endsAt ?? null;
  const dateFmt = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(d)
      : null;

  // Education level/grade + the 6-month change lock.
  const gradeLabel = describeGrade(
    profile?.educationLevel,
    profile?.educationGrade,
  );
  const gradeUpdatedAt = profile?.educationGradeUpdatedAt ?? null;
  const canEditGrade = canChangeGrade(gradeUpdatedAt);
  const nextChangeDate =
    !canEditGrade && gradeUpdatedAt ? nextGradeChangeAt(gradeUpdatedAt) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />
      <Reveal>
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
            Account settings
          </h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            Manage your profile, plan and account.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <GlassCard className="mt-8 p-7">
          <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
          <p className="mt-1 text-[0.84rem] text-fg-muted">
            This name and institution show on your dashboard and shared quizzes.
          </p>

          {saved === "profile" && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-tint/15 bg-tint/[0.04] px-4 py-3 text-[0.82rem] text-fg">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Profile updated.
            </p>
          )}
          {error === "missing-fields" && (
            <p className="mt-4 rounded-xl border border-line bg-tint/[0.02] px-4 py-3 text-[0.82rem] text-fg-muted">
              Name and institution are both required.
            </p>
          )}

          <form action={updateProfileAction} className="mt-5 flex flex-col gap-4">
            <AuthField
              id="name"
              name="name"
              label="Full name"
              icon={User}
              defaultValue={profile?.name ?? ""}
              placeholder="Dr. Anita Rao"
              required
            />
            <AuthField
              id="institution"
              name="institution"
              label="Institution"
              icon={Building2}
              defaultValue={profile?.institution ?? ""}
              placeholder="Meridian University"
              required
            />
            <AuthField
              id="email"
              label="Work email"
              icon={Mail}
              defaultValue={profile?.email ?? ""}
              disabled
            />
            <GlowButton type="submit" size="md" className="mt-1 self-start">
              Save changes
            </GlowButton>
          </form>
        </GlassCard>
      </Reveal>

      <Reveal>
        <GlassCard className="mt-3 p-7">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight">Your level</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet/10 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-violet-bright ring-1 ring-violet/25">
              <GraduationCap className="h-3 w-3" />
              {gradeLabel ?? "Not set"}
            </span>
          </div>
          <p className="mt-1 text-[0.84rem] text-fg-muted">
            Your dashboard sample and recommendations are tailored to this. It&apos;s
            locked to your account — changeable only once every 6 months.
          </p>

          {saved === "grade" && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-tint/15 bg-tint/[0.04] px-4 py-3 text-[0.82rem] text-fg">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Level updated.
            </p>
          )}
          {error === "invalid-grade" && (
            <p className="mt-4 rounded-xl border border-line bg-tint/[0.02] px-4 py-3 text-[0.82rem] text-fg-muted">
              Pick a valid level and class/department.
            </p>
          )}
          {error === "grade-locked" && (
            <p className="mt-4 rounded-xl border border-gold/30 bg-gold/[0.08] px-4 py-3 text-[0.82rem] text-fg">
              You changed your level recently. You can change it again
              {nextChangeDate ? ` on ${dateFmt(nextChangeDate)}` : " later"}.
            </p>
          )}

          {canEditGrade ? (
            <form
              action={updateEducationAction}
              className="mt-5 flex flex-col gap-4"
            >
              <EducationPicker
                defaultLevel={(profile?.educationLevel ?? "") as EducationLevel | ""}
                defaultGrade={profile?.educationGrade ?? ""}
              />
              <GlowButton type="submit" size="md" className="self-start">
                Save level
              </GlowButton>
            </form>
          ) : (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-tint/[0.02] px-4 py-3.5">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
              <p className="text-[0.82rem] leading-relaxed text-fg-muted">
                Your level is locked until{" "}
                <span className="font-medium text-fg">
                  {dateFmt(nextChangeDate)}
                </span>
                . This keeps papers and samples consistent with what you study.
              </p>
            </div>
          )}
        </GlassCard>
      </Reveal>

      <Reveal>
        <GlassCard
          className={cn(
            "relative mt-3 overflow-hidden p-7",
            hasActivePlan && "ring-1 ring-accent/30",
          )}
        >
          {hasActivePlan && (
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
          )}
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold tracking-tight">
                  Plan &amp; billing
                </h2>
                {/* The headline answer: active or not, with a live pulse dot
                    when it's active so it reads as "on" at a glance. */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] ring-1",
                    hasActivePlan
                      ? "bg-accent/15 text-accent ring-accent/35"
                      : "bg-tint/[0.04] text-fg-subtle ring-line",
                  )}
                >
                  {hasActivePlan ? (
                    <span className="relative grid h-1.5 w-1.5 place-items-center">
                      <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-accent/60" />
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                    </span>
                  ) : null}
                  {hasActivePlan ? "Active" : "No active plan"}
                </span>
              </div>
              <p className="mt-2 text-[0.86rem] text-fg-muted">
                {hasActivePlan ? (
                  <>
                    You&apos;re on the{" "}
                    <span className="font-medium text-fg">{planName}</span>{" "}
                    plan
                    {subscription?.status === "cancelled" && endsAt
                      ? ` — cancelled, access until ${dateFmt(endsAt)}`
                      : renewsAt
                        ? ` — renews ${dateFmt(renewsAt)}`
                        : "."}
                  </>
                ) : (
                  "You don't have an active subscription. Subscribe to unlock generation."
                )}
              </p>
            </div>
            <GlowButton
              href="/billing"
              variant={hasActivePlan ? "secondary" : "primary"}
              size="md"
              className="shrink-0"
            >
              <CreditCard className="h-4 w-4" />
              {hasActivePlan ? "Manage billing" : "Subscribe"}
            </GlowButton>
          </div>

          {/* Billing history — the receipt/event ledger. */}
          <div className="relative mt-7 border-t border-line pt-6">
            <p className="flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
              <Receipt className="h-3.5 w-3.5" />
              Billing history
            </p>
            <div className="mt-4">
              <BillingHistory items={history} />
            </div>
          </div>
        </GlassCard>
      </Reveal>

      <Reveal>
        <GlassCard className="mt-3 flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Account</h2>
            <p className="mt-1 text-[0.84rem] text-fg-muted">
              Sign out of this device.
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <GlowButton type="submit" variant="secondary" size="md">
              <LogOut className="h-4 w-4" />
              Sign out
            </GlowButton>
          </form>
        </GlassCard>
      </Reveal>

      {/* Danger zone — irreversible operations get a separate visually distinct
          card and a typed confirmation so a stray click can never wipe a
          paying user's account. */}
      <Reveal>
        <GlassCard className="mt-6 border border-gold/25 p-7">
          <h2 className="text-lg font-semibold tracking-tight text-gold">
            Danger zone
          </h2>
          <p className="mt-1 text-[0.84rem] text-fg-muted">
            Deleting your account permanently removes every subject, paper,
            quiz and attempt history. We do not keep a copy. There is no undo.
          </p>
          {error === "delete-confirm" && (
            <p className="mt-3 rounded-xl border border-gold/30 bg-gold/[0.08] px-4 py-3 text-[0.82rem] text-fg">
              Type the word DELETE exactly to confirm.
            </p>
          )}
          <form
            action={deleteAccountAction}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              name="confirmation"
              required
              placeholder='Type "DELETE" to confirm'
              className="h-11 flex-1 rounded-xl border border-line bg-tint/[0.03] px-3.5 text-sm text-fg placeholder:text-fg-subtle transition-all duration-200 focus:border-gold/50 focus:bg-tint/[0.05] focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gold/45 bg-gold/15 px-5 text-[0.86rem] font-medium text-gold transition-colors hover:bg-gold/25"
            >
              <Trash2 className="h-4 w-4" />
              Delete my account
            </button>
          </form>
        </GlassCard>
      </Reveal>
    </div>
  );
}
