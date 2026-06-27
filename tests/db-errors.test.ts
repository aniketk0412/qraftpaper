import { describe, expect, it } from "vitest";

import { isUniqueViolation } from "@/lib/db/errors";

describe("isUniqueViolation", () => {
  it("is true only for SQLSTATE 23505", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation(Object.assign(new Error("dup"), { code: "23505" }))).toBe(
      true,
    );
  });

  it("is false for other codes and non-DB errors", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false); // FK violation
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUniqueViolation("nope")).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
  });
});
