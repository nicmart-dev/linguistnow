import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { rateLimitMiddleware, resetRateLimitStore } from "./rateLimit.js";

function createReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: "127.0.0.1",
    method: "GET",
    baseUrl: "/api/currency",
    route: { path: "/rates" },
    socket: { remoteAddress: "10.0.0.1" },
    ...overrides,
  } as unknown as Request;
}

describe("rateLimitMiddleware", () => {
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    resetRateLimitStore();

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
    } as unknown as Response;
    next = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows burst up to 10 requests and blocks the 11th with 429", () => {
    const req = createReq();

    for (let i = 0; i < 10; i++) {
      rateLimitMiddleware(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(10);
    expect(statusMock).not.toHaveBeenCalled();

    rateLimitMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(10);
    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: 1,
    });
  });

  it("refills tokens over time without starving subsequent requests", () => {
    const req = createReq();

    for (let i = 0; i < 10; i++) {
      rateLimitMiddleware(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(10);

    // Advance 1.5s -> refills 1 token (and preserves leftover 0.5s progress)
    vi.advanceTimersByTime(1500);
    rateLimitMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(11);

    // Advance another 0.5s -> total elapsed since refill is 1.0s -> 1 more token
    vi.advanceTimersByTime(500);
    rateLimitMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(12);
  });

  it("isolates buckets across IPs and falls back when req.ip or route are absent", () => {
    const reqA = createReq({ ip: undefined, route: undefined });
    const reqB = createReq({
      ip: undefined,
      socket: { remoteAddress: undefined } as unknown as Request["socket"],
      route: undefined,
    });

    for (let i = 0; i < 10; i++) {
      rateLimitMiddleware(reqA, res, next);
    }
    // Different remoteAddress -> separate bucket still succeeds
    rateLimitMiddleware(reqB, res, next);
    expect(next).toHaveBeenCalledTimes(11);
  });
});
