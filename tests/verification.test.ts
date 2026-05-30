import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { hashVerificationToken } from "@/lib/verification";

/**
 * The verification flow stores only the SHA-256 hash of each token, never the
 * raw token — so a database leak can't be replayed as a working verify link.
 * These tests pin that contract: the hash is deterministic (so a presented
 * token can be matched against the stored hash) and is genuinely SHA-256.
 */
describe("hashVerificationToken", () => {
  it("is deterministic for the same token", () => {
    expect(hashVerificationToken("abc123")).toBe(hashVerificationToken("abc123"));
  });

  it("differs for different tokens", () => {
    expect(hashVerificationToken("token-a")).not.toBe(
      hashVerificationToken("token-b"),
    );
  });

  it("matches a known SHA-256 hex digest (not some weaker/identity hash)", () => {
    const token = "hello";
    const expected = createHash("sha256").update(token).digest("hex");
    expect(hashVerificationToken(token)).toBe(expected);
    // SHA-256 hex is always 64 chars; a raw/echoed token would not be.
    expect(hashVerificationToken(token)).toHaveLength(64);
  });

  it("never returns the raw token", () => {
    const token = "super-secret-token";
    expect(hashVerificationToken(token)).not.toContain(token);
  });
});
