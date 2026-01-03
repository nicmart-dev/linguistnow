import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { getAll, getOne, create, update, remove } from "./usersController";

// Mock vaultClient
vi.mock("../utils/vaultClient.js", () => ({
  deleteToken: vi.fn().mockResolvedValue(undefined),
}));

// Mock Airtable - use hoisted to ensure mocks are available
const {
  mockSelect,
  mockAll,
  mockFirstPage,
  mockCreate,
  mockUpdate,
  mockDestroy,
} = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockAll = vi.fn();
  const mockFirstPage = vi.fn();
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDestroy = vi.fn();

  return {
    mockSelect,
    mockAll,
    mockFirstPage,
    mockCreate,
    mockUpdate,
    mockDestroy,
  };
});

// Mock Airtable - base() returns a function that takes table name and returns table methods
vi.mock("airtable", () => ({
  default: class {
    base() {
      return () => ({
        select: mockSelect,
        create: mockCreate,
        update: mockUpdate,
        destroy: mockDestroy,
      });
    }
  },
}));

// Mock env
vi.mock("../env.js", () => ({
  env: {
    AIRTABLE_PERSONAL_ACCESS_TOKEN: "test-token",
    AIRTABLE_BASE_ID: "test-base-id",
  },
}));

describe("usersController", () => {
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
    mockSelect.mockReturnValue({
      all: mockAll,
      firstPage: mockFirstPage,
    });
  });

  describe("getAll", () => {
    it("should fetch all users successfully", async () => {
      const mockRecords = [
        {
          fields: {
            Email: "user1@example.com",
            Name: "User 1",
            Role: "Linguist",
          },
        },
        {
          fields: {
            Email: "user2@example.com",
            Name: "User 2",
            Role: "Project Manager",
          },
        },
      ];
      mockAll.mockResolvedValue(mockRecords);

      await getAll({} as Request, mockResponse as Response);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockAll).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith(mockRecords.map((r) => r.fields));
    });

    it("should handle errors", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      mockAll.mockRejectedValue(new Error("Airtable error"));

      await getAll({} as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ error: "Failed to fetch users" });
      consoleLogSpy.mockRestore();
    });
  });

  describe("getOne", () => {
    it("should fetch single user successfully", async () => {
      mockRequest = {
        params: { id: "user@example.com" },
      };
      const mockRecord = {
        id: "rec123",
        fields: { Email: "user@example.com", Name: "User", Role: "Linguist" },
      };
      mockFirstPage.mockResolvedValue([mockRecord]);

      await getOne(mockRequest as Request, mockResponse as Response);

      expect(mockSelect).toHaveBeenCalledWith({
        filterByFormula: "{Email} = 'user@example.com'",
        maxRecords: 1,
      });
      expect(jsonSpy).toHaveBeenCalledWith(mockRecord.fields);
    });

    it("should return 404 when user not found", async () => {
      mockRequest = {
        params: { id: "notfound@example.com" },
      };
      mockFirstPage.mockResolvedValue([]);

      await getOne(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should handle errors", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      mockRequest = {
        params: { id: "user@example.com" },
      };
      mockFirstPage.mockRejectedValue(new Error("Airtable error"));

      await getOne(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ error: "Failed to fetch user" });
      consoleLogSpy.mockRestore();
    });
  });

  describe("create", () => {
    it("should create user successfully", async () => {
      mockRequest = {
        body: {
          email: "newuser@example.com",
          name: "New User",
          picture_url: "https://example.com/pic.jpg",
          role: "Linguist",
        },
      };
      const mockRecord = {
        fields: {
          Email: "newuser@example.com",
          Name: "New User",
          Picture: "https://example.com/pic.jpg",
          Role: "Linguist",
        },
      };
      mockCreate.mockResolvedValue(mockRecord);

      await create(mockRequest as Request, mockResponse as Response);

      expect(mockCreate).toHaveBeenCalledWith({
        Email: "newuser@example.com",
        Name: "New User",
        Picture: "https://example.com/pic.jpg",
        Role: "Linguist",
      });
      expect(jsonSpy).toHaveBeenCalledWith(mockRecord.fields);
    });

    it("should use default role when not provided", async () => {
      mockRequest = {
        body: {
          email: "newuser@example.com",
          name: "New User",
          picture_url: "https://example.com/pic.jpg",
        },
      };
      const mockRecord = {
        fields: {
          Email: "newuser@example.com",
          Name: "New User",
          Picture: "https://example.com/pic.jpg",
          Role: "Linguist",
        },
      };
      mockCreate.mockResolvedValue(mockRecord);

      await create(mockRequest as Request, mockResponse as Response);

      expect(mockCreate).toHaveBeenCalledWith({
        Email: "newuser@example.com",
        Name: "New User",
        Picture: "https://example.com/pic.jpg",
        Role: "Linguist",
      });
    });

    it("should handle errors", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      mockRequest = {
        body: {
          email: "newuser@example.com",
          name: "New User",
          picture_url: "https://example.com/pic.jpg",
        },
      };
      mockCreate.mockRejectedValue(new Error("Airtable error"));

      await create(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ error: "Failed to create user" });
      consoleLogSpy.mockRestore();
    });
  });

  describe("update", () => {
    it("should update user successfully with calendar IDs", async () => {
      mockRequest = {
        params: { id: "user@example.com" },
        body: {
          calendarIds: [
            "cal1@group.calendar.google.com",
            "cal2@group.calendar.google.com",
          ],
        },
      };
      const mockRecord = {
        id: "rec123",
        fields: { Email: "user@example.com" },
      };
      const updatedRecord = {
        fields: {
          Email: "user@example.com",
          "Calendar IDs":
            "cal1@group.calendar.google.com,cal2@group.calendar.google.com",
        },
      };
      mockFirstPage.mockResolvedValue([mockRecord]);
      mockUpdate.mockResolvedValue(updatedRecord);

      await update(mockRequest as Request, mockResponse as Response);

      expect(mockUpdate).toHaveBeenCalledWith("rec123", {
        "Calendar IDs":
          "cal1@group.calendar.google.com,cal2@group.calendar.google.com",
      });
      expect(jsonSpy).toHaveBeenCalledWith(updatedRecord.fields);
    });

    // Note: Token fields have been removed from usersController
    // Tokens are now stored in Vault, not Airtable

    it("should return 400 when no fields provided", async () => {
      mockRequest = {
        params: { id: "user@example.com" },
        body: {},
      };
      const mockRecord = {
        id: "rec123",
        fields: { Email: "user@example.com" },
      };
      mockFirstPage.mockResolvedValue([mockRecord]);

      await update(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: "No fields provided for update",
      });
    });

    it("should return 404 when user not found", async () => {
      mockRequest = {
        params: { id: "notfound@example.com" },
        body: { calendarIds: ["cal1"] },
      };
      mockFirstPage.mockResolvedValue([]);

      await update(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should handle errors", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      mockRequest = {
        params: { id: "user@example.com" },
        body: { calendarIds: ["cal1"] },
      };
      mockFirstPage.mockRejectedValue(new Error("Airtable error"));

      await update(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ error: "Failed to update user" });
      consoleLogSpy.mockRestore();
    });
  });

  describe("remove", () => {
    it("should return 400 for invalid email format", async () => {
      mockRequest = {
        params: { id: "invalid-email" },
      };

      await remove(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ error: "Invalid email format" });
    });

    it("should delete user successfully from Airtable and Vault", async () => {
      const { deleteToken } = await import("../utils/vaultClient.js");
      const userEmail = "user@example.com";
      const recordId = "rec123";
      mockRequest = {
        params: { id: userEmail },
      };
      mockFirstPage.mockResolvedValue([
        {
          id: recordId,
          fields: {
            Email: userEmail,
            Name: "Test User",
          },
        },
      ]);
      mockDestroy.mockResolvedValue(undefined);

      await remove(mockRequest as Request, mockResponse as Response);

      expect(mockFirstPage).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalledWith(recordId);
      expect(deleteToken).toHaveBeenCalledWith(userEmail);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Deleted user",
        email: userEmail,
      });
    });

    it("should return 404 when user not found", async () => {
      mockRequest = {
        params: { id: "notfound@example.com" },
      };
      mockFirstPage.mockResolvedValue([]);

      await remove(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should handle errors", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      mockRequest = {
        params: { id: "user@example.com" },
      };
      mockFirstPage.mockRejectedValue(new Error("Airtable error"));

      await remove(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ error: "Failed to delete user" });
      consoleLogSpy.mockRestore();
    });
  });
});
