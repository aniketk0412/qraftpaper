import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Building2, CheckCircle2, CreditCard, LogOut, Mail, Trash2, User } from "lucide-react";
import { auth, signOut } from "@/auth";
import { AuthField } from "@/components/auth/auth-field";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";
import { BackLink } from "@/components/dashboard/back-link";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PLANS, type PlanId } from "@/lib/plans";
import { deleteAccountAction, updateProfileAction } from "./actions";

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
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />
      <Reveal>
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
            Workspace settings
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
            This name and institution appear across your workspace.
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
        <GlassCard className="mt-3 flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Plan</h2>
            <p className="mt-1 text-[0.84rem] text-fg-muted">
              You are on the{" "}
              <span className="font-medium text-fg">
                {PLANS[(profile?.plan ?? "unpaid") as PlanId]?.name ?? "Unpaid"}
              </span>{" "}
              plan.
            </p>
          </div>
          <GlowButton href="/billing" variant="secondary" size="md">
            <CreditCard className="h-4 w-4" />
            Manage billing
          </GlowButton>
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
