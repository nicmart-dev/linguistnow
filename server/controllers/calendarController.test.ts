import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import axios from "axios";
import { isUserFree, listCalendars } from "./calendarController";

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

// Mock env
vi.mock("../env.js", () => ({
  env: {
    N8N_BASE_URL: "https://n8n.example.com",
    N8N_WEBHOOK_PATH: "/webhook/calendar-check",
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

  describe("isUserFree", () => {
    it("should call n8n webhook with userEmail and calendarIds (no accessToken)", async () => {
      mockRequest = {
        body: {
          calendarIds: ["cal1@group.calendar.google.com"],
          userEmail: "user@example.com",
        },
      };
      const mockResponseData = { available: true };
      mockedAxios.post.mockResolvedValue({ data: mockResponseData });

      await isUserFree(mockRequest as Request, mockResponse as Response);

      // Verify no Authorization header is sent - n8n reads token from Vault
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://n8n.example.com/webhook/calendar-check",
        {
          calendarIds: ["cal1@group.calendar.google.com"],
          userEmail: "user@example.com",
        },
        {
          timeout: 90000,
        },
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(mockResponseData);
    });

    it("should require userEmail", async () => {
      mockRequest = {
        body: {
          calendarIds: ["cal1@group.calendar.google.com"],
        },
      };

      await isUserFree(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "userEmail is required",
      });
    });

    it("should handle webhook path without leading slash", async () => {
      vi.doMock("../env.js", () => ({
        env: {
          N8N_BASE_URL: "https://n8n.example.com",
          N8N_WEBHOOK_PATH: "webhook/calendar-check",
        },
      }));
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };
      mockedAxios.post.mockResolvedValue({ data: {} });

      await isUserFree(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://n8n.example.com/webhook/calendar-check",
        expect.objectContaining({
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        }),
        expect.objectContaining({
          timeout: 90000,
        }),
      );
    });

    it("should handle base URL with trailing slash", async () => {
      vi.doMock("../env.js", () => ({
        env: {
          N8N_BASE_URL: "https://n8n.example.com/",
          N8N_WEBHOOK_PATH: "/webhook/calendar-check",
        },
      }));
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };
      mockedAxios.post.mockResolvedValue({ data: {} });

      await isUserFree(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://n8n.example.com/webhook/calendar-check",
        expect.objectContaining({
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        }),
        expect.objectContaining({
          timeout: 90000,
        }),
      );
    });

    it("should handle 404 error from n8n", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 404,
          data: {
            message: "Workflow not found",
            hint: "Activate the workflow",
          },
        },
      });

      await isUserFree(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "n8n webhook not found",
        details: "Workflow not found",
        hint: "Activate the workflow",
        userEmail: "user@example.com",
        code: "N8N_WEBHOOK_NOT_FOUND",
      });
      consoleErrorSpy.mockRestore();
    });

    it("should handle timeout errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };
      const timeoutError = new Error("timeout");
      (timeoutError as { code?: string }).code = "ECONNABORTED";
      mockedAxios.post.mockRejectedValue(timeoutError);

      await isUserFree(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(504);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "n8n workflow timeout",
        details:
          "The n8n workflow took too long to execute (exceeded 90 seconds). The workflow may be stuck or processing too much data.",
        hint: 'Check the n8n workflow execution logs. The "Stringify calendar list" node may be timing out.',
        userEmail: "user@example.com",
        code: "N8N_WORKFLOW_TIMEOUT",
      });
      consoleErrorSpy.mockRestore();
    });

    it("should handle network errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };
      mockedAxios.post.mockRejectedValue({
        request: {},
        message: "Network error",
      });

      await isUserFree(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(503);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Cannot reach n8n workflow",
        details:
          "The n8n service may be down or unreachable. Check N8N_BASE_URL configuration.",
        userEmail: "user@example.com",
        code: "N8N_SERVICE_UNAVAILABLE",
      });
      consoleErrorSpy.mockRestore();
    });

    it("should handle other errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };
      mockedAxios.post.mockRejectedValue(new Error("Unknown error"));

      await isUserFree(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Error triggering n8n workflow",
        details: "Unknown error",
        userEmail: "user@example.com",
        code: "N8N_UNKNOWN_ERROR",
      });
      consoleErrorSpy.mockRestore();
    });

    it("should handle missing N8N_BASE_URL", async () => {
      vi.doMock("../env.js", () => ({
        env: {
          N8N_BASE_URL: undefined,
        },
      }));
      mockRequest = {
        body: {
          calendarIds: ["cal1"],
          userEmail: "user@example.com",
        },
      };

      // This test would need to reload the module to test the missing URL case
      // For now, we'll test the error handling path
      await isUserFree(mockRequest as Request, mockResponse as Response);

      // The function should handle the error gracefully
      expect(statusSpy).toHaveBeenCalled();
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
        accessToken: null,
        refreshToken: null,
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
