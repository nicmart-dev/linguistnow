import { describe, it, expect } from "vitest";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  CURRENCY_NAMES,
  getCurrencies,
  getCurrencySymbol,
  formatCurrency,
} from "./currency";

describe("currency utilities", () => {
  it("returns all supported currencies with code, symbol, and name", () => {
    const currencies = getCurrencies();
    expect(currencies).toHaveLength(SUPPORTED_CURRENCIES.length);
    for (const currency of currencies) {
      expect(currency.symbol).toBe(CURRENCY_SYMBOLS[currency.code]);
      expect(currency.name).toBe(CURRENCY_NAMES[currency.code]);
    }
  });

  it("returns currency symbols case-insensitively and falls back appropriately", () => {
    expect(getCurrencySymbol("usd")).toBe("$");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("GBP")).toBe("£");
    expect(getCurrencySymbol("XYZ")).toBe("XYZ");
    expect(getCurrencySymbol("")).toBe("");
    expect(getCurrencySymbol(undefined)).toBe("");
  });

  it("formats currency amounts to two decimal places", () => {
    expect(formatCurrency(50, "USD")).toBe("$50.00");
    expect(formatCurrency(75.5, "eur")).toBe("€75.50");
  });
});
