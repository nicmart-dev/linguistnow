import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import type {
  exchangeCodeForToken as ExchangeCodeForTokenType,
  getUserInfo as GetUserInfoType,
  refreshAccessToken as RefreshAccessTokenType,
} from "./authController";

// Store mock functions at module level for access in tests
let mockGetToken: ReturnType<typeof vi.fn>;
let mockSetCredentials: ReturnType<typeof vi.fn>;
let mockOAuthRequest: ReturnType<typeof vi.fn>;
let mockRefreshAccessToken: ReturnType<typeof vi.fn>;
let exchangeCodeForToken: typeof ExchangeCodeForTokenType;
let getUserInfo: typeof GetUserInfoType;
let refreshAccessToken: typeof RefreshAccessTokenType;

describe("authController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    // Create mock functions
    mockGetToken = vi.fn();
    mockSetCredentials = vi.fn();
    mockOAuthRequest = vi.fn();
    mockRefreshAccessToken = vi.fn();

    // Mock the modules before importing
    vi.doMock("google-auth-library", () => ({
      OAuth2Client: class {
        getToken = mockGetToken;
        setCredentials = mockSetCredentials;
        request = mockOAuthRequest;
        refreshAccessToken = mockRefreshAccessToken;
      },
    }));

    vi.doMock("../env.js", () => ({
      env: {
        GOOGLE_CLIENT_ID: "test-client-id",
        GOOGLE_CLIENT_SECRET: "test-secret",
        FRONTEND_URL: "http://localhost:3000",
      },
    }));

    // Dynamic import after mocks are set up
    const authController = await import("./authController");
    exchangeCodeForToken = authController.exchangeCodeForToken;
    getUserInfo = authController.getUserInfo;
    refreshAccessToken = authController.refreshAccessToken;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    jsonSpy = vi.fn();
    statusSpy = vi.fn(() => ({ json: jsonSpy }));
    mockResponse = {
      json: jsonSpy,
      status: statusSpy,
    };
  });

  describe("exchangeCodeForToken", () => {
    it("should exchange code for tokens successfully", async () => {
      mockRequest = {
        body: { code: "auth-code" },
      };
      mockGetToken.mockResolvedValue({
        tokens: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      });

      await exchangeCodeForToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockGetToken).toHaveBeenCalledWith({
        code: "auth-code",
        redirect_uri: "http://localhost:3000",
      });
      expect(mockSetCredentials).toHaveBeenCalledWith({
        refresh_token: "refresh-token",
      });
      expect(jsonSpy).toHaveBeenCalledWith({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });

    it("should handle errors during token exchange", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: { code: "invalid-code" },
      };
      mockGetToken.mockRejectedValue(new Error("Invalid code"));

      await exchangeCodeForToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Failed to exchange code for token",
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe("getUserInfo", () => {
    it("should fetch user info successfully", async () => {
      mockRequest = {
        body: { accessToken: "access-token" },
      };
      mockOAuthRequest.mockResolvedValue({
        data: {
          emailAddresses: [{ value: "user@example.com" }],
          names: [{ displayName: "John Doe" }],
          photos: [{ url: "https://example.com/photo.jpg" }],
        },
      });

      await getUserInfo(mockRequest as Request, mockResponse as Response);

      expect(mockSetCredentials).toHaveBeenCalledWith({
        access_token: "access-token",
      });
      expect(mockOAuthRequest).toHaveBeenCalledWith({
        url: "https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos",
      });
      expect(jsonSpy).toHaveBeenCalledWith({
        userInfo: {
          email: "user@example.com",
          name: "John Doe",
          picture: "https://example.com/photo.jpg",
        },
      });
    });

    it("should handle missing user data gracefully", async () => {
      mockRequest = {
        body: { accessToken: "access-token" },
      };
      mockOAuthRequest.mockResolvedValue({
        data: {},
      });

      await getUserInfo(mockRequest as Request, mockResponse as Response);

      expect(jsonSpy).toHaveBeenCalledWith({
        userInfo: {
          email: "",
          name: "",
          picture: "",
        },
      });
    });

    it("should handle errors during user info fetch", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: { accessToken: "invalid-token" },
      };
      mockOAuthRequest.mockRejectedValue(new Error("Invalid token"));

      await getUserInfo(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Failed to fetch user info",
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh access token successfully", async () => {
      mockRequest = {
        body: { refreshToken: "refresh-token" },
      };
      mockRefreshAccessToken.mockResolvedValue({
        credentials: {
          access_token: "new-access-token",
        },
      });

      await refreshAccessToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockSetCredentials).toHaveBeenCalledWith({
        refresh_token: "refresh-token",
      });
      expect(mockRefreshAccessToken).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith({
        accessToken: "new-access-token",
      });
    });

    it("should return 400 when refresh token is missing", async () => {
      mockRequest = {
        body: {},
      };

      await refreshAccessToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Refresh token is required",
      });
    });

    it("should return 500 when access token is missing", async () => {
      mockRequest = {
        body: { refreshToken: "refresh-token" },
      };
      mockRefreshAccessToken.mockResolvedValue({
        credentials: {},
      });

      await refreshAccessToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Failed to refresh access token",
      });
    });

    it("should handle invalid_grant error", async () => {
      mockRequest = {
        body: { refreshToken: "invalid-token" },
      };
      mockRefreshAccessToken.mockRejectedValue({
        response: {
          data: {
            error: "invalid_grant",
            error_description: "Token expired",
          },
        },
      });

      await refreshAccessToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Refresh token is invalid or expired",
        details:
          "The refresh token has been revoked or is no longer valid. User needs to re-authenticate.",
        code: "INVALID_REFRESH_TOKEN",
      });
    });

    it("should handle other OAuth errors", async () => {
      mockRequest = {
        body: { refreshToken: "token" },
      };
      mockRefreshAccessToken.mockRejectedValue({
        response: {
          data: {
            error: "server_error",
            error_description: "Server error",
            status: 500,
          },
        },
      });

      await refreshAccessToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Failed to refresh access token",
        details: "Server error",
      });
    });

    it("should handle unknown errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: { refreshToken: "token" },
      };
      mockRefreshAccessToken.mockRejectedValue(new Error("Network error"));

      await refreshAccessToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "Failed to refresh access token",
        details: "Network error",
      });
      consoleErrorSpy.mockRestore();
    });
  });
});
