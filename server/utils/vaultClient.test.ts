import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mock functions using vi.hoisted to ensure they're available in the mock factory
const { mockWrite, mockRead, mockList, mockDelete, mockEnv } = vi.hoisted(
  () => {
    const mockWrite = vi.fn().mockResolvedValue({});
    const mockRead = vi.fn().mockResolvedValue({
      data: {
        data: {
          accessToken: "test-access-token",
          refreshToken: "test-refresh-token",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      },
    });
    const mockList = vi.fn().mockResolvedValue({
      data: { keys: ["user1@test.com", "user2@test.com"] },
    });
    const mockDelete = vi.fn().mockResolvedValue({});

    // Mock env values
    const mockEnv = {
      PORT: 5000,
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      AIRTABLE_BASE_ID: "test-base-id",
      AIRTABLE_PERSONAL_ACCESS_TOKEN: "test-airtable-token",
      VAULT_ADDR: "http://localhost:8200",
      VAULT_TOKEN: "test-vault-token",
      VAULT_SECRET_PATH: "secret/data/linguistnow/tokens",
    };

    return { mockWrite, mockRead, mockList, mockDelete, mockEnv };
  },
);

// Mock the env module before importing vaultClient
vi.mock("../env.js", () => ({
  env: mockEnv,
}));

// Mock node-vault before importing the module under test
vi.mock("node-vault", () => ({
  default: vi.fn(() => ({
    write: mockWrite,
    read: mockRead,
    list: mockList,
    delete: mockDelete,
  })),
}));

import {
  writeToken,
  readToken,
  listTokens,
  deleteToken,
} from "./vaultClient.js";

describe("vaultClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("writeToken", () => {
    it("should write tokens to Vault at correct path", async () => {
      await writeToken("user@test.com", {
        accessToken: "access-123",
        refreshToken: "refresh-456",
      });

      expect(mockWrite).toHaveBeenCalledWith(
        "secret/data/linguistnow/tokens/user@test.com",
        expect.objectContaining({
          data: expect.objectContaining({
            accessToken: "access-123",
            refreshToken: "refresh-456",
          }),
        }),
      );
    });

    it("should include updatedAt timestamp", async () => {
      await writeToken("user@test.com", {
        accessToken: "access-123",
        refreshToken: "refresh-456",
      });

      const callArgs = mockWrite.mock.calls[0] as [
        string,
        { data: { updatedAt: string } },
      ];
      expect(callArgs[1].data).toHaveProperty("updatedAt");
      expect(typeof callArgs[1].data.updatedAt).toBe("string");
    });
  });

  describe("readToken", () => {
    it("should read tokens from Vault", async () => {
      const tokens = await readToken("user@test.com");

      expect(mockRead).toHaveBeenCalledWith(
        "secret/data/linguistnow/tokens/user@test.com",
      );
      expect(tokens.accessToken).toBe("test-access-token");
      expect(tokens.refreshToken).toBe("test-refresh-token");
    });

    it("should handle Vault read errors", async () => {
      mockRead.mockRejectedValueOnce(new Error("Token not found"));

      await expect(readToken("nonexistent@test.com")).rejects.toThrow(
        "Token not found",
      );
    });
  });

  describe("listTokens", () => {
    it("should list all user emails with tokens", async () => {
      const users = await listTokens();

      expect(mockList).toHaveBeenCalledWith(
        "secret/metadata/linguistnow/tokens",
      );
      expect(users).toEqual(["user1@test.com", "user2@test.com"]);
    });

    it("should handle empty token list", async () => {
      mockList.mockResolvedValueOnce({ data: { keys: [] } });

      const users = await listTokens();
      expect(users).toEqual([]);
    });

    it("should handle Vault list errors", async () => {
      mockList.mockRejectedValueOnce(new Error("Vault error"));

      await expect(listTokens()).rejects.toThrow("Vault error");
    });
  });

  describe("deleteToken", () => {
    it("should delete tokens from Vault at correct path", async () => {
      await deleteToken("user@test.com");

      expect(mockDelete).toHaveBeenCalledWith(
        "secret/data/linguistnow/tokens/user@test.com",
      );
    });

    it("should handle Vault delete errors", async () => {
      mockDelete.mockRejectedValueOnce(new Error("Token not found"));

      await expect(deleteToken("nonexistent@test.com")).rejects.toThrow(
        "Token not found",
      );
    });
  });
});
