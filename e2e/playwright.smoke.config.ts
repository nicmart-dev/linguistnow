import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/smoke.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [
        ["github"],
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-smoke-report" }],
      ]
    : [["list"]],
  use: {
    baseURL: process.env.SMOKE_FRONTEND_URL || "http://127.0.0.1:3030",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-smoke",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
