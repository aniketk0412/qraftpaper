import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { quizzes } from "@/lib/db/schema";

export const runtime = "nodejs";

export default async function QuizIndexPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [latestQuiz] = await getDb()
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(eq(quizzes.userId, session.user.id))
    .orderBy(desc(quizzes.createdAt))
    .limit(1);

  if (!latestQuiz) {
    redirect("/dashboard");
  }

  redirect(`/quiz/${latestQuiz.id}`);
}
