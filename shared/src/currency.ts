/**
 * Currency constants and types shared between client and server
 */

export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "CAD",
  "AUD",
  "CHF",
  "INR",
  "BRL",
  "MXN",
  "KRW",
  "ZAR",
  "SGD",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "Fr",
  INR: "₹",
  BRL: "R$",
  MXN: "Mex$",
  KRW: "₩",
  ZAR: "R",
  SGD: "S$",
};

export const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  CHF: "Swiss Franc",
  INR: "Indian Rupee",
  BRL: "Brazilian Real",
  MXN: "Mexican Peso",
  KRW: "South Korean Won",
  ZAR: "South African Rand",
  SGD: "Singapore Dollar",
};

/**
 * Currency definition with code, symbol, and name
 */
export interface Currency {
  code: SupportedCurrency;
  symbol: string;
  name: string;
}

/**
 * Get all currencies as an array of Currency objects
 * Useful for dropdowns and lists that need code, symbol, and name
 * @returns Array of currency objects
 */
export function getCurrencies(): Currency[] {
  return SUPPORTED_CURRENCIES.map((code) => ({
    code,
    symbol: CURRENCY_SYMBOLS[code],
    name: CURRENCY_NAMES[code],
  }));
}

/**
 * Get currency symbol from currency code
 * Handles undefined/empty strings and case-insensitive lookups
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @returns Currency symbol (e.g., '$', '€') or the code itself if not found
 */
export function getCurrencySymbol(currencyCode?: string): string {
  if (!currencyCode) return "";
  const upperCode = currencyCode.toUpperCase() as SupportedCurrency;
  return CURRENCY_SYMBOLS[upperCode] || currencyCode;
}

/**
 * Format currency amount with symbol
 * @param amount - Amount to format
 * @param currency - Currency code (ISO 4217)
 * @returns Formatted string (e.g., "$50.00" or "€50.00")
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
}
