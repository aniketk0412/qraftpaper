import { describe, expect, it } from "vitest";

import { examplePaper, exampleQuiz } from "@/lib/demo-data";
import {
  pdfSafe,
  renderPaperPdf,
  renderQuizPdf,
} from "@/lib/export/render";

describe("pdfSafe", () => {
  it("maps subscript digits (which Liberation Sans lacks) to ASCII", () => {
    expect(pdfSafe("x₁ + x₂")).toBe("x1 + x2");
    expect(pdfSafe("H₂O and CO₂")).toBe("H2O and CO2");
    expect(pdfSafe("₀₃₄₅₆₇₈₉")).toBe("03456789");
  });

  it("leaves covered glyphs untouched (superscripts, Greek, math, quotes)", () => {
    const s = "θ(n²) ≤ ∑ √ π → “q” — done";
    expect(pdfSafe(s)).toBe(s);
  });

  it("is a no-op for plain ASCII", () => {
    expect(pdfSafe("Q1. Solve for x.")).toBe("Q1. Solve for x.");
  });
});

describe("PDF rendering smoke", () => {
  it("renders a paper to a non-empty PDF buffer", async () => {
    const buf = await renderPaperPdf(examplePaper);
    expect(buf.length).toBeGreaterThan(1000);
    // Every PDF starts with the %PDF- magic header.
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renders a quiz to a non-empty PDF buffer", async () => {
    const buf = await renderQuizPdf(exampleQuiz);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
