import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import {
  requireSession,
  authorizeUserParam,
  authorizeBodyEmail,
} from "./userAuth.js";
import { createSessionToken } from "./session.js";

// Mock getUserRole from usersController
vi.mock("../controllers/usersController.js", () => ({
  getUserRole: vi.fn(),
}));

import { getUserRole } from "../controllers/usersController.js";

describe("userAuth middleware", () => {
  const originalInternalKey = process.env.INTERNAL_API_KEY;
  const originalCurrencyKey = process.env.CURRENCY_REFRESH_API_KEY;
  const originalSessionSecret = process.env.SESSION_SECRET;

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusSpy: ReturnType<typeof vi.fn>;
  let jsonSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_KEY = "test-internal-api-key";
    process.env.CURRENCY_REFRESH_API_KEY = "test-currency-api-key";
    process.env.SESSION_SECRET = "test-session-secret-for-user-auth";

    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
    mockNext = vi.fn();

    mockReq = {
      headers: {},
      params: {},
      body: {},
    };

    mockRes = {
      locals: {},
      status: statusSpy as any,
      json: jsonSpy as any,
    };
  });

  afterEach(() => {
    if (originalInternalKey !== undefined) {
      process.env.INTERNAL_API_KEY = originalInternalKey;
    } else {
      delete process.env.INTERNAL_API_KEY;
    }
    if (originalCurrencyKey !== undefined) {
      process.env.CURRENCY_REFRESH_API_KEY = originalCurrencyKey;
    } else {
      delete process.env.CURRENCY_REFRESH_API_KEY;
    }
    if (originalSessionSecret !== undefined) {
      process.env.SESSION_SECRET = originalSessionSecret;
    } else {
      delete process.env.SESSION_SECRET;
    }
  });

  describe("requireSession", () => {
    it("should allow request with valid X-API-Key and set isAdmin", () => {
      mockReq.headers = { "x-api-key": "test-internal-api-key" };

      requireSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.locals?.isAdmin).toBe(true);
      expect(mockRes.locals?.authEmail).toBe("__admin__");
    });

    it("should allow request with valid CURRENCY_REFRESH_API_KEY fallback", () => {
      delete process.env.INTERNAL_API_KEY;
      mockReq.headers = { "x-api-key": "test-currency-api-key" };

      requireSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.locals?.isAdmin).toBe(true);
    });

    it("should allow request with valid Bearer session token", () => {
      const token = createSessionToken("alice@example.com");
      mockReq.headers = { authorization: `Bearer ${token}` };

      requireSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.locals?.authEmail).toBe("alice@example.com");
      expect(mockRes.locals?.isAdmin).toBeUndefined();
    });

    it("should return 401 when no token or API key provided", () => {
      requireSession(mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Unauthorized" }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when Bearer token is invalid", () => {
      mockReq.headers = { authorization: "Bearer invalid.fake.token" };

      requireSession(mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("authorizeUserParam", () => {
    it("should allow admin bypass", async () => {
      const [, authorize] = authorizeUserParam({ allowProjectManager: false });
      mockRes.locals = { isAdmin: true };
      mockReq.params = { id: "anyone@example.com" };

      await authorize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should allow user to access their own record", async () => {
      const [, authorize] = authorizeUserParam({ allowProjectManager: false });
      mockRes.locals = { authEmail: "alice@example.com" };
      mockReq.params = { id: "ALICE@EXAMPLE.COM" };

      await authorize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should deny user accessing another user when allowProjectManager is false", async () => {
      const [, authorize] = authorizeUserParam({ allowProjectManager: false });
      mockRes.locals = { authEmail: "alice@example.com" };
      mockReq.params = { id: "bob@example.com" };

      await authorize(mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should allow Project Manager accessing another user when allowProjectManager is true", async () => {
      vi.mocked(getUserRole).mockResolvedValue("Project Manager");
      const [, authorize] = authorizeUserParam({ allowProjectManager: true });
      mockRes.locals = { authEmail: "pm@example.com" };
      mockReq.params = { id: "linguist@example.com" };

      await authorize(mockReq as Request, mockRes as Response, mockNext);

      expect(getUserRole).toHaveBeenCalledWith("pm@example.com");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should deny Linguist accessing another user even when allowProjectManager is true", async () => {
      vi.mocked(getUserRole).mockResolvedValue("Linguist");
      const [, authorize] = authorizeUserParam({ allowProjectManager: true });
      mockRes.locals = { authEmail: "linguist1@example.com" };
      mockReq.params = { id: "linguist2@example.com" };

      await authorize(mockReq as Request, mockRes as Response, mockNext);

      expect(getUserRole).toHaveBeenCalledWith("linguist1@example.com");
      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("authorizeBodyEmail", () => {
    it("should allow admin bypass", () => {
      const [, authorize] = authorizeBodyEmail;
      mockRes.locals = { isAdmin: true };
      mockReq.body = { email: "other@example.com" };

      authorize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should allow creating own user", () => {
      const [, authorize] = authorizeBodyEmail;
      mockRes.locals = { authEmail: "alice@example.com" };
      mockReq.body = { email: "alice@example.com" };

      authorize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should deny creating someone else's user", () => {
      const [, authorize] = authorizeBodyEmail;
      mockRes.locals = { authEmail: "alice@example.com" };
      mockReq.body = { email: "bob@example.com" };

      authorize(mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Forbidden" }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should defer to controller when body email is missing", () => {
      const [, authorize] = authorizeBodyEmail;
      mockRes.locals = { authEmail: "alice@example.com" };
      mockReq.body = {};

      authorize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
