import { describe, expect, it } from "vitest";

import { isUuid, normalizeUuid } from "@/lib/ids";

describe("isUuid", () => {
  it("accepts valid RFC 4122 UUIDs", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects arbitrary strings before they reach uuid DB columns", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("550e8400-e29b-91d4-a716-446655440000")).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});

describe("normalizeUuid", () => {
  it("trims valid UUID strings", () => {
    expect(normalizeUuid(" 550e8400-e29b-41d4-a716-446655440000 ")).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("returns null for invalid values", () => {
    expect(normalizeUuid("paper-1")).toBeNull();
    expect(normalizeUuid(undefined)).toBeNull();
  });
});
