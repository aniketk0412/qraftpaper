import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { CheckCircle2, CreditCard, GraduationCap, Lock, LogOut, Receipt } from "lucide-react";
import { auth, signOut } from "@/auth";
import { EducationPicker } from "@/components/auth/education-picker";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";
import { BackLink } from "@/components/dashboard/back-link";
import { ConfirmSaveButton } from "@/components/dashboard/confirm-save-button";
import { DeleteAccountDialog } from "@/components/dashboard/delete-account-dialog";
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
import type { ReactNode } from "react";
import {
  deleteAccountAction,
  updateEducationAction,
  updateProfileAction,
} from "./actions";

export const runtime = "nodejs";

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
  const cancelled = subscription?.status === "cancelled";

  const gradeLabel = describeGrade(
    profile?.educationLevel,
    profile?.educationGrade,
  );
  const gradeUpdatedAt = profile?.educationGradeUpdatedAt ?? null;
  const canEditGrade = canChangeGrade(gradeUpdatedAt);
  const nextChangeDate =
    !canEditGrade && gradeUpdatedAt ? nextGradeChangeAt(gradeUpdatedAt) : null;

  const billingStatus = hasActivePlan
    ? cancelled && endsAt
      ? `ACCESS UNTIL ${stampDate(endsAt)}`
      : renewsAt
        ? `RENEWS ${stampDate(renewsAt)}`
        : "ACTIVE"
    : "UNSUBSCRIBED";

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink label="Back to workspace" />

      {/* Registration-document header. */}
      <Reveal>
        <div className="border-b border-line pb-6">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-fg-subtle">
            Account · Registration record
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Account settings
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            Manage your profile, level, plan and account — laid out as a single
            administrative record.
          </p>
        </div>
      </Reveal>

      {/* SECTION 01 — PROFILE */}
      <Section index="01" title="Profile" note="Shown on your dashboard and shared quizzes.">
        {saved === "profile" && <SavedNote>Profile updated.</SavedNote>}
        {error === "missing-fields" && (
          <ErrorNote>Name and institution are both required.</ErrorNote>
        )}
        <form action={updateProfileAction}>
          <LedgerField
            refLabel="Full name"
            name="name"
            defaultValue={profile?.name ?? ""}
            placeholder="Dr. Anita Rao"
            required
          />
          <LedgerField
            refLabel="Institution"
            name="institution"
            defaultValue={profile?.institution ?? ""}
            placeholder="Meridian University"
            required
          />
          <LedgerReadonly
            refLabel="Work email"
            value={profile?.email ?? "—"}
            note="Account identity · fixed"
          />
          <div className="pt-6">
            <GlowButton type="submit" variant="ink" size="md">
              Save changes
            </GlowButton>
          </div>
        </form>
      </Section>

      {/* SECTION 02 — ACADEMIC LEVEL */}
      <Section
        index="02"
        title="Academic level"
        note="Tailors your dashboard sample and recommendations. Changeable once every 6 months."
      >
        <div className="mb-4 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-violet-bright">
          <GraduationCap className="h-3.5 w-3.5" />
          {gradeLabel ?? "Not set"}
        </div>

        {saved === "grade" && <SavedNote>Level updated.</SavedNote>}
        {error === "invalid-grade" && (
          <ErrorNote>Pick a valid level and class/department.</ErrorNote>
        )}
        {error === "grade-locked" && (
          <ErrorNote tone="gold">
            You changed your level recently. You can change it again
            {nextChangeDate ? ` on ${stampDate(nextChangeDate)}` : " later"}.
          </ErrorNote>
        )}

        {canEditGrade ? (
          <form action={updateEducationAction} className="flex flex-col gap-4">
            <div className="flex items-start gap-2.5 border border-gold/30 bg-gold/[0.06] px-4 py-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <p className="text-[0.82rem] leading-relaxed text-fg">
                Heads up — once you save, your level is{" "}
                <span className="font-medium">locked for 6 months</span>. Pick
                the one you&apos;ll actually be studying.
              </p>
            </div>
            <EducationPicker
              defaultLevel={(profile?.educationLevel ?? "") as EducationLevel | ""}
              defaultGrade={profile?.educationGrade ?? ""}
              hideNote
            />
            <ConfirmSaveButton
              message="Your level can only be changed once every 6 months. Save this choice now?"
              className="self-start"
            >
              Save level
            </ConfirmSaveButton>
          </form>
        ) : (
          <div className="flex items-start gap-2.5 rounded-none border border-line bg-card-hi px-4 py-3.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
            <p className="text-[0.82rem] leading-relaxed text-fg-muted">
              Your level is locked until{" "}
              <span className="font-medium text-fg">
                {stampDate(nextChangeDate)}
              </span>
              . This keeps papers and samples consistent with what you study.
            </p>
          </div>
        )}
      </Section>

      {/* SECTION 03 — PLAN & BILLING */}
      <Section index="03" title="Plan & billing">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg-muted">
          [ PLAN: {planName} {"//"} {billingStatus} ]
        </p>
        <div className="mt-4">
          <GlowButton
            href="/billing"
            variant={hasActivePlan ? "secondary" : "ink"}
            size="md"
          >
            <CreditCard className="h-4 w-4" />
            {hasActivePlan ? "Manage billing" : "Subscribe"}
          </GlowButton>
        </div>

        <div className="mt-7 border-t border-line pt-6">
          <p className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-fg-subtle">
            <Receipt className="h-3.5 w-3.5" />
            Billing history
          </p>
          <div className="mt-4">
            <BillingHistory items={history} />
          </div>
        </div>
      </Section>

      {/* SECTION 04 — ACCOUNT */}
      <Section index="04" title="Account">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.84rem] text-fg-muted">Sign out of this device.</p>
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
        </div>

        <div className="mt-7 border-t border-gold/25 pt-6">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-gold">
            [ Danger zone // irreversible ]
          </p>
          <p className="mt-2 max-w-xl text-[0.84rem] leading-relaxed text-fg-muted">
            Permanently delete your account and everything in it. We do not keep
            a copy — there is no undo.
          </p>
          <div className="mt-4">
            <DeleteAccountDialog
              action={deleteAccountAction}
              showConfirmError={error === "delete-confirm"}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}

