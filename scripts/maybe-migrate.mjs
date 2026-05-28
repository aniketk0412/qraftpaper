#!/usr/bin/env node
/**
 * Runs `drizzle-kit migrate` before `next build` for **production deploys
 * only**:
 *  - Vercel production builds (VERCEL_ENV === "production") apply pending
 *    migrations before shipping the new app code.
 *  - Vercel preview builds (preview branches) deliberately skip migration —
 *    a feature-branch deploy must NOT push a schema change to prod.
 *  - CI runs (GitHub Actions) skip — they run lint / test, not full builds.
 *  - Local builds without DATABASE_URL skip and continue.
 *  - Local builds with DATABASE_URL DO migrate (matches Vercel prod
 *    behaviour, so you can rehearse the build locally).
 *
 * Migration failures are intentionally fatal — shipping app code against a
 * stale schema is worse than failing the deploy.
 */

import { spawnSync } from "node:child_process";

const vercelEnv = process.env.VERCEL_ENV;
const isVercel = Boolean(process.env.VERCEL);
const isCi = Boolean(process.env.CI) && !isVercel;

if (isCi) {
  console.log("[build] CI run — skipping drizzle-kit migrate.");
  process.exit(0);
}

if (isVercel && vercelEnv !== "production") {
  console.log(
    `[build] Vercel ${vercelEnv ?? "non-production"} deploy — skipping migrate to keep prod DB safe.`,
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.log("[build] DATABASE_URL not set — skipping drizzle-kit migrate.");
  process.exit(0);
}

console.log("[build] Running drizzle-kit migrate…");
const result = spawnSync("npx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  console.error("[build] drizzle-kit migrate failed — aborting build");
  process.exit(result.status ?? 1);
}
