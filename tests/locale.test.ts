import { describe, expect, it } from "vitest";

import { isIndiaLocale } from "@/lib/locale";

describe("isIndiaLocale", () => {
  it("detects India from the Asia/Kolkata timezone", () => {
    expect(isIndiaLocale("Asia/Kolkata", [])).toBe(true);
  });

  it("detects India from the legacy Asia/Calcutta alias", () => {
    expect(isIndiaLocale("Asia/Calcutta", [])).toBe(true);
  });

  it("is case-insensitive on the timezone", () => {
    expect(isIndiaLocale("asia/kolkata", undefined)).toBe(true);
  });

  it("detects India from an -IN language tag", () => {
    expect(isIndiaLocale("America/New_York", ["en-IN"])).toBe(true);
    expect(isIndiaLocale(undefined, ["hi-IN", "en-US"])).toBe(true);
  });

  it("matches the region subtag regardless of case", () => {
    expect(isIndiaLocale(undefined, ["ta-in"])).toBe(true);
  });

  it("returns false for a non-India timezone + language", () => {
    expect(isIndiaLocale("America/Los_Angeles", ["en-US"])).toBe(false);
    expect(isIndiaLocale("Europe/London", ["en-GB", "fr-FR"])).toBe(false);
  });

  it("does not false-positive on languages that merely contain 'in'", () => {
    // "fin" (Finnish-ish) or a base "en" must not match — only the region
    // subtag after the last hyphen counts.
    expect(isIndiaLocale("Europe/Helsinki", ["fi", "en"])).toBe(false);
  });

  it("returns false when both signals are missing", () => {
    expect(isIndiaLocale(undefined, undefined)).toBe(false);
    expect(isIndiaLocale("", [])).toBe(false);
  });
});
