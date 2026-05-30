// Global vitest setup — runs once before any test file imports.
//
// Today's only job: silence console.error during tests so the output stays
// readable. Several lib/ helpers intentionally log via console.error on
// recoverable failure paths (the auth flow, the streak insert, the quiz
// completion analytics) — those are correct in production but turn the
// test transcript into a wall of red text. We swap console.error for a
// no-op for the duration of the test process; individual tests that need
// to assert on log calls can spy on it inline with vi.spyOn().
//
// We deliberately do NOT silence console.warn — warnings can flag real
// issues like a deprecated API or a stale env var, and they're rare
// enough that letting them through stays useful.

import { vi } from "vitest";

vi.spyOn(console, "error").mockImplementation(() => {});
