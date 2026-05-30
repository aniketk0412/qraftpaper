import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DrillClient } from "./drill-client";

export const metadata: Metadata = {
  title: "Drill your mistakes — QraftPaper",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";

/**
 * Focused practice over the questions the user has gotten wrong. The
 * backlog lives in localStorage (see lib/quiz-history), so the actual quiz
 * reconstruction + runner live in the client component. This server
 * component exists only to gate on auth — drilling is a paid-account
 * feature surface, same as the rest of the dashboard.
 */
export default async function DrillPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return <DrillClient />;
}
