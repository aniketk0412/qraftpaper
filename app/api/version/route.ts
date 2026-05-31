import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Never cache — the running client polls this to learn whether the live
// deployment is newer than the build it loaded.
export const dynamic = "force-dynamic";

/**
 * GET /api/version — the build id of the currently-deployed server.
 *
 * NEXT_PUBLIC_BUILD_ID is inlined at build time (see next.config.ts), so this
 * returns the same value the client bundle was built with. After a new deploy,
 * a still-open app holds the OLD id while this endpoint (served by the new
 * deployment) returns the NEW one — that mismatch is how the update prompt
 * knows to offer a refresh.
 */
export function GET() {
  const version = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
