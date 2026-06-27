import { redirect } from "next/navigation";

export const runtime = "nodejs";

/**
 * `/dashboard/blueprints` is retired — exam blueprints now live inside "The
 * Drafting Table" (the consolidated subjects workspace at /dashboard/subjects).
 *
 * This is a server-side redirect, so it runs before any render. That makes it
 * session-safe: the visitor's auth cookie is untouched (there is no client
 * state to lose), an authenticated user lands directly on the Drafting Table,
 * and an unauthenticated visitor is carried on to /login by the dashboard's
 * own auth gate at the destination. Existing deep links, the PWA manifest
 * shortcut and the command palette therefore never 404.
 */
export default function BlueprintsRedirect() {
  redirect("/dashboard/subjects");
}
