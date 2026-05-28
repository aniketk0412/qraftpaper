import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config tuned for QraftPaper's smoke suite.
 *
 * - Tests live under `e2e/` so they never collide with the Vitest unit suite.
 * - Runs against `BASE_URL` if set (CI / preview deploy), otherwise spins up
 *   `npm run dev` and points at localhost.
 * - One browser (Chromium) for now — enough to catch real regressions in the
 *   critical signup → generate flow without 3x'ing CI time.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
