import type { Request, Response, NextFunction } from "express";

/**
 * Simple in-memory rate limiter using token bucket algorithm
 * For production, consider using Redis-based rate limiting
 */
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  lastSeen: number;
}

const store = new Map<string, TokenBucket>();
const REFILL_RATE = 1; // tokens per second
const MAX_TOKENS = 10; // max tokens in bucket (burst size)
const MAX_STORE_SIZE = 10_000; // upper bound on tracked clients/routes
const STALE_AFTER_MS = 10 * 60 * 1000; // evict buckets idle for 10 minutes

/** Clears all rate limit state (used by tests). */
export function resetRateLimitStore(): void {
  store.clear();
}

/** Keeps memory bounded: drops idle buckets, then the oldest entry if still full. */
function evictIfNeeded(now: number): void {
  if (store.size < MAX_STORE_SIZE) {
    return;
  }
  for (const [key, bucket] of store) {
    if (now - bucket.lastSeen > STALE_AFTER_MS) {
      store.delete(key);
    }
  }
  if (store.size >= MAX_STORE_SIZE) {
    const oldest = store.keys().next();
    if (!oldest.done) {
      store.delete(oldest.value);
    }
  }
}

/**
 * Rate limiting middleware (token bucket).
 * Each client IP gets its own bucket per route: bursts of up to 10 requests,
 * refilled at 1 request per second (60 per minute sustained).
 */
export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  // Route pattern (e.g. "/:id") rather than the concrete URL keeps the key space small
  const routePath = (req.route as { path?: string } | undefined)?.path ?? "";
  const key = `${ip}|${req.method}|${req.baseUrl}${routePath}`;
  const now = Date.now();

  let bucket = store.get(key);
  if (!bucket) {
    evictIfNeeded(now);
    bucket = { tokens: MAX_TOKENS, lastRefill: now, lastSeen: now };
    store.set(key, bucket);
  }
  bucket.lastSeen = now;

  const tokensToAdd = Math.floor(
    ((now - bucket.lastRefill) / 1000) * REFILL_RATE,
  );
  if (tokensToAdd > 0) {
    const refilled = bucket.tokens + tokensToAdd;
    // Only advance lastRefill by the time actually converted into tokens, so
    // clients polling faster than the refill interval are not starved forever.
    bucket.lastRefill =
      refilled >= MAX_TOKENS
        ? now
        : bucket.lastRefill + (tokensToAdd * 1000) / REFILL_RATE;
    bucket.tokens = Math.min(MAX_TOKENS, refilled);
  }

  if (bucket.tokens < 1) {
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((1 - bucket.tokens) / REFILL_RATE),
    });
    return;
  }

  bucket.tokens -= 1;
  next();
};
