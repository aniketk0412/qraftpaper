import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Thrown when a generation endpoint is called by a user who hasn't yet
 * verified their email. Routes catch this and return 403 with a stable
 * error string — the client uses it to keep the verification banner
 * relevant after a failed attempt.
 */
export class EmailNotVerifiedError extends Error {
  constructor() {
    super("Verify your email before generating papers or quizzes.");
    this.name = "EmailNotVerifiedError";
  }
}

/**
 * Looks up the user's verified status. Throws EmailNotVerifiedError if the
 * user has never confirmed their email. Generation routes call this BEFORE
 * any AI work happens, so an unverified spammer can't burn OpenRouter
 * credits with a stolen session cookie.
 */
export async function assertEmailVerified(userId: string): Promise<void> {
  const [row] = await getDb()
    .select({ emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row?.emailVerifiedAt) {
    throw new EmailNotVerifiedError();
  }
}
