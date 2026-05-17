import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan: string;
      institution: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    plan: string;
    institution: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    plan: string;
    institution: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    plan: string;
    institution: string | null;
  }
}
