import { describe, expect, it } from "vitest";

import { readErrorMessage } from "@/lib/fetch-error";

describe("readErrorMessage", () => {
  it("returns the server's JSON error message when present", async () => {
    const res = new Response(JSON.stringify({ error: "File too large" }), {
      status: 413,
    });
    expect(await readErrorMessage(res, "Upload failed")).toBe("File too large");
  });

  it("falls back with the status on a non-JSON body (the cryptic-error case)", async () => {
    // An uncaught 500 returns HTML/empty — response.json() would throw
    // "Unexpected end of JSON input"; we must degrade gracefully instead.
    const res = new Response("<!doctype html><h1>500</h1>", { status: 500 });
    expect(await readErrorMessage(res, "Upload failed")).toBe(
      "Upload failed (HTTP 500).",
    );
  });

  it("falls back on an empty body", async () => {
    const res = new Response("", { status: 502 });
    expect(await readErrorMessage(res, "Upload failed")).toBe(
      "Upload failed (HTTP 502).",
    );
  });

  it("falls back when the JSON has no usable error field", async () => {
    expect(
      await readErrorMessage(
        new Response(JSON.stringify({ ok: false }), { status: 400 }),
        "Upload failed",
      ),
    ).toBe("Upload failed (HTTP 400).");
    expect(
      await readErrorMessage(
        new Response(JSON.stringify({ error: "" }), { status: 400 }),
        "Upload failed",
      ),
    ).toBe("Upload failed (HTTP 400).");
  });
});
