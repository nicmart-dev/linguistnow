import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { refreshAllTokens } from "./tokenRefreshController.js";

// Mock vaultClient
const mockListTokens = vi.fn();
const mockReadToken = vi.fn();
const mockWriteToken = vi.fn();

vi.mock("../utils/vaultClient.js", () => ({
  listTokens: () => mockListTokens() as Promise<string[]>,
  readToken: () =>
    mockReadToken() as Promise<{ accessToken: string; refreshToken: string }>,
  writeToken: () => mockWriteToken() as Promise<void>,
}));

// Mock google-auth-library OAuth2Client
const { mockRefreshAccessToken, MockOAuth2Client } = vi.hoisted(() => {
  const mockRefreshAccessToken = vi.fn();
  const mockSetCredentials = vi.fn();

  class MockOAuth2Client {
    setCredentials = mockSetCredentials;
    refreshAccessToken = mockRefreshAccessToken;
  }

  return { mockRefreshAccessToken, MockOAuth2Client };
});

vi.mock("google-auth-library", () => ({
  OAuth2Client: MockOAuth2Client,
}));

vi.mock("../env.js", () => ({
  env: {
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-secret",
    FRONTEND_URL: "http://localhost:3000",
  },
}));

describe("tokenRefreshController", () => {
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
    mockRequest = {
      body: {},
    };
  });

  describe("refreshAllTokens", () => {
    it("should refresh all tokens successfully", async () => {
      mockListTokens.mockResolvedValue(["user1@test.com", "user2@test.com"]);
      mockReadToken
        .mockResolvedValueOnce({
          accessToken: "old-access-1",
          refreshToken: "refresh-1",
        })
        .mockResolvedValueOnce({
          accessToken: "old-access-2",
          refreshToken: "refresh-2",
        });
      mockRefreshAccessToken
        .mockResolvedValueOnce({
          credentials: { access_token: "new-access-1" },
        })
        .mockResolvedValueOnce({
          credentials: { access_token: "new-access-2" },
        });
      mockWriteToken.mockResolvedValue(undefined);

      await refreshAllTokens(mockRequest as Request, mockResponse as Response);

      expect(mockListTokens).toHaveBeenCalled();
      expect(mockReadToken).toHaveBeenCalledTimes(2);
      expect(mockRefreshAccessToken).toHaveBeenCalledTimes(2);
      expect(mockWriteToken).toHaveBeenCalledTimes(2);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: 2,
        failures: [],
        totalProcessed: 2,
        timestamp: expect.any(String),
      });
    });

    it("should handle partial failures", async () => {
      mockListTokens.mockResolvedValue(["user1@test.com", "user2@test.com"]);
      mockReadToken
        .mockResolvedValueOnce({
          accessToken: "old-access-1",
          refreshToken: "refresh-1",
        })
        .mockResolvedValueOnce({
          accessToken: "old-access-2",
          refreshToken: "refresh-2",
        });
      mockRefreshAccessToken
        .mockResolvedValueOnce({
          credentials: { access_token: "new-access-1" },
        })
        .mockRejectedValueOnce(new Error("Invalid refresh token"));
      mockWriteToken.mockResolvedValue(undefined);

      await refreshAllTokens(mockRequest as Request, mockResponse as Response);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: 1,
        failures: [
          {
            userEmail: "user2@test.com",
            error: "Invalid refresh token",
            code: "UNKNOWN",
          },
        ],
        totalProcessed: 2,
        timestamp: expect.any(String),
      });
    });

    it("should handle empty token list", async () => {
      mockListTokens.mockResolvedValue([]);

      await refreshAllTokens(mockRequest as Request, mockResponse as Response);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: 0,
        failures: [],
        totalProcessed: 0,
        timestamp: expect.any(String),
      });
    });

    it("should handle Vault read errors", async () => {
      mockListTokens.mockResolvedValue(["user1@test.com"]);
      mockReadToken.mockRejectedValue(new Error("Vault read error"));

      await refreshAllTokens(mockRequest as Request, mockResponse as Response);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: 0,
        failures: [
          {
            userEmail: "user1@test.com",
            error: "Vault read error",
            code: "UNKNOWN",
          },
        ],
        totalProcessed: 1,
        timestamp: expect.any(String),
      });
    });
  });
});
