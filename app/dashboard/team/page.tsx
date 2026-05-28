import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Crown, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal } from "@/components/ui/reveal";
import { BackLink } from "@/components/dashboard/back-link";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [me] = await getDb()
    .select({
      name: users.name,
      email: users.email,
      institution: users.institution,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const displayName = me?.name ?? "You";
  const initials = (me?.name ?? me?.email ?? "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink />
      <Reveal>
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
            Team
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
            {me?.institution ?? "Your workspace"}
          </h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            Members currently connected to this workspace.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <GlassCard className="mt-8 p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight">Members</h2>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-tint/[0.02] p-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card-hi font-mono text-xs font-medium text-fg ring-1 ring-line">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-[0.76rem] text-fg-subtle">
                {me?.email}
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-accent-soft">
              <Crown className="h-3 w-3" />
              Owner
            </span>
          </div>
        </GlassCard>
      </Reveal>

      <Reveal>
        <GlassCard className="mt-3 p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-tint/[0.04] text-fg-muted ring-1 ring-line">
              <UserRound className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Workspace access
              </h2>
              <p className="mt-1 text-[0.84rem] leading-relaxed text-fg-muted">
                Add faculty from account support after your billing plan is
                active. This page only shows members that already have access.
              </p>
            </div>
          </div>
        </GlassCard>
      </Reveal>
    </div>
  );
}
