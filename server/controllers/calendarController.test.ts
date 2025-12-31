import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import axios from "axios";
import {
  checkAvailability,
  isUserFree,
  listCalendars,
} from "./calendarController";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

// Mock vaultClient
const mockReadToken = vi.fn<
  [string],
  Promise<{ accessToken: string; refreshToken: string }>
>();
vi.mock("../utils/vaultClient.js", () => ({
  readToken: (
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> =>
    mockReadToken(email),
}));

// Mock googleCalendarClient
const mockGetFreeBusy = vi.fn<
  Parameters<typeof import("../services/googleCalendarClient.js").getFreeBusy>,
  ReturnType<typeof import("../services/googleCalendarClient.js").getFreeBusy>
>();
vi.mock("../services/googleCalendarClient.js", () => ({
  getFreeBusy: (
    ...args: Parameters<
      typeof import("../services/googleCalendarClient.js").getFreeBusy
    >
  ) => mockGetFreeBusy(...args),
  GoogleCalendarError: class GoogleCalendarError extends Error {
    code: string;
    statusCode?: number;
    constructor(message: string, code: string, statusCode?: number) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
    }
  },
}));

describe("calendarController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonSpy = vi.fn();
    statusSpy = vi.fn(() => ({ json: jsonSpy }));
    mockResponse = {
      json: jsonSpy,
      status: statusSpy,
    };
  });

  describe("checkAvailability", () => {
    it("should check availability using Vault token and Google Calendar API", async () => {
      mockRequest = {
        body: {
          calendarIds: ["cal1@group.calendar.google.com"],
          userEmail: "user@example.com",
          startDate: "2024-01-15T00:00:00Z",
          endDate: "2024-01-19T23:59:59Z",
          timezone: "UTC",
          workingHoursStart: 8,
          workingHoursEnd: 18,
          minHoursPerDay: 8,
          excludeWeekends: true,
        },
      };
      const mockTokens = {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      };
      mockReadToken.mockResolvedValue(mockTokens);
      mockGetFreeBusy.mockResolvedValue([]); // No busy slots

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(mockReadToken).toHaveBeenCalledWith("user@example.com");
      expect(mockGetFreeBusy).toHaveBeenCalledWith(
        "mock-access-token",
        ["cal1@group.calendar.google.com"],
        "2024-01-15T00:00:00Z",
        "2024-01-19T23:59:59Z",
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: true,
          workingDays: 5,
        }),
      );
    });

    it("should require userEmail", async () => {
      mockRequest = {
        body: {
          calendarIds: ["cal1@group.calendar.google.com"],
        },
      };

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "userEmail is required",
        code: "VALIDATION_ERROR",
      });
    });

    it("should require calendarIds", async () => {
      mockRequest = {
        body: {
          userEmail: "user@example.com",
          calendarIds: [],
        },
      };

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "calendarIds array is required",
        code: "VALIDATION_ERROR",
      });
    });

    it("should return 404 when token is not found in Vault", async () => {
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };
      mockReadToken.mockResolvedValue({
        accessToken: null as unknown as string,
        refreshToken: null as unknown as string,
      });

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "No access token found for user",
        details: "User needs to login again to authorize calendar access.",
        code: "TOKEN_NOT_FOUND",
      });
    });

    it("should return 404 when Vault returns 404 (path not found)", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };
      // Simulate Vault 404 error (path not found)
      const vault404Error = Object.assign(new Error("Status 404"), {
        response: { statusCode: 404, body: { errors: [] } },
      });
      mockReadToken.mockRejectedValue(vault404Error);

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "No access token found for user",
        details: "User needs to login again to authorize calendar access.",
        code: "TOKEN_NOT_FOUND",
      });
      consoleErrorSpy.mockRestore();
    });

    it("should return 503 when Vault returns 403 (permission denied)", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };
      // Simulate Vault 403 error (permission denied/invalid token)
      const vault403Error = Object.assign(new Error("permission denied"), {
        response: { statusCode: 403, body: { errors: ["permission denied"] } },
      });
      mockReadToken.mockRejectedValue(vault403Error);

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(503);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Cannot read token from Vault",
        details:
          "Vault token may be expired or invalid. Check VAULT_TOKEN environment variable.",
        code: "VAULT_PERMISSION_DENIED",
      });
      consoleErrorSpy.mockRestore();
    });

    it("should handle calendarIds as comma-separated string", async () => {
      mockRequest = {
        body: {
          calendarIds:
            "cal1@group.calendar.google.com, cal2@group.calendar.google.com",
          userEmail: "user@example.com",
          startDate: "2024-01-15T00:00:00Z",
          endDate: "2024-01-15T23:59:59Z",
          timezone: "UTC",
        },
      };
      mockReadToken.mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      });
      mockGetFreeBusy.mockResolvedValue([]);

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      // Verify getFreeBusy was called with array parsed from string
      expect(mockGetFreeBusy).toHaveBeenCalledWith(
        "mock-access-token",
        ["cal1@group.calendar.google.com", "cal2@group.calendar.google.com"],
        "2024-01-15T00:00:00Z",
        "2024-01-15T23:59:59Z",
      );
    });

    it("should return isAvailable=false when user has busy slots", async () => {
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
          startDate: "2024-01-15T00:00:00Z",
          endDate: "2024-01-15T23:59:59Z",
          timezone: "UTC",
          workingHoursStart: 8,
          workingHoursEnd: 18,
          minHoursPerDay: 8,
          excludeWeekends: true,
        },
      };
      mockReadToken.mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      });
      // 6 hours of busy slots (only 4 hours free)
      mockGetFreeBusy.mockResolvedValue([
        { start: "2024-01-15T08:00:00Z", end: "2024-01-15T14:00:00Z" },
      ]);

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: false,
        }),
      );
    });

    it("should handle Vault errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };
      mockReadToken.mockRejectedValue(new Error("Vault connection failed"));

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(503);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Cannot read token from Vault",
        details: "Vault service may be unavailable.",
        code: "VAULT_ERROR",
      });
      consoleErrorSpy.mockRestore();
    });

    it("should use default values when options not provided", async () => {
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
          // No other options - should use defaults
        },
      };
      mockReadToken.mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      });
      mockGetFreeBusy.mockResolvedValue([]);

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: expect.any(Boolean),
          freeSlots: expect.any(Array),
          totalFreeHours: expect.any(Number),
          workingDays: expect.any(Number),
          hoursPerDay: expect.any(Object),
        }),
      );
    });
  });

  describe("isUserFree (deprecated)", () => {
    it("should forward to checkAvailability", async () => {
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
          startDate: "2024-01-15T00:00:00Z",
          endDate: "2024-01-15T23:59:59Z",
          timezone: "UTC",
        },
      };
      mockReadToken.mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      });
      mockGetFreeBusy.mockResolvedValue([]);

      await isUserFree(mockRequest as Request, mockResponse as Response);

      // Should use the same flow as checkAvailability
      expect(mockReadToken).toHaveBeenCalled();
      expect(mockGetFreeBusy).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(200);
    });
  });

  describe("listCalendars", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should fetch calendar list from Google using token from Vault", async () => {
      mockRequest = {
        params: { userEmail: "user@example.com" },
      };
      const mockTokens = {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      };
      const mockCalendars = {
        items: [
          { id: "primary", summary: "My Calendar" },
          { id: "work@group.calendar.google.com", summary: "Work" },
        ],
      };
      mockReadToken.mockResolvedValue(mockTokens);
      mockedAxios.get.mockResolvedValue({ data: mockCalendars });

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(mockReadToken).toHaveBeenCalledWith("user@example.com");
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        {
          headers: { Authorization: "Bearer mock-access-token" },
          timeout: 10000,
        },
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        calendars: mockCalendars.items,
      });
    });

    it("should return 400 when userEmail is missing", async () => {
      mockRequest = {
        params: { userEmail: "" },
      };

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "userEmail parameter is required",
      });
    });

    it("should return 404 when token is not found in Vault", async () => {
      mockRequest = {
        params: { userEmail: "user@example.com" },
      };
      mockReadToken.mockResolvedValue({
        accessToken: null as unknown as string,
        refreshToken: null as unknown as string,
      });

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "No access token found for user",
        details: "User needs to login again to authorize calendar access.",
        code: "TOKEN_NOT_FOUND",
      });
    });

    it("should handle expired/invalid access token from Google", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        params: { userEmail: "user@example.com" },
      };
      mockReadToken.mockResolvedValue({
        accessToken: "expired-token",
        refreshToken: "refresh-token",
      });
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: {
            error: { message: "Invalid Credentials" },
          },
        },
      });

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Access token expired or invalid",
        details: "Invalid Credentials",
        code: "TOKEN_EXPIRED",
      });
      consoleErrorSpy.mockRestore();
    });

    it("should handle Google API errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        params: { userEmail: "user@example.com" },
      };
      mockReadToken.mockResolvedValue({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
      });
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 403,
          data: {
            error: { message: "Calendar API not enabled" },
          },
        },
      });

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Google Calendar API error",
        details: "Calendar API not enabled",
        code: "GOOGLE_API_ERROR",
      });
      consoleErrorSpy.mockRestore();
    });

    it("should handle Vault errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        params: { userEmail: "user@example.com" },
      };
      mockReadToken.mockRejectedValue(new Error("Vault connection failed"));

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(503);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Cannot read token from Vault",
        details: "Vault service may be unavailable.",
        code: "VAULT_ERROR",
      });
      consoleErrorSpy.mockRestore();
    });

    it("should handle empty calendar list", async () => {
      mockRequest = {
        params: { userEmail: "user@example.com" },
      };
      mockReadToken.mockResolvedValue({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
      });
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({ calendars: [] });
    });

    it("should handle missing items in response", async () => {
      mockRequest = {
        params: { userEmail: "user@example.com" },
      };
      mockReadToken.mockResolvedValue({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
      });
      mockedAxios.get.mockResolvedValue({ data: {} });

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({ calendars: [] });
    });
  });
});
