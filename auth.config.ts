import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";

const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const expiresAt = auth?.expiresAt;
      const expired = typeof expiresAt === "number" && expiresAt < Date.now();

      if (auth?.user && !expired) {
        return true;
      }

      const loginUrl = new URL("/login", request.nextUrl);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    },
    session({ session, token }) {
      if (typeof token.expiresAt === "number") {
        session.expiresAt = token.expiresAt;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
