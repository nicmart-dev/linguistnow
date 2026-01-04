/**
 * Shared date and locale utilities for consistent date handling across client and server
 */

import type { Locale } from "date-fns/locale";

/**
 * Maps i18next locale codes to BCP 47 locale tags for Intl.Locale API
 */
const I18NEXT_TO_BCP47_MAP: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  "zh-cn": "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
  ar: "ar-SA",
  ru: "ru-RU",
};

/**
 * Determines the first day of the week based on locale
 * Uses browser's Intl.Locale API when available, falls back to manual logic
 * @param localeCode - i18next locale code (e.g., 'en', 'fr', 'ar')
 * @returns 0 for Sunday, 1 for Monday
 */
export function getWeekStartsOn(localeCode: string): 0 | 1 {
  // Try using Intl.Locale API first (browser-native, most accurate)
  if (typeof Intl !== "undefined" && "Locale" in Intl) {
    try {
      const bcp47Locale = I18NEXT_TO_BCP47_MAP[localeCode] || localeCode;
      const localeObj = new Intl.Locale(bcp47Locale);
      // @ts-expect-error - weekInfo is not in TypeScript types yet but exists in modern browsers
      const weekInfo = localeObj.weekInfo as { firstDay?: number } | undefined;
      if (weekInfo?.firstDay !== undefined) {
        // weekInfo.firstDay: 1 = Monday, 7 = Sunday
        // Convert to our format: 0 = Sunday, 1 = Monday
        return weekInfo.firstDay === 7 ? 0 : (weekInfo.firstDay as 0 | 1);
      }
    } catch {
      // Fall through to manual fallback
    }
  }

  // Fallback: manual logic based on known locale patterns
  // Monday (1) for: France, Germany, Spain, Italy, Portugal, Russia, China
  const mondayLocales = ["fr", "de", "es", "it", "pt", "ru", "zh-cn"];
  return mondayLocales.includes(localeCode) ? 1 : 0;
}

/**
 * Maps i18next locale codes to date-fns locale objects
 * This ensures consistent date formatting across the application
 */
export function getDateFnsLocale(
  localeCode: string,
  localeMap: Record<string, Locale>,
  defaultLocale: Locale,
): Locale {
  return localeMap[localeCode] ?? defaultLocale;
}

/**
 * Day numbers mapping (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * Used for offDays and weekday calculations
 */
export const DAY_NUMBERS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

/**
 * Day names in English (for reference/fallback)
 */
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
