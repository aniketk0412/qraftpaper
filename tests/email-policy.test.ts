import { describe, expect, it } from "vitest";

import { isDisposableEmail, isValidEmailFormat } from "@/lib/email-policy";

describe("isValidEmailFormat", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmailFormat("anya@gmail.com")).toBe(true);
    expect(isValidEmailFormat("a.b+tag@university.edu")).toBe(true);
    expect(isValidEmailFormat("student@parul.ac.in")).toBe(true);
  });

  it("rejects malformed strings", () => {
    expect(isValidEmailFormat("")).toBe(false);
    expect(isValidEmailFormat("notanemail")).toBe(false);
    expect(isValidEmailFormat("missing@tld")).toBe(false);
    expect(isValidEmailFormat("@nolocal.com")).toBe(false);
    expect(isValidEmailFormat("spaces in@email.com")).toBe(false);
    expect(isValidEmailFormat("two@@at.com")).toBe(false);
  });

  it("rejects absurdly long input (over the RFC 254 cap)", () => {
    const huge = `${"a".repeat(250)}@x.com`;
    expect(isValidEmailFormat(huge)).toBe(false);
  });
});

describe("isDisposableEmail", () => {
  it("blocks well-known temporary-inbox providers", () => {
    expect(isDisposableEmail("x@mailinator.com")).toBe(true);
    expect(isDisposableEmail("x@guerrillamail.com")).toBe(true);
    expect(isDisposableEmail("x@10minutemail.com")).toBe(true);
    expect(isDisposableEmail("x@temp-mail.org")).toBe(true);
    expect(isDisposableEmail("x@yopmail.com")).toBe(true);
    expect(isDisposableEmail("x@getnada.com")).toBe(true);
    expect(isDisposableEmail("x@1secmail.com")).toBe(true);
  });

  it("uses the maintained upstream feed, not just the curated extras", () => {
    // guerrillamail.info is in the disposable-email-domains package but NOT in
    // CURATED_EXTRAS — so this passing proves the upstream list is wired in.
    expect(isDisposableEmail("x@guerrillamail.info")).toBe(true);
  });

  it("blocks throwaway subdomains of a listed provider", () => {
    expect(isDisposableEmail("x@inbox.mailinator.com")).toBe(true);
    expect(isDisposableEmail("x@a.b.guerrillamail.com")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isDisposableEmail("X@Mailinator.COM")).toBe(true);
  });

  it("allows real providers and institution domains", () => {
    expect(isDisposableEmail("anya@gmail.com")).toBe(false);
    expect(isDisposableEmail("anya@outlook.com")).toBe(false);
    expect(isDisposableEmail("anya@protonmail.com")).toBe(false);
    expect(isDisposableEmail("student@parul.ac.in")).toBe(false);
    expect(isDisposableEmail("prof@university.edu")).toBe(false);
  });

  it("matches domain suffixes, not substrings or prefixes", () => {
    // "mailinator.com" is a PREFIX here, not a suffix — the reserved .example
    // TLD guarantees this isn't a real listed domain, so it must not match.
    expect(isDisposableEmail("x@mailinator.com.evil.example")).toBe(false);
  });

  it("returns false for strings without a domain", () => {
    expect(isDisposableEmail("nope")).toBe(false);
    expect(isDisposableEmail("")).toBe(false);
  });
});
