import type { Request, Response, NextFunction } from "express";

/**
 * Simple in-memory rate limiter using token bucket algorithm
 * For production, consider using Redis-based rate limiting
 */
interface RateLimitStore {
  [key: string]: {
    tokens: number;
    lastRefill: number;
  };
}

const store: RateLimitStore = {};
const REFILL_RATE = 1; // tokens per second
const MAX_TOKENS = 10; // max tokens in bucket

/**
 * Rate limiting middleware for currency refresh endpoint
 * Allows 10 requests per minute per IP address
 */
export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  if (!store[key]) {
    store[key] = {
      tokens: MAX_TOKENS,
      lastRefill: now,
    };
  }

  const bucket = store[key];
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((timePassed / 1000) * REFILL_RATE);

  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    return res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((1 - bucket.tokens) / REFILL_RATE),
    });
  }

  bucket.tokens -= 1;
  next();
};
