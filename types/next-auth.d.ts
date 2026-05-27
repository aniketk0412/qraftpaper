import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan: string;
      institution: string | null;
      role: string;
      status: string;
    } & DefaultSession["user"];
    expiresAt?: number;
  }

  interface User {
    plan: string;
    institution: string | null;
    role: string;
    status: string;
    remember?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    plan: string;
    institution: string | null;
    role: string;
    status: string;
    expiresAt?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    plan: string;
    institution: string | null;
    role: string;
    status: string;
    expiresAt?: number;
  }
}
