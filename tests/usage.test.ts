import { describe, expect, it } from "vitest";

import {
  RateLimitError,
  reserveGeneration,
  UsageLimitError,
  currentUsageMonth,
} from "@/lib/usage";

describe("currentUsageMonth", () => {
  it("formats as YYYY-MM with a zero-padded month", () => {
    expect(currentUsageMonth(new Date("2026-01-15T12:00:00Z"))).toBe("2026-01");
    expect(currentUsageMonth(new Date("2026-09-01T00:00:00Z"))).toBe("2026-09");
    expect(currentUsageMonth(new Date("2026-12-31T23:00:00Z"))).toBe("2026-12");
  });

  it("buckets by UTC, not local time, so usage never splits across a TZ edge", () => {
    // 2026-02-01 00:30 UTC is still January in UTC-? zones, but the bucket
    // must follow UTC so the same instant maps to one month everywhere.
    expect(currentUsageMonth(new Date("2026-02-01T00:30:00Z"))).toBe("2026-02");
    // An instant late on the last day of a month in UTC stays in that month.
    expect(currentUsageMonth(new Date("2026-06-30T23:59:59Z"))).toBe("2026-06");
  });
});

describe("usage error hierarchy", () => {
  it("RateLimitError is a UsageLimitError so a broad catch covers both", () => {
    const e = new RateLimitError("slow down");
    expect(e).toBeInstanceOf(UsageLimitError);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("RateLimitError");
  });

  it("a plain UsageLimitError is not a RateLimitError", () => {
    const e = new UsageLimitError("cap reached");
    expect(e).toBeInstanceOf(UsageLimitError);
    expect(e).not.toBeInstanceOf(RateLimitError);
    expect(e.name).toBe("UsageLimitError");
  });
});

describe("reserveGeneration", () => {
  it("blocks an unpaid plan (cap 0) before any DB write", async () => {
    // cap === 0 short-circuits to a UsageLimitError before getDb() is touched,
    // so this exercises the gate without a database connection.
    await expect(reserveGeneration("user-1", "unpaid")).rejects.toBeInstanceOf(
      UsageLimitError,
    );
  });
});
