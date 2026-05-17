import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar />
      <Topbar />
      <main className="px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
