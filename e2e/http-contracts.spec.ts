import { expect, test } from "@playwright/test";

/**
 * HTTP-contract smoke tests — deliberately selector-free. They assert status
 * codes, content types, headers and JSON shape, so they're resilient to
 * markup churn and catch the regressions a unit test can't: a broken OG image
 * route, a dropped security header, a malformed manifest, the health probe
 * changing shape.
 */
test.describe("generated asset routes", () => {
  test("favicon SVG is served", async ({ request }) => {
    const res = await request.get("/icon.svg");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/svg+xml");
    expect(await res.text()).toContain("<svg");
  });

  test("OpenGraph image renders as a PNG", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    // A real 1200x630 card is many KB; a near-empty body means satori broke.
    expect((await res.body()).byteLength).toBeGreaterThan(2000);
  });

  test("Twitter image renders as a PNG", async ({ request }) => {
    const res = await request.get("/twitter-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });

  test("apple-icon renders as a PNG", async ({ request }) => {
    const res = await request.get("/apple-icon");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });

  test("web manifest is valid JSON with the install shortcuts", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    const manifest = JSON.parse(await res.text());
    expect(manifest.name).toMatch(/QraftPaper/);
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    // The three home-screen shortcuts we added — guard against losing them.
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3);
  });
});

test.describe("security headers", () => {
  test("the home page ships the hardened header set", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const h = res.headers();
    expect(h["content-security-policy"]).toBeTruthy();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("private routes carry a noindex robots header", async ({ request }) => {
    // /dashboard redirects to /login for anon users, but the redirect response
    // itself should still be noindexed (it's a private root).
    const res = await request.get("/dashboard", { maxRedirects: 0 });
    expect(res.headers()["x-robots-tag"]).toMatch(/noindex/i);
  });
});

test.describe("health probe", () => {
  test("returns a well-formed liveness envelope", async ({ request }) => {
    const res = await request.get("/api/health");
    // 200 when the DB is reachable, 503 when it isn't — both are valid
    // responses; what matters is the shape stays stable for monitors.
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("checks");
    expect(body.checks).toHaveProperty("db");
    expect(typeof body.timestamp).toBe("string");
  });
});
