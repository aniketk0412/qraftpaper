import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

export const runtime = "nodejs";
// Health checks are pure liveness — never cache them.
export const dynamic = "force-dynamic";

/**
 * GET /api/health — uptime probe.
 *
 * Returns 200 with a small JSON envelope when the app process is responsive
 * AND the database is reachable. Designed to be hit every 1-5 minutes by
 * external monitors (UptimeRobot, BetterStack, Vercel Crons, internal
 * dashboards). Two intentional design rules:
 *
 *   1. SHALLOW. We don't probe Lemon Squeezy / OpenRouter / Resend here —
 *      those have their own status pages, and surfacing third-party outage
 *      as "QraftPaper is down" would create false alerts. We probe ONLY
 *      what the app itself owns: the Node process + Neon connection.
 *
 *   2. CHEAP. The DB probe is a single `SELECT 1` so it doesn't burn a
 *      connection or skew query metrics. Total cost is ~1ms.
 *
 * Returns 503 (Service Unavailable) when the DB ping fails so monitoring
 * services can alert on a clean HTTP signal rather than parse the JSON.
 */
export async function GET() {
  const startedAt = Date.now();

  let dbOk = false;
  try {
    await getDb().execute(sql`SELECT 1`);
    dbOk = true;
  } catch (error) {
    // We log but don't expose the underlying message — error.message could
    // leak hostname / role info that's useful to attackers fingerprinting
    // the stack.
    console.error("[health] database probe failed", error);
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    checks: {
      db: dbOk,
    },
    durationMs: Date.now() - startedAt,
    // Vercel injects this when deployed; locally it's undefined which is fine —
    // the monitor doesn't depend on it.
    region: process.env.VERCEL_REGION ?? null,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
