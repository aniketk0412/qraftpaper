"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function updateProfileAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const name = getString(formData, "name");
  const institution = getString(formData, "institution");

  if (!name || !institution) {
    redirect("/dashboard/settings?error=missing-fields");
  }

  await getDb()
    .update(users)
    .set({ name, institution })
    .where(eq(users.id, session.user.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=profile");
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Account deletion. Destroys the user row, which cascades through every
 * FK-linked table (subjects → documents → papers → quizzes, blueprints,
 * verification tokens; audit logs use `set null` so audit history survives
 * even after the user is gone). Then signs the now-orphaned session out.
 *
 * The form requires the literal string "DELETE" so a stray click doesn't
 * obliterate everything.
 */
export async function deleteAccountAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const confirmation = getString(formData, "confirmation");
  if (confirmation !== "DELETE") {
    redirect("/dashboard/settings?error=delete-confirm");
  }

  await getDb().delete(users).where(eq(users.id, session.user.id));

  // Sign out and send them home. The session cookie is invalid the moment
  // the user row is gone — explicit signOut is friendlier than relying on
  // next-auth's stale-token handling on the next request.
  await signOut({ redirectTo: "/" });
}
