#!/usr/bin/env node
/**
 * Applies pending Drizzle migrations before `next build`, for **production
 * deploys only**:
 *  - Vercel production builds (VERCEL_ENV === "production") apply pending
 *    migrations before shipping the new app code.
 *  - Vercel preview builds (preview branches) deliberately skip migration —
 *    a feature-branch deploy must NOT push a schema change to prod.
 *  - CI runs (GitHub Actions) skip — they run lint / test, not full builds.
 *  - Local builds without DATABASE_URL skip and continue.
 *  - Local builds with DATABASE_URL DO migrate (matches Vercel prod
 *    behaviour, so you can rehearse the build locally).
 *
 * We run the migrator programmatically via `drizzle-orm/neon-http` — the SAME
 * driver `lib/db` uses for queries. `drizzle-kit migrate` defaults to the Neon
 * *serverless* (WebSocket) driver, which can't open a socket from the build
 * process ("can only connect … through a websocket") and aborts the deploy.
 * neon-http migrates over plain HTTP, exactly like the running app's queries.
 *
 * Migration failures are intentionally fatal — shipping app code against a
 * stale schema is worse than failing the deploy.
 */

import { config } from "dotenv";

config({ path: ".env.local" });
config();

const vercelEnv = process.env.VERCEL_ENV;
const isVercel = Boolean(process.env.VERCEL);
const isCi = Boolean(process.env.CI) && !isVercel;

if (isCi) {
  console.log("[build] CI run — skipping migrate.");
  process.exit(0);
}

if (isVercel && vercelEnv !== "production") {
  console.log(
    `[build] Vercel ${vercelEnv ?? "non-production"} deploy — skipping migrate to keep prod DB safe.`,
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.log("[build] DATABASE_URL not set — skipping migrate.");
  process.exit(0);
}

console.log("[build] Applying migrations via neon-http…");

try {
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { migrate } = await import("drizzle-orm/neon-http/migrator");

  const db = drizzle(neon(process.env.DATABASE_URL));
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("[build] Migrations applied.");
} catch (error) {
  console.error("[build] drizzle migrate failed — aborting build");
  console.error(error);
  process.exit(1);
}
