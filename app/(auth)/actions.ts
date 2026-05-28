"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { identifyUser, trackEvent } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  organizationMembers,
  organizations,
  passwordResetTokens,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function getRequestIp() {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    null
  );
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

export async function requestPasswordResetAction(formData: FormData) {
  const email = getRequiredString(formData, "email").toLowerCase();

  if (!email) {
    redirect("/forgot-password?sent=1");
  }

  const db = getDb();
  const ip = await getRequestIp();

  if (ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [recent] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "password_reset_requested"),
          eq(auditLogs.ipAddress, ip),
          gte(auditLogs.createdAt, since),
        ),
      );

    if ((recent?.n ?? 0) >= 8) {
      redirect("/forgot-password?sent=1");
    }
  }

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const emailHash = tokenHash(email);

  await db.insert(auditLogs).values({
    userId: user?.id,
    action: "password_reset_requested",
    entityType: "user",
    entityId: user?.id,
    metadata: { emailHash },
    ipAddress: ip,
  });

  if (user) {
    const token = randomBytes(32).toString("base64url");
    const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    try {
      const result = await sendEmail({
        to: user.email,
        subject: "Reset your QraftPaper password",
        idempotencyKey: `password-reset-${user.id}-${tokenHash(token).slice(0, 16)}`,
        text: `Use this link to reset your QraftPaper password. It expires in 30 minutes.\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1a2332">
            <h1 style="font-size:20px">Reset your QraftPaper password</h1>
            <p>Use the link below to set a new password. It expires in 30 minutes.</p>
            <p><a href="${resetUrl}" style="color:#1f7d7d">Reset password</a></p>
            <p style="font-size:13px;color:#566779">If you did not request this, you can ignore this email.</p>
          </div>
        `,
      });

      if (result.skipped) {
        console.warn("[password-reset] email disabled; reset email not sent");
      }
    } catch (error) {
      console.error("[password-reset] email send failed", error);
    }
  }

  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = getRequiredString(formData, "token");
  const password = getRequiredString(formData, "password");

  if (!token || password.length < 8) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=invalid-fields`);
  }

  const db = getDb();
  const [record] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash(token)),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);

  if (!record || record.expiresAt < new Date()) {
    redirect("/reset-password?error=invalid-token");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(users)
    .set({
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, record.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, record.userId),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  await db.insert(auditLogs).values({
    userId: record.userId,
    action: "password_reset_completed",
    entityType: "user",
    entityId: record.userId,
    ipAddress: await getRequestIp(),
  });

  redirect("/login?reset=success");
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
  const ip = await getRequestIp();

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

  if (user) {
    // Best-effort identification + signup event; analytics must never block
    // a real signup, so wrap and swallow.
    try {
      await identifyUser({
        distinctId: user.id,
        properties: { email, name, institution, plan: "unpaid" },
      });
      await trackEvent({
        distinctId: user.id,
        event: "signup_completed",
        properties: { institution },
      });
    } catch {
      /* swallow */
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
