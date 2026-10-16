import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import tokenRoutes from "./tokenRoutes.js";
import { apiKeyAuthMiddleware } from "../utils/apiKeyAuth.js";
import { rateLimitMiddleware } from "../utils/rateLimit.js";

const mockListTokens = vi.fn();
const mockDeleteToken = vi.fn();
const mockUserExistsInAirtable = vi.fn();
const mockRefreshAllTokens = vi.fn();

vi.mock("../utils/vaultClient.js", () => ({
  listTokens: (): Promise<string[]> => mockListTokens() as Promise<string[]>,
  deleteToken: (email: string): Promise<void> =>
    mockDeleteToken(email) as Promise<void>,
}));

vi.mock("../controllers/usersController.js", () => ({
  userExistsInAirtable: (email: string): Promise<boolean> =>
    mockUserExistsInAirtable(email) as Promise<boolean>,
}));

vi.mock("../controllers/tokenRefreshController.js", () => ({
  refreshAllTokens: (req: Request, res: Response): Promise<void> =>
    mockRefreshAllTokens(req, res) as Promise<void>,
}));

describe("tokenRoutes", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
    mockResponse = {
      json: jsonSpy as unknown as Response["json"],
      status: statusSpy as unknown as Response["status"],
    };
    mockRequest = {};
  });

  it("should protect GET /list with apiKeyAuthMiddleware and rateLimitMiddleware", () => {
    const listRoute = (tokenRoutes.stack as any[]).find(
      (r) => r.route?.path === "/list" && r.route?.methods?.get,
    );
    expect(listRoute).toBeDefined();
    expect(listRoute.route.stack[0].handle).toBe(apiKeyAuthMiddleware);
    expect(listRoute.route.stack[1].handle).toBe(rateLimitMiddleware);
  });

  it("should protect POST /refresh-all with apiKeyAuthMiddleware and rateLimitMiddleware", () => {
    const refreshRoute = (tokenRoutes.stack as any[]).find(
      (r) => r.route?.path === "/refresh-all" && r.route?.methods?.post,
    );
    expect(refreshRoute).toBeDefined();
    expect(refreshRoute.route.stack[0].handle).toBe(apiKeyAuthMiddleware);
    expect(refreshRoute.route.stack[1].handle).toBe(rateLimitMiddleware);
  });

  it("should return valid emails and prune removed users in GET /list handler", async () => {
    mockListTokens.mockResolvedValueOnce([
      "valid@example.com",
      "orphaned@example.com",
    ]);
    mockUserExistsInAirtable
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    mockDeleteToken.mockResolvedValueOnce(undefined);

    const listRoute = (tokenRoutes.stack as any[]).find(
      (r) => r.route?.path === "/list" && r.route?.methods?.get,
    );
    const handler = listRoute.route.stack[2].handle;
    await handler(mockRequest, mockResponse);

    expect(mockDeleteToken).toHaveBeenCalledWith("orphaned@example.com");
    expect(jsonSpy).toHaveBeenCalledWith({ emails: ["valid@example.com"] });
  });
});
