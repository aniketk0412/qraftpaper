"use server";

import bcrypt from "bcryptjs";
import { and, eq, gte, sql } from "drizzle-orm";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
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

async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string | null,
) {
  if (!token) return false;
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
          ...(ip ? { remoteip: ip } : {}),
        }),
      },
    );
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function loginAction(formData: FormData) {
  const email = getRequiredString(formData, "email").toLowerCase();
  const password = getRequiredString(formData, "password");
  const remember = formData.get("remember") != null;

  if (!email || !password) {
    redirect("/login?error=missing-fields");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      remember: String(remember),
      redirect: false,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid-credentials");
    }

    throw error;
  }

  redirect("/dashboard");
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

  // Lightweight per-IP throttle to slow scripted mass sign-ups. (A captcha or
  // email verification is the real fix — this is a first-layer speed bump.)
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    null;

  if (ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [recent] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "signup_created_workspace"),
          eq(auditLogs.ipAddress, ip),
          gte(auditLogs.createdAt, since),
        ),
      );

    if ((recent?.n ?? 0) >= 10) {
      redirect("/signup?error=too-many");
    }
  }

  // Bot check — only enforced when Turnstile is configured.
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    const token = getRequiredString(formData, "cf-turnstile-response");
    if (!(await verifyTurnstile(turnstileSecret, token, ip))) {
      redirect("/signup?error=captcha");
    }
  }

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
        ipAddress: ip,
      });
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      remember: "true",
      redirect: false,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=signin-after-signup");
    }

    throw error;
  }

  redirect("/dashboard");
}
