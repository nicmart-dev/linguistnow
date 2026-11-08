import { expect, test } from "../fixtures/test";
import { seedSession } from "../fixtures/api-mocks";

test.describe("Routing and authentication", () => {
  test("redirects unauthenticated root to /login and navigates to /privacy", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Great to see you!")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Let's make it easy to work together.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Sign in with Google/i }),
    ).toBeVisible();

    await page
      .locator("footer")
      .getByRole("link", { name: "Privacy Policy" })
      .click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByText("Effective Date: 14 June 2024")).toBeVisible();
  });

  test("guards /dashboard and /settings when unauthenticated and renders 404 page", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/this-route-does-not-exist");
    await expect(
      page.getByRole("heading", { name: "404 | Not Found" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Go Back Home" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/404");
    await expect(
      page.getByRole("heading", { name: "404 | Not Found" }),
    ).toBeVisible();
  });

  test("restores PM session with Bearer header, renders Dashboard nav, and logs out cleanly", async ({
    page,
    apiMocks,
  }) => {
    await seedSession(page, "pm", "e2e-pm-token");
    await page.goto("/");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Hey Morgan Taylor!")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Find an available linguist." }),
    ).toBeVisible();

    expect(apiMocks.seenAuthHeaders).toContain("Bearer e2e-pm-token");

    await expect(
      page.locator("nav#header nav").getByRole("link", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.locator('#header a[href="/settings"]')).toHaveCount(0);

    const logoutLink = page.locator('#header a[href="/logout"]');
    await expect(logoutLink).toBeVisible();
    await logoutLink.click();

    await expect(page).toHaveURL(/\/login$/);
    const storage = await page.evaluate(() => ({
      email: localStorage.getItem("userEmail"),
      token: localStorage.getItem("sessionToken"),
    }));
    expect(storage.email).toBeNull();
    expect(storage.token).toBeNull();
  });

  test("restores Linguist session with Bearer header and redirects / to /settings", async ({
    page,
    apiMocks,
  }) => {
    await seedSession(page, "linguist", "e2e-linguist-token");
    await page.goto("/");

    await expect(page).toHaveURL(/\/settings$/);
    await expect(
      page.getByText(
        "Welcome Alice Moreau! Customize your preferences and availability.",
      ),
    ).toBeVisible();
    expect(apiMocks.seenAuthHeaders).toContain("Bearer e2e-linguist-token");

    await expect(page.locator('#header a[href="/settings"]')).toBeVisible();
    await expect(
      page.locator("nav#header nav").getByRole("link", { name: "Dashboard" }),
    ).toHaveCount(0);
  });

  test.describe("with 401 auth failure", () => {
    test.use({
      mockApiOptions: { authFailureStatus: 401 },
      allowConsoleErrors: true,
    });

    test("clears session storage and redirects to /login on 401 restore error", async ({
      page,
    }) => {
      await seedSession(page, "pm", "expired-pm-token");
      await page.goto("/dashboard");

      await expect(page).toHaveURL(/\/login$/);
      const storage = await page.evaluate(() => ({
        email: localStorage.getItem("userEmail"),
        token: localStorage.getItem("sessionToken"),
      }));
      expect(storage.email).toBeNull();
      expect(storage.token).toBeNull();
    });
  });

  test.describe("with 404 auth failure", () => {
    test.use({
      mockApiOptions: { authFailureStatus: 404 },
      allowConsoleErrors: true,
    });

    test("clears session storage and redirects to /login on 404 restore error", async ({
      page,
    }) => {
      await seedSession(page, "pm", "missing-user-token");
      await page.goto("/dashboard");

      await expect(page).toHaveURL(/\/login$/);
      const storage = await page.evaluate(() => ({
        email: localStorage.getItem("userEmail"),
        token: localStorage.getItem("sessionToken"),
      }));
      expect(storage.email).toBeNull();
      expect(storage.token).toBeNull();
    });
  });
});
