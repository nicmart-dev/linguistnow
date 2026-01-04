import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { getValidAccessToken, withAutoRefresh } from "./tokenRefresh.js";
import * as vaultClient from "./vaultClient.js";

// Mock dependencies
vi.mock("./vaultClient.js");
vi.mock("axios");
vi.mock("../env.js", () => ({
  env: {
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
    FRONTEND_URL: "http://localhost:3000",
  },
}));

// Mock OAuth2Client as a class - always return the same instance
let mockOAuth2Instance: {
  setCredentials: ReturnType<typeof vi.fn>;
  refreshAccessToken: ReturnType<typeof vi.fn>;
};

vi.mock("google-auth-library", () => {
  // Create the mock instance inside the factory
  const instance = {
    setCredentials: vi.fn(),
    refreshAccessToken: vi.fn(),
  };
  // Store it in a way we can access it
  (globalThis as any).__mockOAuth2Instance = instance;
  // Return a constructor function that returns the instance
  return {
    OAuth2Client: function () {
      return instance;
    },
  };
});

describe("tokenRefresh utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Get the instance from the global (set by the mock)
    mockOAuth2Instance = (globalThis as any).__mockOAuth2Instance;
    // Reset mock methods
    mockOAuth2Instance.setCredentials = vi.fn();
    mockOAuth2Instance.refreshAccessToken = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getValidAccessToken", () => {
    it("should return valid access token when token is still valid", async () => {
      const mockTokens = {
        accessToken: "valid-access-token",
        refreshToken: "refresh-token",
      };

      vi.mocked(vaultClient.readToken).mockResolvedValue(mockTokens);
      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: { expires_in: 3600 },
      });

      const result = await getValidAccessToken("user@example.com");

      expect(result).toBe("valid-access-token");
      expect(vaultClient.readToken).toHaveBeenCalledWith("user@example.com");
      expect(vaultClient.writeToken).not.toHaveBeenCalled();
    });

    it("should refresh token when access token is expired", async () => {
      const mockTokens = {
        accessToken: "expired-access-token",
        refreshToken: "refresh-token",
      };

      mockOAuth2Instance.refreshAccessToken = vi.fn().mockResolvedValue({
        credentials: {
          access_token: "new-access-token",
        },
      });

      vi.mocked(vaultClient.readToken).mockResolvedValue(mockTokens);
      vi.mocked(axios.get).mockResolvedValue({
        status: 401,
      });
      vi.mocked(vaultClient.writeToken).mockResolvedValue(undefined);

      const result = await getValidAccessToken("user@example.com");

      expect(result).toBe("new-access-token");
      expect(vaultClient.writeToken).toHaveBeenCalledWith("user@example.com", {
        accessToken: "new-access-token",
        refreshToken: "refresh-token",
      });
    });

    it("should throw error when no access token found", async () => {
      vi.mocked(vaultClient.readToken).mockResolvedValue({
        accessToken: undefined,
        refreshToken: "refresh-token",
      });

      await expect(getValidAccessToken("user@example.com")).rejects.toThrow(
        "No access token found for user",
      );
    });

    it("should throw error when no refresh token found", async () => {
      vi.mocked(vaultClient.readToken).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: undefined,
      });

      await expect(getValidAccessToken("user@example.com")).rejects.toThrow(
        "No refresh token found for user",
      );
    });

    it("should throw error when refresh token is invalid", async () => {
      const mockTokens = {
        accessToken: "expired-access-token",
        refreshToken: "invalid-refresh-token",
      };

      mockOAuth2Instance.refreshAccessToken = vi.fn().mockRejectedValue({
        response: {
          data: {
            error: "invalid_grant",
          },
        },
      });

      vi.mocked(vaultClient.readToken).mockResolvedValue(mockTokens);
      vi.mocked(axios.get).mockResolvedValue({
        status: 401,
      });

      await expect(getValidAccessToken("user@example.com")).rejects.toThrow(
        "Failed to refresh access token",
      );
    });
  });

  describe("withAutoRefresh", () => {
    it("should execute function with valid token", async () => {
      const mockTokens = {
        accessToken: "valid-access-token",
        refreshToken: "refresh-token",
      };

      const mockFn = vi.fn().mockResolvedValue("result");

      vi.mocked(vaultClient.readToken).mockResolvedValue(mockTokens);
      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: { expires_in: 3600 },
      });

      const result = await withAutoRefresh("user@example.com", mockFn);

      expect(result).toBe("result");
      expect(mockFn).toHaveBeenCalledWith("valid-access-token");
    });

    it("should refresh and retry when token expires during API call", async () => {
      const mockTokens = {
        accessToken: "expired-access-token",
        refreshToken: "refresh-token",
      };

      mockOAuth2Instance.refreshAccessToken = vi.fn().mockResolvedValue({
        credentials: {
          access_token: "new-access-token",
        },
      });

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({
          code: "TOKEN_EXPIRED",
        })
        .mockResolvedValueOnce("result");

      vi.mocked(vaultClient.readToken)
        .mockResolvedValueOnce(mockTokens) // First call in getValidAccessToken
        .mockResolvedValueOnce(mockTokens); // Second call in withAutoRefresh catch block
      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: { expires_in: 3600 },
      });

      vi.mocked(vaultClient.writeToken).mockResolvedValue(undefined);

      const result = await withAutoRefresh("user@example.com", mockFn);

      expect(result).toBe("result");
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenNthCalledWith(1, "expired-access-token");
      expect(mockFn).toHaveBeenNthCalledWith(2, "new-access-token");
    });

    it("should refresh and retry on 401 error", async () => {
      const mockTokens = {
        accessToken: "expired-access-token",
        refreshToken: "refresh-token",
      };

      mockOAuth2Instance.refreshAccessToken = vi.fn().mockResolvedValue({
        credentials: {
          access_token: "new-access-token",
        },
      });

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({
          response: {
            status: 401,
          },
        })
        .mockResolvedValueOnce("result");

      vi.mocked(vaultClient.readToken)
        .mockResolvedValueOnce(mockTokens)
        .mockResolvedValueOnce(mockTokens);
      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: { expires_in: 3600 },
      });

      vi.mocked(vaultClient.writeToken).mockResolvedValue(undefined);

      const result = await withAutoRefresh("user@example.com", mockFn);

      expect(result).toBe("result");
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should throw error if refresh fails after token expiration", async () => {
      const mockTokens = {
        accessToken: "expired-access-token",
        refreshToken: "invalid-refresh-token",
      };

      mockOAuth2Instance.refreshAccessToken = vi.fn().mockRejectedValue({
        response: {
          data: {
            error: "invalid_grant",
          },
        },
      });

      const mockFn = vi.fn().mockRejectedValue({
        code: "TOKEN_EXPIRED",
      });

      vi.mocked(vaultClient.readToken)
        .mockResolvedValueOnce(mockTokens)
        .mockResolvedValueOnce(mockTokens);
      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: { expires_in: 3600 },
      });

      await expect(withAutoRefresh("user@example.com", mockFn)).rejects.toThrow(
        "Failed to refresh token after expiration",
      );
    });

    it("should rethrow non-token-expiration errors", async () => {
      const mockTokens = {
        accessToken: "valid-access-token",
        refreshToken: "refresh-token",
      };

      const mockFn = vi.fn().mockRejectedValue(new Error("Network error"));

      vi.mocked(vaultClient.readToken).mockResolvedValue(mockTokens);
      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: { expires_in: 3600 },
      });

      await expect(withAutoRefresh("user@example.com", mockFn)).rejects.toThrow(
        "Network error",
      );
    });
  });
});
