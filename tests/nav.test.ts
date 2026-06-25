import { describe, expect, it } from "vitest";

import { resolveHref } from "@/lib/nav";

describe("resolveHref", () => {
  it("leaves section anchors bare on the homepage (smooth-scroll preserved)", () => {
    expect(resolveHref("#features", "/")).toBe("#features");
    expect(resolveHref("#pricing", "/")).toBe("#pricing");
    expect(resolveHref("#faq", "/")).toBe("#faq");
  });

  it("routes section anchors to the homepage from any other page", () => {
    expect(resolveHref("#features", "/exam-papers")).toBe("/#features");
    expect(resolveHref("#pricing", "/about")).toBe("/#pricing");
    expect(resolveHref("#faq", "/exam-papers/cs-204-data-structures")).toBe(
      "/#faq",
    );
    expect(resolveHref("#quiz", "/privacy")).toBe("/#quiz");
  });

  it("passes non-anchor hrefs through unchanged on every page", () => {
    expect(resolveHref("/dashboard", "/")).toBe("/dashboard");
    expect(resolveHref("/dashboard", "/exam-papers")).toBe("/dashboard");
    expect(resolveHref("/signup", "/about")).toBe("/signup");
  });
});
