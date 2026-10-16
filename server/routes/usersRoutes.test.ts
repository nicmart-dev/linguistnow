import { describe, it, expect, vi } from "vitest";
import usersRoutes from "./usersRoutes.js";
import { apiKeyAuthMiddleware } from "../utils/apiKeyAuth.js";
import { rateLimitMiddleware } from "../utils/rateLimit.js";

vi.mock("../controllers/usersController.js", () => ({
  default: {
    getAll: vi.fn(),
    getOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

describe("usersRoutes", () => {
  it("should protect GET / with apiKeyAuthMiddleware and rateLimitMiddleware", () => {
    const getAllRoute = (usersRoutes.stack as any[]).find(
      (r) => r.route?.path === "/" && r.route?.methods?.get,
    );
    expect(getAllRoute).toBeDefined();
    expect(getAllRoute.route.stack[0].handle).toBe(apiKeyAuthMiddleware);
    expect(getAllRoute.route.stack[1].handle).toBe(rateLimitMiddleware);
  });

  it("should protect per-user routes with rateLimitMiddleware", () => {
    const expectedRoutes = [
      { path: "/:id", method: "get" },
      { path: "/:id", method: "put" },
      { path: "/:id", method: "delete" },
      { path: "/", method: "post" },
    ];

    for (const expected of expectedRoutes) {
      const routeLayer = (usersRoutes.stack as any[]).find(
        (r) =>
          r.route?.path === expected.path &&
          r.route?.methods?.[expected.method],
      );
      expect(routeLayer).toBeDefined();
      expect(routeLayer.route.stack[0].handle).toBe(rateLimitMiddleware);
    }
  });
});
