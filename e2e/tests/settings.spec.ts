import { expect, test } from "../fixtures/test";
import { seedSession } from "../fixtures/api-mocks";
import { LINGUIST_EMAIL } from "../fixtures/mock-data";

test.describe("Linguist Account Settings", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page, "linguist", "e2e-linguist-token");
  });

  test("manages calendar selection and enforces at-least-one-calendar rule", async ({
    page,
    apiMocks,
  }) => {
    await page.goto("/settings");

    // Wait for initial calendars to finish loading
    await expect(page.getByText("Primary Calendar")).toBeVisible();

    // Removing the last calendar is blocked client-side with an error toast
    await page.locator('[aria-label="Remove Primary Calendar"]').click();
    await expect(
      page.getByText("At least one calendar must be selected"),
    ).toBeVisible();
    expect(apiMocks.updateCalls).toHaveLength(0);

    // Add a second calendar ("Work Schedule") - click near right edge away from badge remove button
    const calendarCombobox = page
      .locator("label", { hasText: /^Choose Calendars$/ })
      .locator("..")
      .getByRole("combobox");
    const calendarBox = await calendarCombobox.boundingBox();
    expect(calendarBox).not.toBeNull();
    await calendarCombobox.click({
      position: {
        x: Math.max(10, (calendarBox?.width ?? 280) - 14),
        y: (calendarBox?.height ?? 40) / 2,
      },
    });
    await page.getByRole("option", { name: "Work Schedule" }).click();

    await expect(page.getByRole("status")).toContainText("Setup complete!");
    await expect.poll(() => apiMocks.updateCalls.length).toBe(1);
    expect(apiMocks.updateCalls[0]).toEqual({
      email: LINGUIST_EMAIL,
      body: {
        calendarIds: ["primary", "work@group.calendar.google.com"],
      },
    });

    // Close popover and remove "Work Schedule"
    await page.keyboard.press("Escape");
    await page.locator('[aria-label="Remove Work Schedule"]').click();
    await expect.poll(() => apiMocks.updateCalls.length).toBe(2);
    expect(apiMocks.updateCalls[1]?.body).toEqual({
      calendarIds: ["primary"],
    });
  });

  test("auto-saves availability preferences (working hours and days off)", async ({
    page,
    apiMocks,
  }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: "Availability Preferences" }),
    ).toBeVisible();

    // Toggle Wednesday checkbox
    await page.getByLabel("Wednesday").check();
    await expect(page.getByText("Days off saved")).toBeVisible();
    await expect
      .poll(() => apiMocks.updateCalls.at(-1)?.body)
      .toMatchObject({
        availabilityPreferences: {
          offDays: [0, 3, 6],
        },
      });

    // Update Working Hours Start to 09:00
    await page.locator("#workingHoursStart").click();
    await page.getByRole("option", { name: "9:00 AM" }).click();
    await expect(page.getByText("Working hours start saved")).toBeVisible();
    await expect
      .poll(() => apiMocks.updateCalls.at(-1)?.body)
      .toMatchObject({
        availabilityPreferences: {
          workingHoursStart: "09:00",
        },
      });
  });

  test("auto-saves linguist profile rate and languages after 1s debounce", async ({
    page,
    apiMocks,
  }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: "Profile Settings" }),
    ).toBeVisible();

    const rateInput = page.getByPlaceholder("Enter hourly rate");
    await rateInput.fill("72");

    const languagesCombobox = page
      .locator("label", { hasText: /^Language Pairs$/ })
      .locator("..")
      .getByRole("combobox");
    const langBox = await languagesCombobox.boundingBox();
    expect(langBox).not.toBeNull();
    await languagesCombobox.click({
      position: {
        x: Math.max(10, (langBox?.width ?? 280) - 14),
        y: (langBox?.height ?? 40) / 2,
      },
    });
    await page.getByRole("option", { name: "EN-DE", exact: true }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByText("Profile saved successfully")).toBeVisible();
    await expect
      .poll(() => apiMocks.updateCalls.at(-1)?.body)
      .toEqual({
        profile: {
          hourlyRate: 72,
          languages: ["EN-FR", "EN-ES", "EN-DE"],
        },
      });
  });

  test("supports delete account cancellation and confirmed deletion redirect", async ({
    page,
    apiMocks,
  }) => {
    await page.goto("/settings");

    await page.getByRole("button", { name: "Delete My Account" }).click();
    await expect(
      page.getByText(
        "Are you sure you want to delete your account? This action cannot be undone.",
      ),
    ).toBeVisible();

    // Cancel keeps user on /settings and sends no DELETE call
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByText("Are you sure you want to delete your account?"),
    ).toHaveCount(0);
    expect(apiMocks.deleteCalls).toHaveLength(0);

    // Confirm deletion
    await page.getByRole("button", { name: "Delete My Account" }).click();
    await page.getByRole("button", { name: "Yes, Delete My Account" }).click();

    await expect(page.getByText("Account deleted successfully")).toBeVisible();
    expect(apiMocks.deleteCalls).toEqual([LINGUIST_EMAIL]);

    await expect(page).toHaveURL(/\/login$/);
    const storage = await page.evaluate(() => ({
      email: localStorage.getItem("userEmail"),
      token: localStorage.getItem("sessionToken"),
    }));
    expect(storage.email).toBeNull();
    expect(storage.token).toBeNull();
  });
});
