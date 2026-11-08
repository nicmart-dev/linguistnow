import type { Page, Route } from "@playwright/test";
import type { SearchLinguistsQuery } from "@linguistnow/shared";
import {
  LINGUIST_EMAIL,
  PM_EMAIL,
  buildSearchResponse,
  createMockCalendars,
  createMockFilterOptions,
  createMockLinguists,
  createMockUsers,
  validateMockRawAirtableUser,
  type MockAirtableUser,
} from "./mock-data";

export interface MockApiOptions {
  requireAuthHeader?: boolean;
  authFailureStatus?: 401 | 404;
  simulateCurrencyFailure?: boolean;
}

export interface ApiMockController {
  users: Record<string, MockAirtableUser | undefined>;
  seenAuthHeaders: Array<string | undefined>;
  searchQueries: SearchLinguistsQuery[];
  updateCalls: Array<{ email: string; body: Record<string, unknown> }>;
  deleteCalls: string[];
  ratingUpdates: Array<{ email: string; rating: number }>;
  setSimulateCurrencyFailure: (value: boolean) => void;
}

function parseOptionalNumber(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

function parseSearchQuery(url: URL): SearchLinguistsQuery {
  const sp = url.searchParams;
  return {
    languages: sp.get("languages") ?? undefined,
    specialization: sp.get("specialization") ?? undefined,
    minRate: parseOptionalNumber(sp.get("minRate")),
    maxRate: parseOptionalNumber(sp.get("maxRate")),
    minRating: parseOptionalNumber(sp.get("minRating")),
    availableOnly: sp.get("availableOnly") === "true" ? true : undefined,
    startDate: sp.get("startDate") ?? undefined,
    endDate: sp.get("endDate") ?? undefined,
    requiredHours: parseOptionalNumber(sp.get("requiredHours")),
    timezone: sp.get("timezone") ?? undefined,
    displayCurrency: sp.get("displayCurrency") ?? undefined,
    page: parseOptionalNumber(sp.get("page")) ?? 1,
    limit: parseOptionalNumber(sp.get("limit")) ?? 20,
  };
}

function parseJsonBody(route: Route): Record<string, unknown> {
  const postData = route.request().postData();
  if (!postData) return {};
  return JSON.parse(postData) as Record<string, unknown>;
}

const OFF_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export async function installApiMocks(
  page: Page,
  options: MockApiOptions = {},
): Promise<ApiMockController> {
  const users = createMockUsers();
  const linguists = createMockLinguists();
  const calendars = createMockCalendars();
  const filterOptions = createMockFilterOptions();
  const seenAuthHeaders: Array<string | undefined> = [];
  const searchQueries: SearchLinguistsQuery[] = [];
  const updateCalls: Array<{ email: string; body: Record<string, unknown> }> =
    [];
  const deleteCalls: string[] = [];
  const ratingUpdates: Array<{ email: string; rating: number }> = [];
  let simulateCurrencyFailure = options.simulateCurrencyFailure ?? false;

  // Block external third-party requests and mock API cleanly across both page and Service Worker
  const context = page.context();
  await context.route(/rsms\.me/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/css",
      headers: {
        "access-control-allow-origin": "*",
      },
      body: "/* mocked in e2e */",
    });
  });

  await context.route(/accounts\.google\.com/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      headers: {
        "access-control-allow-origin": "*",
      },
      body: "/* mocked google gsi in e2e */",
    });
  });

  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/undefined(?=\/api\/)/, "");
    const method = request.method().toUpperCase();

    if (pathname === "/api/linguists/filters" && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(filterOptions),
      });
      return;
    }

    if (pathname === "/api/linguists/search" && method === "GET") {
      const query = parseSearchQuery(url);
      searchQueries.push(query);
      const body = buildSearchResponse(linguists, query, {
        simulateCurrencyFailure,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
      return;
    }

    const ratingMatch = /^\/api\/linguists\/([^/]+)\/rating$/.exec(pathname);
    if (ratingMatch && method === "PATCH") {
      const email = decodeURIComponent(ratingMatch[1]).toLowerCase();
      const body = parseJsonBody(route);
      const newRating = typeof body.rating === "number" ? body.rating : 0;
      const target = linguists.find((l) => l.email.toLowerCase() === email);
      if (!target || newRating < 1 || newRating > 5) {
        await route.fulfill({
          status: target ? 400 : 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid rating or linguist" }),
        });
        return;
      }
      target.rating = newRating;
      ratingUpdates.push({ email, rating: newRating });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rating: newRating }),
      });
      return;
    }

    const calendarMatch = /^\/api\/calendars\/list\/([^/]+)$/.exec(pathname);
    if (calendarMatch && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ calendars }),
      });
      return;
    }

    const userMatch = /^\/api\/users\/([^/]+)$/.exec(pathname);
    if (userMatch) {
      const headers = request.headers() as Record<string, string | undefined>;
      const authHeader = headers["authorization"];
      seenAuthHeaders.push(authHeader);

      if (
        options.requireAuthHeader !== false &&
        (!authHeader || !authHeader.startsWith("Bearer "))
      ) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Unauthorized" }),
        });
        return;
      }

      if (options.authFailureStatus) {
        await route.fulfill({
          status: options.authFailureStatus,
          contentType: "application/json",
          body: JSON.stringify({ error: "Auth error simulated" }),
        });
        return;
      }

      const email = decodeURIComponent(userMatch[1]).toLowerCase();
      const existing = users[email];

      if (method === "GET") {
        if (!existing) {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ error: "User not found" }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(existing),
        });
        return;
      }

      if (method === "PUT") {
        if (!existing) {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ error: "User not found" }),
          });
          return;
        }
        const body = parseJsonBody(route);
        updateCalls.push({ email, body });

        const updated: Record<string, unknown> = { ...existing };

        if (Array.isArray(body.calendarIds)) {
          updated["Calendar IDs"] = body.calendarIds
            .map((id) => String(id))
            .join(",");
        }

        if (
          body.availabilityPreferences &&
          typeof body.availabilityPreferences === "object"
        ) {
          const prefs = body.availabilityPreferences as {
            timezone?: string;
            workingHoursStart?: string;
            workingHoursEnd?: string;
            offDays?: number[];
          };
          if (prefs.timezone !== undefined) updated.Timezone = prefs.timezone;
          if (prefs.workingHoursStart !== undefined) {
            updated["Working Hours Start"] = prefs.workingHoursStart;
          }
          if (prefs.workingHoursEnd !== undefined) {
            updated["Working Hours End"] = prefs.workingHoursEnd;
          }
          if (Array.isArray(prefs.offDays)) {
            updated["Off Days"] = prefs.offDays
              .map((idx) => OFF_DAY_NAMES[idx])
              .filter(Boolean);
          }
        }

        if (body.profile && typeof body.profile === "object") {
          const profile = body.profile as {
            hourlyRate?: number | null;
            currency?: string;
            languages?: string[];
            specialization?: string[];
          };
          if (profile.hourlyRate !== undefined) {
            updated["Hourly Rate"] =
              profile.hourlyRate === null ? undefined : profile.hourlyRate;
          }
          if (profile.currency !== undefined) {
            updated.Currency = profile.currency;
          }
          if (Array.isArray(profile.languages)) {
            updated.Languages = profile.languages;
          }
          if (Array.isArray(profile.specialization)) {
            updated.Specialization = profile.specialization;
          }
        }

        const parsed = validateMockRawAirtableUser(updated);
        users[email] = parsed;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(parsed),
        });
        return;
      }

      if (method === "DELETE") {
        deleteCalls.push(email);
        Reflect.deleteProperty(users, email);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Deleted user", email }),
        });
        return;
      }
    }

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        error: `Unhandled mock route: ${method} ${pathname}`,
      }),
    });
  });

  return {
    users,
    seenAuthHeaders,
    searchQueries,
    updateCalls,
    deleteCalls,
    ratingUpdates,
    setSimulateCurrencyFailure: (value: boolean) => {
      simulateCurrencyFailure = value;
    },
  };
}

export async function seedSession(
  page: Page,
  role: "pm" | "linguist",
  token = "e2e-mock-signed-session-token",
): Promise<void> {
  const email = role === "pm" ? PM_EMAIL : LINGUIST_EMAIL;
  await page.addInitScript(
    ({ userEmail, sessionToken }) => {
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("sessionToken", sessionToken);
    },
    { userEmail: email, sessionToken: token },
  );
}
