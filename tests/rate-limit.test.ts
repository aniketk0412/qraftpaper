import { describe, expect, it } from "vitest";

import { isRateLimited } from "@/lib/rate-limit";

describe("isRateLimited", () => {
  it("allows up to the limit, then blocks within the same window", () => {
    const key = "test-allow-then-block";
    // First `limit` calls are allowed (count 1..5 are all <= 5).
    for (let i = 0; i < 5; i += 1) {
      expect(isRateLimited(key, 5, 60_000)).toBe(false);
    }
    // The 6th call in the window is over the limit.
    expect(isRateLimited(key, 5, 60_000)).toBe(true);
  });

  it("tracks each key independently", () => {
    expect(isRateLimited("key-a", 1, 60_000)).toBe(false);
    expect(isRateLimited("key-b", 1, 60_000)).toBe(false); // fresh key, fresh count
    expect(isRateLimited("key-a", 1, 60_000)).toBe(true); // key-a now over
  });

  it("resets once the window has elapsed", () => {
    const key = "test-window-reset";
    expect(isRateLimited(key, 1, 0)).toBe(false); // windowMs 0 → every call is a new window
    expect(isRateLimited(key, 1, 0)).toBe(false);
  });
});
