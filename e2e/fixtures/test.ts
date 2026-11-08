import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page } from "@playwright/test";
import {
  installApiMocks,
  type ApiMockController,
  type MockApiOptions,
} from "./api-mocks";

export interface TestFixtures {
  apiMocks: ApiMockController;
}

export interface TestOptions {
  autoInstallMocks: boolean;
  mockApiOptions: MockApiOptions;
  allowConsoleErrors: boolean;
}

export const test = base.extend<TestFixtures & TestOptions>({
  autoInstallMocks: [true, { option: true }],
  mockApiOptions: [{}, { option: true }],
  allowConsoleErrors: [false, { option: true }],

  apiMocks: [
    async ({ page, autoInstallMocks, mockApiOptions }, use) => {
      if (autoInstallMocks) {
        const controller = await installApiMocks(page, mockApiOptions);
        await use(controller);
        return;
      }

      // Unreachable placeholder when autoInstallMocks is explicitly false
      await use({
        users: {},
        seenAuthHeaders: [],
        searchQueries: [],
        updateCalls: [],
        deleteCalls: [],
        ratingUpdates: [],
        setSimulateCurrencyFailure: () => {},
      });
    },
    { auto: true },
  ],

  page: async ({ page, allowConsoleErrors }, use) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`${msg.text()} [${msg.location().url || "no-url"}]`);
      }
    });

    await use(page);

    expect(pageErrors, "Expected zero uncaught page errors").toEqual([]);
    if (!allowConsoleErrors) {
      expect(consoleErrors, "Expected zero console.error messages").toEqual([]);
    }
  },
});

export async function runAxeScan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
}

export { expect };
