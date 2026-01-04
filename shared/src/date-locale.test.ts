import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getWeekStartsOn,
  getDateFnsLocale,
  DAY_NUMBERS,
  DAY_NAMES,
} from "./date-locale";

describe("date-locale utilities", () => {
  describe("getWeekStartsOn", () => {
    describe("with Intl.Locale API fallback (manual logic)", () => {
      // Mock Intl to test fallback logic
      let originalIntl: typeof Intl;

      beforeEach(() => {
        originalIntl = globalThis.Intl;
        // @ts-expect-error - Mocking Intl for testing
        globalThis.Intl = undefined;
      });

      afterEach(() => {
        globalThis.Intl = originalIntl;
      });

      it("should return 0 (Sunday) for English locale", () => {
        expect(getWeekStartsOn("en")).toBe(0);
      });

      it("should return 1 (Monday) for French locale", () => {
        expect(getWeekStartsOn("fr")).toBe(1);
      });

      it("should return 1 (Monday) for German locale", () => {
        expect(getWeekStartsOn("de")).toBe(1);
      });

      it("should return 1 (Monday) for Spanish locale", () => {
        expect(getWeekStartsOn("es")).toBe(1);
      });

      it("should return 1 (Monday) for Italian locale", () => {
        expect(getWeekStartsOn("it")).toBe(1);
      });

      it("should return 1 (Monday) for Portuguese locale", () => {
        expect(getWeekStartsOn("pt")).toBe(1);
      });

      it("should return 1 (Monday) for Russian locale", () => {
        expect(getWeekStartsOn("ru")).toBe(1);
      });

      it("should return 1 (Monday) for Chinese locale", () => {
        expect(getWeekStartsOn("zh-cn")).toBe(1);
      });

      it("should return 0 (Sunday) for Japanese locale", () => {
        expect(getWeekStartsOn("ja")).toBe(0);
      });

      it("should return 0 (Sunday) for Korean locale", () => {
        expect(getWeekStartsOn("ko")).toBe(0);
      });

      it("should return 0 (Sunday) for Arabic locale", () => {
        expect(getWeekStartsOn("ar")).toBe(0);
      });

      it("should return 0 (Sunday) for unknown locale", () => {
        expect(getWeekStartsOn("unknown")).toBe(0);
      });
    });

    describe("with Intl.Locale API (when available)", () => {
      it("should use Intl.Locale weekInfo when available", () => {
        // This test runs with real Intl.Locale API if available
        // The result should be consistent with our fallback logic
        const frResult = getWeekStartsOn("fr");
        const enResult = getWeekStartsOn("en");

        // French weeks start on Monday
        expect(frResult).toBe(1);
        // English (US) weeks start on Sunday
        expect(enResult).toBe(0);
      });
    });
  });

  describe("getDateFnsLocale", () => {
    // Mock Locale type - matches date-fns Locale interface
    type MockLocale = {
      code: string;
      [key: string]: unknown;
    };

    const mockEnUS: MockLocale = {
      code: "en-US",
    };
    const mockFr: MockLocale = {
      code: "fr",
    };
    const mockDe: MockLocale = {
      code: "de",
    };

    const localeMap = {
      en: mockEnUS,
      fr: mockFr,
      de: mockDe,
    };

    it("should return the correct locale for a known locale code", () => {
      expect(getDateFnsLocale("en", localeMap, mockEnUS)).toBe(mockEnUS);
      expect(getDateFnsLocale("fr", localeMap, mockEnUS)).toBe(mockFr);
      expect(getDateFnsLocale("de", localeMap, mockEnUS)).toBe(mockDe);
    });

    it("should return the default locale for an unknown locale code", () => {
      expect(getDateFnsLocale("unknown", localeMap, mockEnUS)).toBe(mockEnUS);
      expect(getDateFnsLocale("ja", localeMap, mockEnUS)).toBe(mockEnUS);
    });

    it("should handle empty locale code", () => {
      expect(getDateFnsLocale("", localeMap, mockEnUS)).toBe(mockEnUS);
    });
  });

  describe("DAY_NUMBERS", () => {
    it("should have correct values for each day", () => {
      expect(DAY_NUMBERS.SUNDAY).toBe(0);
      expect(DAY_NUMBERS.MONDAY).toBe(1);
      expect(DAY_NUMBERS.TUESDAY).toBe(2);
      expect(DAY_NUMBERS.WEDNESDAY).toBe(3);
      expect(DAY_NUMBERS.THURSDAY).toBe(4);
      expect(DAY_NUMBERS.FRIDAY).toBe(5);
      expect(DAY_NUMBERS.SATURDAY).toBe(6);
    });

    it("should be readonly", () => {
      // TypeScript enforces this at compile time
      // This test documents the expected behavior
      expect(Object.keys(DAY_NUMBERS)).toHaveLength(7);
    });
  });

  describe("DAY_NAMES", () => {
    it("should have correct day names in order", () => {
      expect(DAY_NAMES[0]).toBe("Sunday");
      expect(DAY_NAMES[1]).toBe("Monday");
      expect(DAY_NAMES[2]).toBe("Tuesday");
      expect(DAY_NAMES[3]).toBe("Wednesday");
      expect(DAY_NAMES[4]).toBe("Thursday");
      expect(DAY_NAMES[5]).toBe("Friday");
      expect(DAY_NAMES[6]).toBe("Saturday");
    });

    it("should have 7 days", () => {
      expect(DAY_NAMES).toHaveLength(7);
    });

    it("should be indexable by DAY_NUMBERS", () => {
      expect(DAY_NAMES[DAY_NUMBERS.SUNDAY]).toBe("Sunday");
      expect(DAY_NAMES[DAY_NUMBERS.MONDAY]).toBe("Monday");
      expect(DAY_NAMES[DAY_NUMBERS.SATURDAY]).toBe("Saturday");
    });
  });
});