/**
 * A flat administrative section — no card, just a mono index header and content
 * laid on the page, closed by a continuous hairline divider.
 */
function Section({
  index,
  title,
  note,
  children,
}: {
  index: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <section className="border-b border-line py-8">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-fg-subtle">
          [ Section {index} {"//"} {title} ]
        </p>
        {note && (
          <p className="mt-1.5 max-w-xl text-[0.84rem] leading-relaxed text-fg-muted">
            {note}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </section>
    </Reveal>
  );
}

/**
 * Two-column ledger field: a mono [ REF // LABEL ] on the left, a minimalist
 * underline-only input on the right. No pill, no embedded icon.
 */
function LedgerField({
  refLabel,
  name,
  defaultValue,
  placeholder,
  required = false,
}: {
  refLabel: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 border-b border-line py-5 sm:grid-cols-[13rem_1fr] sm:items-center sm:gap-6">
      <label
        htmlFor={name}
        className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-fg-subtle"
      >
        [ REF {"//"} {refLabel} ]
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-none border-b border-line-strong bg-transparent px-0 py-2 text-[0.95rem] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-fg"
      />
    </div>
  );
}

function LedgerReadonly({
  refLabel,
  value,
  note,
}: {
  refLabel: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 border-b border-line py-5 sm:grid-cols-[13rem_1fr] sm:items-center sm:gap-6">
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-fg-subtle">
        [ REF {"//"} {refLabel} ]
      </span>
      <div className="border-b border-line py-2">
        <p className="text-[0.95rem] text-fg-muted">{value}</p>
        {note && (
          <p className="mt-0.5 font-mono text-[0.54rem] uppercase tracking-[0.16em] text-fg-subtle">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

function SavedNote({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-2 border border-accent/30 bg-accent/[0.06] px-4 py-2.5 text-[0.82rem] text-fg">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
      {children}
    </p>
  );
}

function ErrorNote({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold";
}) {
  return (
    <p
      className={cn(
        "mb-5 border px-4 py-2.5 text-[0.82rem]",
        tone === "gold"
          ? "border-gold/30 bg-gold/[0.06] text-fg"
          : "border-line bg-card-hi/50 text-fg-muted",
      )}
    >
      {children}
    </p>
  );
}
