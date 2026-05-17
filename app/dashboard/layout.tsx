import type { ReactNode } from "react";
import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { listUserSubjects } from "@/lib/subjects";

export const runtime = "nodejs";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const subjects = session?.user?.id
    ? await listUserSubjects(session.user.id)
    : [];

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar />
      <Topbar subjects={subjects} />
      <main className="px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
