import type { ReactNode } from "react";
import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { listUserSubjects } from "@/lib/subjects";
import { getStreakSummary } from "@/lib/streaks";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

function deriveInitials(name?: string | null, email?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email ?? "U").slice(0, 2).toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const subjects = session?.user?.id
    ? await listUserSubjects(session.user.id)
    : [];
  const streak = session?.user?.id
    ? await getStreakSummary(session.user.id)
    : {
        current: 0,
        longest: 0,
        totalDays: 0,
        practisedToday: false,
        daysSinceLast: null,
      };
  const [profile] = session?.user?.id
    ? await getDb()
        .select({
          name: users.name,
          email: users.email,
          institution: users.institution,
          plan: users.plan,
          emailVerifiedAt: users.emailVerifiedAt,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)
    : [];

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
      <Sidebar plan={profile?.plan ?? "unpaid"} />
      <Topbar
        subjects={subjects}
        user={user}
        plan={profile?.plan ?? "unpaid"}
        streak={streak.current}
        practisedToday={streak.practisedToday}
        daysSinceLast={streak.daysSinceLast}
      />
      <main className="px-5 py-8 sm:px-8">
        {profile && !profile.emailVerifiedAt && <VerifyEmailBanner />}
        {children}
      </main>
    </div>
  );
}
