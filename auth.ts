import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import authConfig from "./auth.config";
import { getDb } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";

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
      },
      async authorize(credentials, request) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const db = getDb();
        const ipAddress = getClientIp(request);
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
