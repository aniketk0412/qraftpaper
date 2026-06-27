import { describe, expect, it } from "vitest";

import { isAiServiceUnavailable } from "@/lib/ai/errors";

describe("isAiServiceUnavailable", () => {
  it("is true for out-of-credits (402), rate limit (429), and provider 5xx", () => {
    expect(isAiServiceUnavailable({ status: 402 })).toBe(true);
    expect(isAiServiceUnavailable({ status: 429 })).toBe(true);
    expect(isAiServiceUnavailable({ status: 500 })).toBe(true);
    expect(isAiServiceUnavailable({ status: 503 })).toBe(true);
  });

  it("is false for client/input errors and non-API errors", () => {
    expect(isAiServiceUnavailable({ status: 400 })).toBe(false);
    expect(isAiServiceUnavailable({ status: 422 })).toBe(false);
    expect(isAiServiceUnavailable(new Error("validation failed"))).toBe(false);
    expect(isAiServiceUnavailable("nope")).toBe(false);
    expect(isAiServiceUnavailable(null)).toBe(false);
  });
});
