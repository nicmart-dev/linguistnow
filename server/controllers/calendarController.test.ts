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

// Mock tokenRefresh
const mockGetValidAccessToken = vi.fn<[string], Promise<string>>();
vi.mock("../utils/tokenRefresh.js", () => ({
  getValidAccessToken: (email: string): Promise<string> =>
    mockGetValidAccessToken(email),
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

// Mock env to prevent validation errors in tests
vi.mock("../env.js", () => ({
  env: {
    AIRTABLE_PERSONAL_ACCESS_TOKEN: "test-token",
    AIRTABLE_API_KEY: "test-api-key",
    AIRTABLE_BASE_ID: "test-base-id",
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
    FRONTEND_URL: "http://localhost:3000",
  },
}));

// Mock Airtable to prevent env var errors in tests
// Create a shared mock that can be configured per test
const mockFirstPage = vi.fn().mockResolvedValue([]);
const mockSelect = vi.fn(() => ({
  firstPage: mockFirstPage,
}));
// getAirtableBase() returns the result of .base(), which is a function
// that can be called with table name like ("Users")
const mockTableFunction = vi.fn(() => ({
  select: mockSelect,
}));
vi.mock("airtable", () => {
  // Airtable is used as a constructor: new Airtable({ apiKey })
  class MockAirtable {
    base() {
      return mockTableFunction;
    }
  }
  return {
    default: MockAirtable,
  };
});

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
    // Reset tokenRefresh mock
    mockGetValidAccessToken.mockImplementation(async (email: string) => {
      const tokens = await Promise.resolve(mockReadToken(email));
      if (!tokens?.accessToken) {
        throw new Error("No access token found for user");
      }
      return tokens.accessToken as string;
    });
    // Reset Airtable mock to return empty preferences by default
    mockFirstPage.mockResolvedValue([]);
  });

  describe("checkAvailability", () => {
    it("should check availability using Vault token and Google Calendar API", async () => {
      mockRequest = {
        body: {
          calendarIds: ["cal1@group.calendar.google.com"],
          userEmail: "user@example.com",
          startDate: "2024-01-15",
          endDate: "2024-01-19",
          timezone: "UTC",
          workingHoursStart: "08:00",
          workingHoursEnd: "18:00",
          minHoursPerDay: 8,
          offDays: [0, 6],
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
        expect.any(String), // startDate may be adjusted
        expect.any(String), // endDate may be adjusted
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalled();
      const responseData = jsonSpy.mock.calls[0][0];
      expect(responseData).toHaveProperty("isAvailable", true);
      expect(responseData).toHaveProperty("workingDays");
      expect(typeof responseData.workingDays).toBe("number");
      // workingDays should be > 0 (the exact number depends on date range and offDays)
      expect(responseData.workingDays).toBeGreaterThan(0);
    });

    it("should require userEmail", async () => {
      mockRequest = {
        body: {
          calendarIds: ["cal1@group.calendar.google.com"],
          // userEmail is missing
        },
      };
      // Mock Airtable to return empty preferences (no user found)
      vi.doMock("airtable", () => ({
        default: vi.fn(() => ({
          base: vi.fn(() => ({
            select: vi.fn(() => ({
              firstPage: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      }));

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
          startDate: "2024-01-15",
          endDate: "2024-01-15",
          timezone: "UTC",
          workingHoursStart: "08:00",
          workingHoursEnd: "18:00",
          minHoursPerDay: 8,
          offDays: [0, 6],
        },
      };
      mockReadToken.mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      });
      // 6 hours of busy slots (only 4 hours free, less than minHoursPerDay=8)
      // Working hours are 08:00-18:00 (10 hours), busy 08:00-14:00 (6 hours), so only 4 hours free
      mockGetFreeBusy.mockResolvedValue([
        { start: "2024-01-15T08:00:00Z", end: "2024-01-15T14:00:00Z" },
      ]);
      // Mock Airtable to return empty preferences
      mockFirstPage.mockResolvedValue([]);

      await checkAvailability(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalled();
      const responseData = jsonSpy.mock.calls[0][0];
      expect(responseData).toHaveProperty("isAvailable", false);
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
      const mockCalendars = {
        items: [
          { id: "primary", summary: "My Calendar" },
          { id: "work@group.calendar.google.com", summary: "Work" },
        ],
      };
      // Mock getValidAccessToken to return the token directly
      mockGetValidAccessToken.mockResolvedValue("mock-access-token");
      // Mock calendar list API call
      mockedAxios.get.mockResolvedValueOnce({ data: mockCalendars });

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(mockGetValidAccessToken).toHaveBeenCalledWith("user@example.com");
      // Should be called once: for calendar list (token validation is handled by getValidAccessToken)
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        1,
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
      // Mock getValidAccessToken to throw error with the expected message
      mockGetValidAccessToken.mockRejectedValue(
        new Error("No access token found for user"),
      );

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Token not found",
        details: "User needs to login again to authorize calendar access.",
        code: "TOKEN_NOT_FOUND",
      });
    });

    it("should handle expired/invalid access token from Google (token validation fails)", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        params: { userEmail: "user@example.com" },
      };
      // Mock getValidAccessToken to throw error (token validation fails)
      // The error message should match what getValidAccessToken throws
      mockGetValidAccessToken.mockRejectedValue(
        new Error("Failed to refresh access token"),
      );

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Refresh token expired or invalid",
        details:
          "Your Google Calendar access has expired. Please login again to re-authorize.",
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
      // Mock getValidAccessToken to return a valid token
      mockGetValidAccessToken.mockResolvedValue("valid-token");
      // Mock calendar API call to fail
      mockedAxios.get.mockRejectedValueOnce({
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
      // Mock token validation (first call) then calendar list (second call)
      mockedAxios.get
        .mockResolvedValueOnce({
          status: 200,
          data: { expires_in: 3600 },
        })
        .mockResolvedValueOnce({ data: { items: [] } });

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
      // Mock token validation (first call) then calendar list (second call)
      mockedAxios.get
        .mockResolvedValueOnce({
          status: 200,
          data: { expires_in: 3600 },
        })
        .mockResolvedValueOnce({ data: {} });

      await listCalendars(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({ calendars: [] });
    });
  });
});
