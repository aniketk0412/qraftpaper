import { describe, expect, it } from "vitest";

import {
  describeBillingEvent,
  humanizeEventName,
} from "@/lib/billing/events";

describe("describeBillingEvent", () => {
  it("maps known subscription events to friendly labels + tones", () => {
    expect(describeBillingEvent("subscription_created")).toEqual({
      label: "Subscription started",
      tone: "accent",
    });
    expect(describeBillingEvent("subscription_payment_success").tone).toBe(
      "accent",
    );
    expect(describeBillingEvent("subscription_cancelled")).toEqual({
      label: "Subscription cancelled",
      tone: "gold",
    });
    expect(describeBillingEvent("subscription_payment_failed").tone).toBe(
      "gold",
    );
    expect(describeBillingEvent("subscription_updated").tone).toBe("violet");
  });

  it("falls back to a humanised label + neutral tone for unmapped events", () => {
    expect(describeBillingEvent("subscription_something_new")).toEqual({
      label: "Subscription something new",
      tone: "neutral",
    });
  });
});

describe("humanizeEventName", () => {
  it("converts snake_case to a sentence", () => {
    expect(humanizeEventName("subscription_payment_success")).toBe(
      "Subscription payment success",
    );
  });

  it("handles hyphens and collapses repeats", () => {
    expect(humanizeEventName("order--refunded")).toBe("Order refunded");
  });

  it("returns a safe default for an empty string", () => {
    expect(humanizeEventName("")).toBe("Billing event");
    expect(humanizeEventName("___")).toBe("Billing event");
  });
});
