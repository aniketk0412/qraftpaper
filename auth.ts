import bcrypt from "bcryptjs";
import { and, eq, gte, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import authConfig from "./auth.config";
import { getDb } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";

// Per-IP brute-force brake, layered on top of the per-account lockout below.
// Counts only failed logins in a rolling window, so it clears itself as old
// failures age out. The threshold is deliberately generous: this app's users
// (schools/colleges) often share one institutional NAT IP, so a tight cap
// would lock out a whole campus. It's set high enough that normal shared-IP
// fat-fingering won't trip it, but still throttles a password-spray that
// rotates across many accounts from a single host (the per-account cap of 5
// stays the fine-grained control).
const IP_LOGIN_FAIL_WINDOW_MS = 15 * 60 * 1000;
const MAX_IP_LOGIN_FAILURES = 50;

async function tooManyRecentLoginFailuresFromIp(
  db: ReturnType<typeof getDb>,
  ip: string,
): Promise<boolean> {
  const since = new Date(Date.now() - IP_LOGIN_FAIL_WINDOW_MS);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.action, "login_failed"),
        eq(auditLogs.ipAddress, ip),
        gte(auditLogs.createdAt, since),
      ),
    );
  return (row?.n ?? 0) >= MAX_IP_LOGIN_FAILURES;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember", type: "text" },
      },
      async authorize(credentials, request) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";
        const remember = credentials.remember === "true";

        if (!email || !password) {
          return null;
        }

        const db = getDb();
        const ipAddress = getClientIp(request);

        // IP-level brake: stop a distributed spray before spending a bcrypt
        // compare. Checked ahead of the user lookup so it applies even to
        // attempts against non-existent accounts.
        if (ipAddress && (await tooManyRecentLoginFailuresFromIp(db, ipAddress))) {
          await db.insert(auditLogs).values({
            action: "login_blocked_ip",
            entityType: "ip",
            ipAddress,
          });
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) {
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await db.insert(auditLogs).values({
            userId: user.id,
            action: "login_blocked_locked",
            entityType: "user",
            entityId: user.id,
            ipAddress,
          });
          return null;
        }

        if (user.status !== "active") {
          await db.insert(auditLogs).values({
            userId: user.id,
            action: "login_blocked_status",
            entityType: "user",
            entityId: user.id,
            metadata: { status: user.status },
            ipAddress,
          });
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
          const attempts = user.failedLoginAttempts + 1;
          await db
            .update(users)
            .set({
              failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
              lockedUntil:
                attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
            })
            .where(eq(users.id, user.id));
          await db.insert(auditLogs).values({
            userId: user.id,
            action: "login_failed",
            entityType: "user",
            entityId: user.id,
            metadata: { attempts },
            ipAddress,
          });
          return null;
        }

        await db
          .update(users)
          .set({
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
          })
          .where(eq(users.id, user.id));
        await db.insert(auditLogs).values({
          userId: user.id,
          action: "login_succeeded",
          entityType: "user",
          entityId: user.id,
          ipAddress,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          institution: user.institution,
          plan: user.plan,
          role: user.role,
          status: user.status,
          remember,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.plan = user.plan;
        token.institution = user.institution;
        token.role = user.role;
        token.status = user.status;
        const days = user.remember ? 30 : 1;
        token.expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
      }

      // Enforce the remember-me expiry everywhere auth() is consulted — API
      // routes and server actions included. The proxy's `authorized` check
      // only covers its matched page routes, and the NextAuth cookie itself
      // lives for the default 30 days, so without this a "don't keep me
      // signed in" (1-day) session would still be honoured by every API
      // endpoint for the full 30. Returning null invalidates the session.
      if (typeof token.expiresAt === "number" && token.expiresAt < Date.now()) {
        return null;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.plan = token.plan;
        session.user.institution = token.institution;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      if (typeof token.expiresAt === "number") {
        session.expiresAt = token.expiresAt;
      }

      return session;
    },
  },
});

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}
