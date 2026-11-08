import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const BACKEND_URL = process.env.SMOKE_BACKEND_URL || "http://127.0.0.1:5050";
const SESSION_SECRET =
  process.env.SMOKE_SESSION_SECRET ||
  "smoke-test-only-dummy-session-secret-min-32-chars";

function createSessionToken(email: string, nowMs = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: email.trim().toLowerCase(),
      exp: Math.floor(nowMs / 1000) + 3600,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

async function attachBackendTransportProxy(page: Page): Promise<void> {
  const context = page.context();
  // Block external CDN/OAuth network calls cleanly in isolated CI containers
  await context.route(/rsms\.me/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/css",
      headers: {
        "access-control-allow-origin": "*",
      },
      body: "/* offline font stub */",
    });
  });

  await context.route(/accounts\.google\.com/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      headers: {
        "access-control-allow-origin": "*",
      },
      body: "/* offline gsi stub */",
    });
  });

  // Forward all /api/** calls straight to the ephemeral Docker backend container URL
  // without mocking any API response payloads.
  await context.route("**/api/**", async (route) => {
    const req = route.request();
    const orig = new URL(req.url());
    const cleanPath = orig.pathname.replace(/^\/undefined(?=\/api\/)/, "");
    const targetUrl = new URL(
      `${cleanPath}${orig.search}`,
      BACKEND_URL,
    ).toString();
    const response = await route.fetch({ url: targetUrl });
    await route.fulfill({ response });
  });
}

test.describe("Tier B Live Container Smoke Tests @smoke", () => {
  test("backend enforces session HMAC verification, RBAC, and FX conversion", async ({
    request,
  }) => {
    // 1. Unauthenticated request is rejected
    const unauth = await request.get(
      `${BACKEND_URL}/api/users/pm%40example.com`,
    );
    expect(unauth.status()).toBe(401);

    // 2. Tampered signature is rejected
    const tampered = await request.get(
      `${BACKEND_URL}/api/users/pm%40example.com`,
      {
        headers: {
          Authorization: `Bearer ${createSessionToken("pm@example.com")}tamper`,
        },
      },
    );
    expect(tampered.status()).toBe(401);

    // 3. Linguist cannot read another user's profile
    const linguistToken = createSessionToken("linguist@example.com");
    const forbidden = await request.get(
      `${BACKEND_URL}/api/users/pm%40example.com`,
      {
        headers: { Authorization: `Bearer ${linguistToken}` },
      },
    );
    expect(forbidden.status()).toBe(403);

    // 4. Valid PM session succeeds against mock Airtable via backend
    const pmToken = createSessionToken("pm@example.com");
    const pmRes = await request.get(
      `${BACKEND_URL}/api/users/pm%40example.com`,
      {
        headers: { Authorization: `Bearer ${pmToken}` },
      },
    );
    expect(pmRes.status()).toBe(200);
    const pmJson = (await pmRes.json()) as { Email?: string; Role?: string };
    expect(pmJson.Email).toBe("pm@example.com");
    expect(pmJson.Role).toBe("Project Manager");

    // 5. Currency conversion works via Redis + mock Frankfurter
    const fxRes = await request.get(
      `${BACKEND_URL}/api/currency/convert?amount=100&from=USD&to=EUR`,
    );
    expect(fxRes.status()).toBe(200);
    const fxJson = (await fxRes.json()) as { converted?: number };
    expect(fxJson.converted).toBe(92);
  });

  test("frontend Nginx container renders /dashboard against real backend + Redis + FX", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await attachBackendTransportProxy(page);
    const pmToken = createSessionToken("pm@example.com");
    await page.addInitScript(
      ({ email, token }) => {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("sessionToken", token);
      },
      { email: "pm@example.com", token: pmToken },
    );

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Hey Morgan Taylor!")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Alice Smoke")).toBeVisible();

    // Switch Display Currency to EUR -> hits real backend /api/linguists/search -> Redis -> mock Frankfurter
    const currencySelect = page
      .locator("label", { hasText: /^Display Currency$/ })
      .locator("..")
      .getByRole("combobox");
    await currencySelect.click();
    await page.getByRole("option", { name: /EUR/ }).click();

    await expect(page.getByText("Rates converted to EUR")).toBeVisible();
    await expect(page.getByText("€46.00/hr")).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("rejects tampered session token in browser and redirects to /login", async ({
    page,
  }) => {
    await attachBackendTransportProxy(page);
    await page.addInitScript(() => {
      localStorage.setItem("userEmail", "pm@example.com");
      localStorage.setItem("sessionToken", "tampered.invalid-token");
    });

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
