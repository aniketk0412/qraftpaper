"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  organizationMembers,
  organizations,
  users,
} from "@/lib/db/schema";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(formData: FormData) {
  const email = getRequiredString(formData, "email").toLowerCase();
  const password = getRequiredString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=missing-fields");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid-credentials");
    }

    throw error;
  }
}

export async function signupAction(formData: FormData) {
  const name = getRequiredString(formData, "name");
  const email = getRequiredString(formData, "email").toLowerCase();
  const institution = getRequiredString(formData, "institution");
  const password = getRequiredString(formData, "password");

  if (!name || !email || !institution || password.length < 8) {
    redirect("/signup?error=invalid-fields");
  }

  const db = getDb();
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    redirect("/signup?error=email-exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      institution,
      passwordHash,
      plan: "unpaid",
      role: "owner",
      status: "active",
    })
    .returning();

  if (user) {
    const [organization] = await db
      .insert(organizations)
      .values({
        name: institution,
        plan: user.plan,
      })
      .returning();

    if (organization) {
      await db.insert(organizationMembers).values({
        organizationId: organization.id,
        userId: user.id,
        role: "owner",
      });
      await db.insert(auditLogs).values({
        userId: user.id,
        organizationId: organization.id,
        action: "signup_created_workspace",
        entityType: "organization",
        entityId: organization.id,
      });
    }
  }

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}
