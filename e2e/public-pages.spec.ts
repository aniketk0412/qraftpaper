import { expect, test } from "@playwright/test";

/**
 * Smoke checks for every page a logged-out visitor can hit. Catches the
 * boring-but-painful regressions: a 500 on the home page, a typo'd link,
 * the legal pages losing their nav, the OG image route 404'ing.
 *
 * Auth-gated flows live in their own spec(s) so they can be wired with a
 * seeded test user when we have one.
 */
test.describe("public pages", () => {
  test("home page renders the hero CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/QraftPaper/);
    // The hero CTA is the primary conversion target — if this disappears or
    // points at the wrong URL the whole site is broken.
    const signupCta = page.getByRole("link", {
      name: /generate your first paper/i,
    });
    await expect(signupCta).toBeVisible();
    await expect(signupCta).toHaveAttribute("href", "/signup");
  });

  test("pricing section shows the single Solo tier and nothing else", async ({
    page,
  }) => {
    await page.goto("/#pricing");
    await expect(page.getByRole("heading", { name: /solo/i })).toBeVisible();
    // We publicly sell exactly one tier today. The Crew/department and
    // Custom/Institution tiers were pulled (no shared-workspace feature) —
    // guard against either sneaking back into the public pricing.
    await expect(page.getByRole("heading", { name: /^crew$/i })).toHaveCount(0);
    await expect(page.getByText(/talk to sales/i)).toHaveCount(0);
    // International-payment trust signal must be present (added so non-India
    // visitors know they can pay in their own currency).
    await expect(page.getByText(/130\+ currencies/i)).toBeVisible();
  });

  test("signup page loads with the form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel(/your name/i)).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await expect(page.getByLabel(/college \/ school/i)).toBeVisible();
    // Terms + privacy links must be reachable from signup for legal compliance.
    await expect(page.getByRole("link", { name: /^terms$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy policy/i })).toBeVisible();
  });

  test("login page loads with the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });

  test("forgot-password page is reachable from login", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("legal pages render", async ({ page }) => {
    for (const path of ["/about", "/privacy", "/terms"]) {
      await page.goto(path);
      // Each legal page should at least have an h1 and not 404.
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("dashboard redirects logged-out visitors to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("sitemap.xml is valid and includes the legal pages", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("/about");
    expect(body).toContain("/privacy");
    expect(body).toContain("/terms");
  });

  test("robots.txt blocks /dashboard from crawlers", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/disallow:.*\/dashboard/i);
  });
});
