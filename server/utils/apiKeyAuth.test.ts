import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { apiKeyAuthMiddleware, isPrivateOrLoopbackIp } from "./apiKeyAuth.js";

describe("apiKeyAuth", () => {
  const originalEnv = process.env;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFn: NextFunction;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.INTERNAL_API_KEY;
    delete process.env.CURRENCY_REFRESH_API_KEY;

    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
    mockResponse = {
      status: statusSpy as unknown as Response["status"],
      json: jsonSpy as unknown as Response["json"],
    };
    nextFn = vi.fn();
    mockRequest = {
      headers: {},
      ip: "203.0.113.50",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isPrivateOrLoopbackIp", () => {
    it("should accept loopback and RFC 1918 private addresses", () => {
      expect(isPrivateOrLoopbackIp("127.0.0.1")).toBe(true);
      expect(isPrivateOrLoopbackIp("::1")).toBe(true);
      expect(isPrivateOrLoopbackIp("::ffff:127.0.0.1")).toBe(true);
      expect(isPrivateOrLoopbackIp("10.0.0.1")).toBe(true);
      expect(isPrivateOrLoopbackIp("192.168.1.10")).toBe(true);
      expect(isPrivateOrLoopbackIp("172.16.0.1")).toBe(true);
      expect(isPrivateOrLoopbackIp("172.31.255.254")).toBe(true);
      expect(isPrivateOrLoopbackIp("::ffff:172.18.0.5")).toBe(true);
    });

    it("should reject public IP addresses including non-RFC1918 172.x ranges", () => {
      expect(isPrivateOrLoopbackIp("")).toBe(false);
      expect(isPrivateOrLoopbackIp("8.8.8.8")).toBe(false);
      expect(isPrivateOrLoopbackIp("172.15.0.1")).toBe(false);
      expect(isPrivateOrLoopbackIp("172.32.0.1")).toBe(false);
      expect(isPrivateOrLoopbackIp("203.0.113.1")).toBe(false);
    });
  });

  describe("apiKeyAuthMiddleware", () => {
    it("should allow internal IP when no API key env var is configured", () => {
      mockRequest = { headers: {}, ip: "172.18.0.2" };
      apiKeyAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFn,
      );
      expect(nextFn).toHaveBeenCalledOnce();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it("should reject external IP when no API key env var is configured", () => {
      mockRequest = { headers: {}, ip: "203.0.113.50" };
      apiKeyAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFn,
      );
      expect(nextFn).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Unauthorized",
        message:
          "API key required. Set INTERNAL_API_KEY environment variable or use internal network.",
      });
    });

    it("should reject proxied external requests via X-Forwarded-For even if socket IP is internal", () => {
      mockRequest = {
        ip: "172.18.0.2",
        headers: {
          "x-forwarded-for": "203.0.113.50, 172.18.0.1",
        },
      };
      apiKeyAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFn,
      );
      expect(nextFn).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(401);
    });

    it("should allow valid INTERNAL_API_KEY from any IP", () => {
      process.env.INTERNAL_API_KEY = "super-secret-internal-key";
      mockRequest.headers = {
        "x-api-key": "super-secret-internal-key",
      };

      apiKeyAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFn,
      );
      expect(nextFn).toHaveBeenCalledOnce();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it("should fall back to CURRENCY_REFRESH_API_KEY when INTERNAL_API_KEY is not set", () => {
      process.env.CURRENCY_REFRESH_API_KEY = "legacy-refresh-key";
      mockRequest.headers = {
        "x-api-key": "legacy-refresh-key",
      };

      apiKeyAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFn,
      );
      expect(nextFn).toHaveBeenCalledOnce();
    });

    it("should reject invalid or missing X-API-Key when INTERNAL_API_KEY is configured", () => {
      process.env.INTERNAL_API_KEY = "super-secret-internal-key";
      mockRequest.headers = {
        "x-api-key": "wrong-key",
      };

      apiKeyAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFn,
      );
      expect(nextFn).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Unauthorized",
        message: "Invalid or missing API key",
      });
    });

    it("should safely reject multi-byte UTF-8 keys without throwing RangeError", () => {
      process.env.INTERNAL_API_KEY = "abcd";
      // 4 UTF-16 code units, but different UTF-8 byte length
      mockRequest.headers = {
        "x-api-key": "éééé",
      };

      expect(() => {
        apiKeyAuthMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          nextFn,
        );
      }).not.toThrow();
      expect(nextFn).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(401);
    });
  });
});
