import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const mockSelect = vi.fn();
const mockAll = vi.fn();
const mockFirstPage = vi.fn();

vi.mock("airtable", () => ({
  default: class {
    base() {
      return () => ({
        select: mockSelect,
      });
    }
  },
}));

vi.mock("../env.js", () => ({
  env: {
    AIRTABLE_PERSONAL_ACCESS_TOKEN: "test-token",
    AIRTABLE_API_KEY: "",
    AIRTABLE_BASE_ID: "appTestBase",
  },
}));

const mockWithAutoRefresh = vi.fn();
vi.mock("../utils/tokenRefresh.js", () => ({
  withAutoRefresh: (...args: unknown[]): Promise<unknown> =>
    mockWithAutoRefresh(...args) as Promise<unknown>,
}));

const mockGetFreeBusy = vi.fn();
vi.mock("../services/googleCalendarClient.js", () => ({
  getFreeBusy: (...args: unknown[]): Promise<unknown> =>
    mockGetFreeBusy(...args) as Promise<unknown>,
}));

import {
  checkSetupStatus,
  isTokenExpiredOrMissingError,
  searchLinguists,
  getLinguistById,
} from "./linguistsController.js";

describe("linguistsController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({
      all: mockAll,
      firstPage: mockFirstPage,
    });
  });

  describe("checkSetupStatus", () => {
    it("returns isComplete: true when all required fields are present", () => {
      const status = checkSetupStatus({
        "Calendar IDs": "primary@example.com, work@example.com",
        Timezone: "America/Los_Angeles",
        "Working Hours Start": "09:00",
      });
      expect(status).toEqual({
        isComplete: true,
        missingItems: [],
      });
    });

    it("identifies missing calendars when Calendar IDs is empty or whitespace/commas", () => {
      expect(
        checkSetupStatus({
          "Calendar IDs": " , ",
          Timezone: "UTC",
          "Working Hours Start": "09:00",
        }),
      ).toEqual({
        isComplete: false,
        missingItems: ["calendars"],
      });
    });

    it("identifies all missing items when none are configured", () => {
      expect(checkSetupStatus({})).toEqual({
        isComplete: false,
        missingItems: ["calendars", "timezone", "working_hours"],
      });
    });
  });

  describe("isTokenExpiredOrMissingError", () => {
    it("returns true for invalid_grant error wrapped in cause chain", () => {
      const rootCause = new Error(
        "invalid_grant: Refresh token is invalid or expired",
      );
      const wrapped = new Error(`API call failed: ${rootCause.message}`, {
        cause: rootCause,
      });
      expect(isTokenExpiredOrMissingError(wrapped)).toBe(true);
    });

    it("returns true for missing access/refresh token errors", () => {
      expect(
        isTokenExpiredOrMissingError(
          new Error("API call failed: No access token found for user"),
        ),
      ).toBe(true);
      expect(
        isTokenExpiredOrMissingError(
          new Error("API call failed: No refresh token found for user"),
        ),
      ).toBe(true);
    });

    it("returns true for Vault 404 response in cause chain", () => {
      const vault404 = Object.assign(new Error("Status 404"), {
        response: { statusCode: 404 },
      });
      const wrapped = new Error("API call failed: Status 404", {
        cause: vault404,
      });
      expect(isTokenExpiredOrMissingError(wrapped)).toBe(true);
    });

    it("returns true for TOKEN_EXPIRED code", () => {
      const err = Object.assign(new Error("Access token expired"), {
        code: "TOKEN_EXPIRED",
      });
      expect(isTokenExpiredOrMissingError(err)).toBe(true);
    });

    it("returns false for unrelated network or Vault 503 errors", () => {
      const networkErr = new Error("connect ECONNREFUSED 127.0.0.1:8200");
      expect(isTokenExpiredOrMissingError(networkErr)).toBe(false);

      const vault503 = Object.assign(new Error("Vault sealed"), {
        response: { statusCode: 503 },
      });
      expect(isTokenExpiredOrMissingError(vault503)).toBe(false);

      const transientRefreshNetworkErr = new Error(
        "Failed to refresh access token: getaddrinfo EAI_AGAIN oauth2.googleapis.com",
        {
          cause: new Error("getaddrinfo EAI_AGAIN oauth2.googleapis.com"),
        },
      );
      expect(isTokenExpiredOrMissingError(transientRefreshNetworkErr)).toBe(
        false,
      );
    });
  });

  describe("searchLinguists - tokenExpired vs setup-incomplete", () => {
    it("marks setupStatus.tokenExpired = true when OAuth refresh token is expired, while keeping setup-incomplete separate", async () => {
      mockAll.mockResolvedValue([
        {
          id: "recExpired",
          fields: {
            Email: "expired@example.com",
            Name: "Expired Token Linguist",
            Role: "Linguist",
            "Calendar IDs": "expired@example.com",
            Timezone: "UTC",
            "Working Hours Start": "09:00",
            "Working Hours End": "17:00",
          },
        },
        {
          id: "recIncomplete",
          fields: {
            Email: "incomplete@example.com",
            Name: "Incomplete Setup Linguist",
            Role: "Linguist",
            Timezone: "UTC",
            "Working Hours Start": "09:00",
          },
        },
      ]);

      mockWithAutoRefresh.mockRejectedValueOnce(
        new Error(
          "API call failed: invalid_grant: Refresh token is invalid or expired",
        ),
      );

      const req = {
        query: {
          startDate: "2026-10-20",
          endDate: "2026-10-25",
        },
      } as unknown as Request;

      const jsonMock = vi.fn();
      const res = {
        status: vi.fn().mockReturnThis(),
        json: jsonMock,
      } as unknown as Response;

      await searchLinguists(req as never, res);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const payload = jsonMock.mock.calls[0][0];
      expect(payload.linguists).toHaveLength(2);

      const expiredLinguist = payload.linguists.find(
        (l: { id: string }) => l.id === "recExpired",
      );
      expect(expiredLinguist.setupStatus).toEqual({
        isComplete: true,
        missingItems: [],
        tokenExpired: true,
      });
      expect(expiredLinguist.availability).toBeNull();

      const incompleteLinguist = payload.linguists.find(
        (l: { id: string }) => l.id === "recIncomplete",
      );
      expect(incompleteLinguist.setupStatus).toEqual({
        isComplete: false,
        missingItems: ["calendars"],
      });
      expect(incompleteLinguist.availability).toBeNull();
    });
  });

  describe("getLinguistById - tokenExpired handling", () => {
    it("sets setupStatus.tokenExpired = true when token refresh fails", async () => {
      mockFirstPage.mockResolvedValue([
        {
          id: "recExpiredSingle",
          fields: {
            Email: "expired@example.com",
            Name: "Expired Single",
            Role: "Linguist",
            "Calendar IDs": "expired@example.com",
            Timezone: "UTC",
            "Working Hours Start": "09:00",
            "Working Hours End": "17:00",
          },
        },
      ]);

      mockWithAutoRefresh.mockRejectedValueOnce(
        new Error("API call failed: No refresh token found for user"),
      );

      const req = {
        params: { id: "expired@example.com" },
      } as unknown as Request<{ id: string }>;

      const jsonMock = vi.fn();
      const res = {
        status: vi.fn().mockReturnThis(),
        json: jsonMock,
      } as unknown as Response;

      await getLinguistById(req, res);

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const result = jsonMock.mock.calls[0][0];
      expect(result.setupStatus).toEqual({
        isComplete: true,
        missingItems: [],
        tokenExpired: true,
      });
      expect(result.availability).toBeNull();
    });
  });
});
