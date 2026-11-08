import { readFileSync } from "node:fs";
import { expect, test } from "../fixtures/test";
import { seedSession } from "../fixtures/api-mocks";

test.describe("PM Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page, "pm", "e2e-pm-token");
    await page.addInitScript(() => {
      const opened: string[] = [];
      (window as unknown as { __openedUrls: string[] }).__openedUrls = opened;
      window.open = (url?: string | URL) => {
        opened.push(String(url ?? ""));
        return null;
      };
    });
  });

  test("displays all 5 availability statuses, supports pagination, email filter, and sorting", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(10);

    // All 5 availability badge states on page 1
    await expect(page.getByText(/Available\s*\(40h\)/).first()).toBeVisible();
    await expect(page.getByText(/Limited\s*\(12h\)/)).toBeVisible();
    await expect(page.getByText("Not Available")).toBeVisible();
    await expect(page.getByText("Setup Incomplete")).toBeVisible();
    await expect(page.getByText("Login Required")).toBeVisible();

    // Bulk reminder buttons appear and open mailto links
    const setupReminderBtn = page.getByRole("button", {
      name: "Send Setup Reminder to 1 Linguist",
    });
    await expect(setupReminderBtn).toBeVisible();
    await setupReminderBtn.click();

    const reloginReminderBtn = page.getByRole("button", {
      name: "Send Re-login Reminder to 1 Linguist",
    });
    await expect(reloginReminderBtn).toBeVisible();
    await reloginReminderBtn.click();

    const openedUrls = await page.evaluate(
      () => (window as unknown as { __openedUrls: string[] }).__openedUrls,
    );
    expect(openedUrls).toHaveLength(2);
    expect(openedUrls[0]).toContain("mailto:?bcc=nadia@example.com");
    expect(openedUrls[1]).toContain("mailto:?bcc=omar@example.com");

    // Pagination page 1 <-> page 2
    await expect(page.getByText("Paula Silva")).toHaveCount(0);
    await page.getByRole("button", { name: "Next" }).click();
    await expect(rows).toHaveCount(2);
    await expect(page.getByText("Paula Silva")).toBeVisible();
    await expect(page.getByText("David Mueller")).toBeVisible();

    await page.getByRole("button", { name: "Previous" }).click();
    await expect(rows).toHaveCount(10);
    await expect(page.getByText("Alice Moreau")).toBeVisible();

    // Column sorting by Email (ascending places alice@ first, descending places yuki@ first)
    const emailSortHeader = page
      .locator("thead th")
      .getByRole("button", { name: "Email" });
    await emailSortHeader.click();
    await expect(rows.first()).toContainText("alice@example.com");
    await emailSortHeader.click();
    await expect(rows.first()).toContainText("yuki@example.com");

    // Email filter
    const emailFilter = page.getByPlaceholder("Filter by email...");
    await emailFilter.fill("nadia@");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Nadia Mansour");
    await emailFilter.fill("");
    await expect(rows).toHaveCount(10);
  });

  test("filters linguists by language, specialization, rating, availability, project hours, and clears filters", async ({
    page,
    apiMocks,
  }) => {
    await page.goto("/dashboard");
    await expect(page.locator("tbody tr")).toHaveCount(10);

    const selectByLabel = (labelText: string) =>
      page
        .locator("label", { hasText: new RegExp(`^${labelText}$`) })
        .locator("..")
        .getByRole("combobox");

    // Language filter
    await selectByLabel("Languages").click();
    await page.getByRole("option", { name: "EN-FR", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await expect(page.getByText("Alice Moreau")).toBeVisible();
    await expect(page.getByText("Omar Haddad")).toBeVisible();
    await expect(page.getByText("David Mueller")).toBeVisible();

    // Combine with Specialization filter
    await selectByLabel("Specialization").click();
    await page.getByRole("option", { name: "Legal", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.getByText("Alice Moreau")).toBeVisible();

    // Clear filters brings back full list
    await page.getByRole("button", { name: "Clear Filters" }).click();
    await expect(page.locator("tbody tr")).toHaveCount(10);

    // Minimum rating 5+
    await selectByLabel("Minimum Rating").click();
    await page.getByRole("option", { name: "5+" }).click();
    await expect(page.locator("tbody tr")).toHaveCount(4);

    // Clear filters
    await page.getByRole("button", { name: "Clear Filters" }).click();
    await expect(page.locator("tbody tr")).toHaveCount(10);

    // Availability Only hides unavailable / setup incomplete / token expired
    await selectByLabel("Availability").click();
    await page.getByRole("option", { name: "Available Only" }).click();
    await expect(page.locator("tbody tr")).toHaveCount(8);
    await expect(page.getByText("Nadia Mansour")).toHaveCount(0);
    await expect(page.getByText("Lars Vega")).toHaveCount(0);

    // Required hours input updates query
    const hoursInput = page.getByPlaceholder("Enter hours needed");
    await hoursInput.fill("25");
    await expect
      .poll(() => apiMocks.searchQueries.at(-1)?.requiredHours)
      .toBe(25);
  });

  test("switches to Card view, updates rating, and completes BookingModal ICS download + mailto", async ({
    page,
    apiMocks,
  }) => {
    await page.goto("/dashboard");
    await expect(page.locator("tbody tr")).toHaveCount(10);

    // Switch to Card view
    await page.getByRole("tab", { name: "Card" }).click();
    await expect(page.getByText("Alice Moreau")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Book$/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Setup Reminder", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Re-login Reminder", exact: true }),
    ).toBeVisible();

    // Update rating on first card (Alice Moreau)
    await page.locator('[aria-label="Set rating to 3 stars"]').first().click();
    await expect(page.getByText("Rating updated successfully")).toBeVisible();
    expect(apiMocks.ratingUpdates).toContainEqual({
      email: "alice@example.com",
      rating: 3,
    });

    // Open BookingModal for Alice Moreau
    await page
      .getByRole("button", { name: /^Book$/i })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Book Alice Moreau" }),
    ).toBeVisible();

    const sendBtn = dialog.getByRole("button", { name: "Send Booking Email" });
    await expect(sendBtn).toBeDisabled();

    await dialog
      .getByPlaceholder("Enter project name")
      .fill("Q4 Legal Translation");
    await dialog
      .getByPlaceholder("Enter project description (optional)")
      .fill("Contract translation review");

    await expect(
      dialog.getByText("Booking Request: Q4 Legal Translation"),
    ).toBeVisible();
    await expect(sendBtn).toBeEnabled();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      sendBtn.click(),
    ]);

    expect(download.suggestedFilename()).toBe("booking.ics");
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const icsContent = readFileSync(downloadPath as string, "utf8");
    expect(icsContent).toContain("BEGIN:VCALENDAR");
    expect(icsContent).toContain("SUMMARY:Q4 Legal Translation");
    expect(icsContent).toContain("DESCRIPTION:Contract translation review");
    expect(icsContent).toContain("alice@example.com");
    expect(icsContent).toContain("END:VCALENDAR");

    await expect(dialog).toHaveCount(0);

    const openedUrls = await page.evaluate(
      () => (window as unknown as { __openedUrls: string[] }).__openedUrls,
    );
    const mailtoUrl = openedUrls.find((u) =>
      u.startsWith("mailto:alice@example.com"),
    );
    expect(mailtoUrl).toBeDefined();
    expect(decodeURIComponent(mailtoUrl as string)).toContain(
      "Booking Request: Q4 Legal Translation",
    );
  });

  test("converts hourly rates to EUR and displays warning toast on FX failure", async ({
    page,
    apiMocks,
  }) => {
    await page.goto("/dashboard");
    await expect(page.locator("tbody tr")).toHaveCount(10);

    const currencySelect = page
      .locator("label", { hasText: /^Display Currency$/ })
      .locator("..")
      .getByRole("combobox");

    // Convert USD -> EUR (50 * 0.92 = 46.00)
    await currencySelect.click();
    await page.getByRole("option", { name: /EUR/ }).click();

    await expect(page.getByText("Rates converted to EUR")).toBeVisible();
    await expect(page.getByText("€46.00/hr")).toBeVisible();

    // Simulate FX conversion failure for GBP
    apiMocks.setSimulateCurrencyFailure(true);
    await currencySelect.click();
    await page.getByRole("option", { name: /GBP/ }).click();

    await expect(
      page.getByText("Currency conversion unavailable"),
    ).toBeVisible();
  });
});
