import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ExchangeRates } from "./currencyService.js";

// Mock ioredis before importing currencyService
const mockGet = vi.fn();
const mockSetex = vi.fn();
const mockOn = vi.fn();

vi.mock("ioredis", () => {
  return {
    default: class {
      get = mockGet;
      setex = mockSetex;
      on = mockOn;
      constructor() {
        // Constructor does nothing
      }
    },
  };
});

// Mock env
vi.mock("../env.js", () => ({
  env: {
    REDIS_URL: "redis://localhost:6379",
    FRANKFURTER_URL: "http://localhost:8080",
  },
}));

// Import after mocks
import {
  getRedisClient,
  resetRedisClient,
  refreshRates,
  getRates,
  convert,
  hasRates,
} from "./currencyService.js";

describe("currencyService", () => {
  const mockRates: ExchangeRates = {
    base: "USD",
    date: "2024-01-15",
    rates: {
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CNY: 6.5,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      INR: 75.0,
      BRL: 5.2,
      MXN: 20.0,
      KRW: 1200.0,
      ZAR: 15.0,
      SGD: 1.35,
    },
    updatedAt: "2024-01-15T12:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Reset singleton
    resetRedisClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset Redis client singleton
    resetRedisClient();
  });

  describe("getRedisClient", () => {
    beforeEach(() => {
      // Reset singleton before each test in this describe block
      resetRedisClient();
      mockOn.mockClear();
    });

    it("should create Redis client on first call", () => {
      const client = getRedisClient();

      expect(client).toBeDefined();
      // Client should have Redis methods
      expect(client).toHaveProperty("get");
      expect(client).toHaveProperty("setex");
    });

    it("should return same Redis client instance on subsequent calls", () => {
      const client1 = getRedisClient();
      const client2 = getRedisClient();

      expect(client1).toBe(client2);
    });
  });

  describe("refreshRates", () => {
    it("should fetch rates from Frankfurter and store in Redis", async () => {
      const mockResponse = {
        base: "USD",
        date: "2024-01-15",
        rates: { EUR: 0.85, GBP: 0.73 },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      mockSetex.mockResolvedValueOnce("OK");

      const result = await refreshRates();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/latest?base=USD",
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(mockSetex).toHaveBeenCalledWith(
        "fx:rates",
        172800, // 48 hours in seconds
        expect.stringContaining('"base":"USD"')
      );
      expect(result.base).toBe("USD");
      expect(result.date).toBe("2024-01-15");
      expect(result.rates).toEqual(mockResponse.rates);
      expect(result.updatedAt).toBeDefined();
    });

    it("should throw error when Frankfurter API fails", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(refreshRates()).rejects.toThrow(
        "Frankfurter API error: 500 Internal Server Error"
      );
    });

    it("should handle Redis storage failure gracefully", async () => {
      const mockResponse = {
        base: "USD",
        date: "2024-01-15",
        rates: { EUR: 0.85 },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      mockSetex.mockRejectedValueOnce(new Error("Redis error"));

      // Should not throw - storage failure is handled gracefully
      const result = await refreshRates();

      expect(result).toBeDefined();
      expect(result.base).toBe("USD");
    });
  });

  describe("getRates", () => {
    it("should return cached rates from Redis when available", async () => {
      mockGet.mockResolvedValueOnce(JSON.stringify(mockRates));

      const result = await getRates();

      expect(mockGet).toHaveBeenCalledWith("fx:rates");
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockRates);
    });

    it("should fetch fresh rates when cache is empty", async () => {
      mockGet.mockResolvedValueOnce(null);

      const mockResponse = {
        base: "USD",
        date: "2024-01-15",
        rates: { EUR: 0.85 },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      mockSetex.mockResolvedValueOnce("OK");

      const result = await getRates();

      expect(global.fetch).toHaveBeenCalled();
      expect(result.base).toBe("USD");
    });

    it("should fetch fresh rates when Redis returns null", async () => {
      mockGet.mockResolvedValueOnce(null);

      const mockResponse = {
        base: "USD",
        date: "2024-01-15",
        rates: { EUR: 0.85 },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      mockSetex.mockResolvedValueOnce("OK");

      const result = await getRates();

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should handle Redis errors gracefully and fetch fresh rates", async () => {
      mockGet.mockRejectedValueOnce(new Error("Redis connection error"));

      const mockResponse = {
        base: "USD",
        date: "2024-01-15",
        rates: { EUR: 0.85 },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      mockSetex.mockResolvedValueOnce("OK");

      const result = await getRates();

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("convert", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue(JSON.stringify(mockRates));
    });

    it("should return same amount when converting to same currency", async () => {
      const result = await convert(100, "USD", "USD");

      expect(result).toBe(100);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("should convert USD to EUR", async () => {
      const result = await convert(100, "USD", "EUR");

      expect(result).toBe(85); // 100 * 0.85
    });

    it("should convert EUR to USD", async () => {
      const result = await convert(100, "EUR", "USD");

      expect(result).toBeCloseTo(117.65, 2); // 100 / 0.85
    });

    it("should convert EUR to GBP (non-USD conversion)", async () => {
      const result = await convert(100, "EUR", "GBP");

      // EUR -> USD: 100 / 0.85 = 117.65 USD
      // USD -> GBP: 117.65 * 0.73 = 85.88 GBP
      expect(result).toBeCloseTo(85.88, 2);
    });

    it("should handle lowercase currency codes", async () => {
      const result = await convert(100, "eur", "gbp");

      expect(result).toBeCloseTo(85.88, 2);
    });

    it("should throw error when source currency not supported", async () => {
      await expect(convert(100, "XXX", "USD")).rejects.toThrow(
        "Currency XXX not supported"
      );
    });

    it("should throw error when target currency not supported", async () => {
      await expect(convert(100, "USD", "XXX")).rejects.toThrow(
        "Currency XXX not supported"
      );
    });

    it("should handle JPY conversion (high rate)", async () => {
      const result = await convert(1, "USD", "JPY");

      expect(result).toBe(110);
    });

    it("should handle JPY to USD conversion", async () => {
      const result = await convert(110, "JPY", "USD");

      expect(result).toBeCloseTo(1, 2);
    });
  });

  describe("hasRates", () => {
    it("should return true when rates are cached", async () => {
      mockGet.mockResolvedValueOnce(JSON.stringify(mockRates));

      const result = await hasRates();

      expect(result).toBe(true);
      expect(mockGet).toHaveBeenCalledWith("fx:rates");
    });

    it("should return false when cache is empty", async () => {
      mockGet.mockResolvedValueOnce(null);

      const result = await hasRates();

      expect(result).toBe(false);
    });

    it("should return false when Redis error occurs", async () => {
      mockGet.mockRejectedValueOnce(new Error("Redis error"));

      const result = await hasRates();

      expect(result).toBe(false);
    });
  });
});
