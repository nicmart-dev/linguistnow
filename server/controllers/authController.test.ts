import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import type {
  exchangeCodeForToken as ExchangeCodeForTokenType,
  getUserInfo as GetUserInfoType,
} from "./authController";

// Store mock functions at module level for access in tests
let mockGetToken: ReturnType<typeof vi.fn>;
let mockSetCredentials: ReturnType<typeof vi.fn>;
let mockOAuthRequest: ReturnType<typeof vi.fn>;
let mockWriteToken: ReturnType<typeof vi.fn>;
let mockReadToken: ReturnType<typeof vi.fn>;
let exchangeCodeForToken: typeof ExchangeCodeForTokenType;
let getUserInfo: typeof GetUserInfoType;

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

    // Mock the modules before importing
    vi.doMock("google-auth-library", () => ({
      OAuth2Client: class {
        getToken = mockGetToken;
        setCredentials = mockSetCredentials;
        request = mockOAuthRequest;
      },
    }));

    vi.doMock("../env.js", () => ({
      env: {
        GOOGLE_CLIENT_ID: "test-client-id",
        GOOGLE_CLIENT_SECRET: "test-secret",
        FRONTEND_URL: "http://localhost:3000",
      },
    }));

    // Mock vaultClient
    mockWriteToken = vi.fn().mockResolvedValue(undefined);
    mockReadToken = vi.fn().mockResolvedValue({
      accessToken: "existing-access-token",
      refreshToken: "existing-refresh-token",
    });

    vi.doMock("../utils/vaultClient.js", () => ({
      writeToken: mockWriteToken,
      readToken: mockReadToken,
    }));

    // Dynamic import after mocks are set up
    const authController = await import("./authController");
    exchangeCodeForToken = authController.exchangeCodeForToken;
    getUserInfo = authController.getUserInfo;
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
    it("should exchange code for tokens successfully and write to Vault", async () => {
      mockRequest = {
        body: { code: "auth-code", userEmail: "user@example.com" },
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
      // Verify tokens are written to Vault
      expect(mockWriteToken).toHaveBeenCalledWith("user@example.com", {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      expect(jsonSpy).toHaveBeenCalledWith({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });

    it("should handle Vault write errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockRequest = {
        body: { code: "auth-code", userEmail: "user@example.com" },
      };
      mockGetToken.mockResolvedValue({
        tokens: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      });
      mockWriteToken.mockRejectedValue(new Error("Vault error"));

      await exchangeCodeForToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Should still return tokens even if Vault write fails
      expect(jsonSpy).toHaveBeenCalledWith({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      consoleErrorSpy.mockRestore();
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
});
