import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import currencyRoutes from "./currencyRoutes.js";

// Mock currencyService
const mockRefreshRates = vi.fn();
const mockGetRates = vi.fn();
const mockConvert = vi.fn();
const mockHasRates = vi.fn();

vi.mock("../services/currencyService.js", () => ({
  refreshRates: (): Promise<unknown> => mockRefreshRates() as Promise<unknown>,
  getRates: (): Promise<unknown> => mockGetRates() as Promise<unknown>,
  convert: (amount: number, from: string, to: string): Promise<number> =>
    mockConvert(amount, from, to) as Promise<number>,
  hasRates: (): Promise<boolean> => mockHasRates() as Promise<boolean>,
}));

describe("currencyRoutes", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonSpy = vi.fn().mockReturnValue(mockResponse);
    statusSpy = vi.fn().mockReturnValue({
      json: jsonSpy,
      status: statusSpy,
    });

    mockResponse = {
      json: jsonSpy,
      status: statusSpy,
    };

    mockRequest = {
      query: {},
    };
  });

  describe("POST /refresh", () => {
    it("should return rates when refresh succeeds", async () => {
      const mockRates = {
        base: "USD",
        date: "2024-01-15",
        rates: { EUR: 0.85 },
        updatedAt: "2024-01-15T12:00:00.000Z",
      };

      mockRefreshRates.mockResolvedValueOnce(mockRates);

      // Find the refresh route handler
      const routes = currencyRoutes.stack;
      const refreshRoute = routes.find(
        (r: any) => r.route?.path === "/refresh" && r.route?.methods?.post,
      );

      expect(refreshRoute).toBeDefined();

      // Call the handler directly
      const handler = refreshRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(mockRefreshRates).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith(mockRates);
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it("should return 500 when refresh fails", async () => {
      const error = new Error("Frankfurter API error");
      mockRefreshRates.mockRejectedValueOnce(error);

      const routes = currencyRoutes.stack;
      const refreshRoute = routes.find(
        (r: any) => r.route?.path === "/refresh" && r.route?.methods?.post,
      );

      const handler = refreshRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Failed to refresh exchange rates",
        details: "Frankfurter API error",
      });
    });
  });

  describe("GET /rates", () => {
    it("should return rates when getRates succeeds", async () => {
      const mockRates = {
        base: "USD",
        date: "2024-01-15",
        rates: { EUR: 0.85 },
        updatedAt: "2024-01-15T12:00:00.000Z",
      };

      mockGetRates.mockResolvedValueOnce(mockRates);

      const routes = currencyRoutes.stack;
      const ratesRoute = routes.find(
        (r: any) => r.route?.path === "/rates" && r.route?.methods?.get,
      );

      const handler = ratesRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(mockGetRates).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith(mockRates);
    });

    it("should return 500 when getRates fails", async () => {
      const error = new Error("Redis error");
      mockGetRates.mockRejectedValueOnce(error);

      const routes = currencyRoutes.stack;
      const ratesRoute = routes.find(
        (r: any) => r.route?.path === "/rates" && r.route?.methods?.get,
      );

      const handler = ratesRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Failed to get exchange rates",
        details: "Redis error",
      });
    });
  });

  describe("GET /convert", () => {
    it("should convert currency successfully", async () => {
      mockRequest.query = {
        amount: "100",
        from: "USD",
        to: "EUR",
      };

      mockConvert.mockResolvedValueOnce(85);

      const routes = currencyRoutes.stack;
      const convertRoute = routes.find(
        (r: any) => r.route?.path === "/convert" && r.route?.methods?.get,
      );

      const handler = convertRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(mockConvert).toHaveBeenCalledWith(100, "USD", "EUR");
      expect(jsonSpy).toHaveBeenCalledWith({
        amount: 100,
        from: "USD",
        to: "EUR",
        converted: 85,
      });
    });

    it("should round converted amount to 2 decimal places", async () => {
      mockRequest.query = {
        amount: "100",
        from: "USD",
        to: "EUR",
      };

      mockConvert.mockResolvedValueOnce(85.123456);

      const routes = currencyRoutes.stack;
      const convertRoute = routes.find(
        (r: any) => r.route?.path === "/convert" && r.route?.methods?.get,
      );

      const handler = convertRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(jsonSpy).toHaveBeenCalledWith({
        amount: 100,
        from: "USD",
        to: "EUR",
        converted: 85.12,
      });
    });

    it("should handle lowercase currency codes", async () => {
      mockRequest.query = {
        amount: "100",
        from: "usd",
        to: "eur",
      };

      mockConvert.mockResolvedValueOnce(85);

      const routes = currencyRoutes.stack;
      const convertRoute = routes.find(
        (r: any) => r.route?.path === "/convert" && r.route?.methods?.get,
      );

      const handler = convertRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(mockConvert).toHaveBeenCalledWith(100, "USD", "EUR");
    });

    it("should return 400 for invalid amount", async () => {
      mockRequest.query = {
        amount: "invalid",
        from: "USD",
        to: "EUR",
      };

      const routes = currencyRoutes.stack;
      const convertRoute = routes.find(
        (r: any) => r.route?.path === "/convert" && r.route?.methods?.get,
      );

      const handler = convertRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Invalid amount parameter",
      });
      expect(mockConvert).not.toHaveBeenCalled();
    });

    it("should return 400 for negative amount", async () => {
      mockRequest.query = {
        amount: "-100",
        from: "USD",
        to: "EUR",
      };

      const routes = currencyRoutes.stack;
      const convertRoute = routes.find(
        (r: any) => r.route?.path === "/convert" && r.route?.methods?.get,
      );

      const handler = convertRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Invalid amount parameter",
      });
    });

    it("should return 400 for missing from parameter", async () => {
      mockRequest.query = {
        amount: "100",
        to: "EUR",
      };

      const routes = currencyRoutes.stack;
      const convertRoute = routes.find(
        (r: any) => r.route?.path === "/convert" && r.route?.methods?.get,
      );

      const handler = convertRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Invalid from parameter",
      });
    });

    it("should return 400 for missing to parameter", async () => {
      mockRequest.query = {
        amount: "100",
        from: "USD",
      };

      const routes = currencyRoutes.stack;
      const convertRoute = routes.find(
        (r: any) => r.route?.path === "/convert" && r.route?.methods?.get,
      );

      const handler = convertRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Invalid to parameter",
      });
    });

    it("should return 500 when conversion fails", async () => {
      mockRequest.query = {
        amount: "100",
        from: "USD",
        to: "EUR",
      };

      const error = new Error("Currency XXX not supported");
      mockConvert.mockRejectedValueOnce(error);

      const routes = currencyRoutes.stack;
      const convertRoute = routes.find(
        (r: any) => r.route?.path === "/convert" && r.route?.methods?.get,
      );

      const handler = convertRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Failed to convert currency",
        details: "Currency XXX not supported",
      });
    });
  });

  describe("GET /check", () => {
    it("should return true when rates are cached", async () => {
      mockHasRates.mockResolvedValueOnce(true);

      const routes = currencyRoutes.stack;
      const checkRoute = routes.find(
        (r: any) => r.route?.path === "/check" && r.route?.methods?.get,
      );

      const handler = checkRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(mockHasRates).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith({ hasRates: true });
    });

    it("should return false when rates are not cached", async () => {
      mockHasRates.mockResolvedValueOnce(false);

      const routes = currencyRoutes.stack;
      const checkRoute = routes.find(
        (r: any) => r.route?.path === "/check" && r.route?.methods?.get,
      );

      const handler = checkRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(jsonSpy).toHaveBeenCalledWith({ hasRates: false });
    });

    it("should return 500 when check fails", async () => {
      const error = new Error("Redis error");
      mockHasRates.mockRejectedValueOnce(error);

      const routes = currencyRoutes.stack;
      const checkRoute = routes.find(
        (r: any) => r.route?.path === "/check" && r.route?.methods?.get,
      );

      const handler = checkRoute.route.stack[0].handle;
      await handler(mockRequest, mockResponse);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Failed to check rates",
        details: "Redis error",
      });
    });
  });
});
