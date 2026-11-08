import { expect, runAxeScan, test } from "../fixtures/test";
import { seedSession } from "../fixtures/api-mocks";

test.describe("Accessibility (WCAG 2.1 AA)", () => {
  for (const path of ["/login", "/privacy", "/404"]) {
    test(`public route ${path} has zero axe violations`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1, h2").first()).toBeVisible();
      const results = await runAxeScan(page);
      expect(
        results.violations,
        `Accessibility violations on ${path}: ${JSON.stringify(results.violations, null, 2)}`,
      ).toEqual([]);
    });
  }

  test("PM /dashboard (list & card views) has zero axe violations", async ({
    page,
  }) => {
    await seedSession(page, "pm", "e2e-pm-token");
    await page.goto("/dashboard");
    await expect(page.locator("tbody tr")).toHaveCount(10);

    const listResults = await runAxeScan(page);
    expect(
      listResults.violations,
      `Dashboard List view violations: ${JSON.stringify(listResults.violations, null, 2)}`,
    ).toEqual([]);

    await page.getByRole("tab", { name: "Card" }).click();
    await expect(page.getByText("Alice Moreau")).toBeVisible();

    const cardResults = await runAxeScan(page);
    expect(
      cardResults.violations,
      `Dashboard Card view violations: ${JSON.stringify(cardResults.violations, null, 2)}`,
    ).toEqual([]);
  });

  test("Linguist /settings has zero axe violations", async ({ page }) => {
    await seedSession(page, "linguist", "e2e-linguist-token");
    await page.goto("/settings");
    await expect(page.getByText("Primary Calendar")).toBeVisible();

    const results = await runAxeScan(page);
    expect(
      results.violations,
      `Settings violations: ${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });
});
