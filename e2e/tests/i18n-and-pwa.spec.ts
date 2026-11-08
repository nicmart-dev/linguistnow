import { expect, test } from "../fixtures/test";

const LOCALES = [
  { code: "en", dir: "ltr" },
  { code: "fr", dir: "ltr" },
  { code: "zh-cn", dir: "ltr" },
  { code: "es", dir: "ltr" },
  { code: "de", dir: "ltr" },
  { code: "it", dir: "ltr" },
  { code: "pt", dir: "ltr" },
  { code: "ja", dir: "ltr" },
  { code: "ko", dir: "ltr" },
  { code: "ar", dir: "rtl" },
  { code: "ru", dir: "ltr" },
] as const;

test.describe("i18n and PWA", () => {
  test("switches across all 11 locales, sets RTL for Arabic, and persists across navigation and reload", async ({
    page,
  }) => {
    await page.goto("/login");

    for (const [index, locale] of LOCALES.entries()) {
      await page.locator('label[for="language-toggle"]').click();
      const menuButtons = page.locator("#lang-menu button");
      await expect(menuButtons).toHaveCount(LOCALES.length);
      await menuButtons.nth(index).click();

      await expect(page.locator("html")).toHaveAttribute("lang", locale.code);
      await expect(page.locator("html")).toHaveAttribute("dir", locale.dir);

      const saved = await page.evaluate(() =>
        localStorage.getItem("linguistnow-language"),
      );
      expect(saved).toBe(locale.code);
    }

    // Switch to Arabic (RTL) and verify persistence across navigation + reload
    const arIndex = LOCALES.findIndex((l) => l.code === "ar");
    await page.locator('label[for="language-toggle"]').click();
    await page.locator("#lang-menu button").nth(arIndex).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await page.locator("footer a[href='/privacy']").click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("serves valid PWA manifest and activates Service Worker", async ({
    page,
  }) => {
    await page.goto("/login");

    const manifestRes = await page.request.get("/manifest.webmanifest");
    expect(manifestRes.status()).toBe(200);
    const manifest = (await manifestRes.json()) as {
      short_name?: string;
      display?: string;
      start_url?: string;
    };
    expect(manifest.short_name).toBe("LinguistNow");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");

    const manifestHrefs = await page
      .locator('head link[rel="manifest"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    expect(manifestHrefs).toContain("/manifest.webmanifest");

    const swRes = await page.request.get("/sw.js");
    expect(swRes.status()).toBe(200);
    expect(swRes.headers()["content-type"]).toMatch(/javascript/);

    await expect
      .poll(async () =>
        page.evaluate(async () => {
          if (!("serviceWorker" in navigator)) {
            return "unsupported";
          }
          const registration = await navigator.serviceWorker.ready;
          return registration.active?.state ?? "none";
        }),
      )
      .toBe("activated");
  });
});
