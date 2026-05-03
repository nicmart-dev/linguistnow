/**
 * Currency service for fetching and caching FX rates from Frankfurter
 * Uses Redis for persistent caching across server restarts
 */

// Note: ioredis types are bundled but ESLint has trouble resolving them
import Redis, { type Redis as RedisClient } from "ioredis";

import { env } from "../env.js";

const RATES_KEY = "fx:rates";
const RATES_TTL = 86400 * 2; // 48 hours (buffer for weekends)

/**
 * Exchange rates response from Frankfurter API
 */
export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
  updatedAt: string;
}

// Redis client (lazy init)
let redis: RedisClient | null = null;
let redisAvailable = false;

/**
 * Reset Redis client (for testing only)
 * @internal
 */
export function resetRedisClient(): void {
  if (redis) {
    // Only disconnect if it's a real Redis instance (has disconnect method)
    if (typeof redis.disconnect === "function") {
      redis.disconnect();
    }
    redis = null;
  }
  redisAvailable = false;
}

/**
 * Get Redis client instance (lazy initialization)
 * Gracefully handles connection failures - app continues without Redis
 * @returns Redis client instance or null if unavailable
 * @internal Exported for testing only
 */
export function getRedisClient(): RedisClient | null {
  if (!redis) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const client = new Redis(env.REDIS_URL, {
        retryStrategy: (times) => {
          // Stop retrying after 5 attempts
          if (times > 5) {
            redisAvailable = false;
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false, // Don't queue commands when offline
        connectTimeout: 5000, // 5 second connection timeout
        lazyConnect: false, // Connect immediately but handle errors gracefully
      });

      // Optimistically assume Redis is available (will be set to false on errors)
      // This allows tests to work and production to gracefully degrade
      redisAvailable = true;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      client.on("error", (err: Error) => {
        // Only log if not already marked as unavailable (avoid spam)
        if (redisAvailable) {
          console.warn(
            `Redis connection error (FX rates will work without cache): ${err.message}. ` +
              `Ensure Redis is running at ${env.REDIS_URL}`,
          );
        }
        redisAvailable = false;
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      client.on("connect", () => {
        console.log("Redis connected for FX rate caching");
        redisAvailable = true;
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      client.on("ready", () => {
        redisAvailable = true;
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      client.on("close", () => {
        if (redisAvailable) {
          console.warn(
            "Redis connection closed (FX rates will work without cache)",
          );
        }
        redisAvailable = false;
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      redis = client;
    } catch (error) {
      console.warn(
        `Failed to initialize Redis client (FX rates will work without cache): ${error instanceof Error ? error.message : String(error)}. ` +
          `Ensure Redis is running at ${env.REDIS_URL}`,
      );
      redis = null;
      redisAvailable = false;
    }
  }
  return redis;
}

/**
 * Store exchange rates in Redis
 * Gracefully fails if Redis is unavailable
 * @param data - Exchange rates data from Frankfurter
 */
async function storeRates(data: ExchangeRates): Promise<void> {
  const client = getRedisClient();
  if (!client || !redisAvailable) {
    // Redis unavailable - skip caching, continue without it
    return;
  }

  try {
    const ratesData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await client.setex(RATES_KEY, RATES_TTL, JSON.stringify(ratesData));
  } catch (error) {
    // Redis operation failed - log but don't throw
    console.warn(
      "Failed to store rates in Redis (continuing without cache):",
      error instanceof Error ? error.message : String(error),
    );
    redisAvailable = false;
  }
}

/**
 * Get cached exchange rates from Redis
 * Gracefully returns null if Redis is unavailable
 * @returns Cached rates or null if not found/expired/unavailable
 */
async function getCachedRates(): Promise<ExchangeRates | null> {
  const client = getRedisClient();
  if (!client || !redisAvailable) {
    // Redis unavailable - return null to trigger fresh fetch
    return null;
  }

  try {
    const cached = await client.get(RATES_KEY);
    if (!cached) {
      return null;
    }
    return JSON.parse(cached) as ExchangeRates;
  } catch (error) {
    // Redis operation failed - log but return null to trigger fresh fetch
    console.warn(
      "Failed to get cached rates from Redis (will fetch fresh):",
      error instanceof Error ? error.message : String(error),
    );
    redisAvailable = false;
    return null;
  }
}

/**
 * Fetch fresh rates from Frankfurter and store in Redis
 * @returns Exchange rates data
 * @throws Error if Frankfurter API call fails (with helpful error message)
 */
export async function refreshRates(): Promise<ExchangeRates> {
  try {
    const response = await fetch(`${env.FRANKFURTER_URL}/latest?base=USD`, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(
        `Frankfurter API error: ${response.status.toString()} ${response.statusText}. Please ensure Frankfurter service is running at ${env.FRANKFURTER_URL}`,
      );
    }

    const data = (await response.json()) as {
      base: string;
      date: string;
      rates: Record<string, number>;
    };

    const ratesData: ExchangeRates = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Store in Redis (non-blocking - continues even if Redis fails)
    await storeRates(ratesData);
    return ratesData;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Frankfurter API timeout. Please ensure Frankfurter service is running at ${env.FRANKFURTER_URL}`,
        { cause: error },
      );
    }
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      throw new Error(
        `Cannot connect to Frankfurter service at ${env.FRANKFURTER_URL}. Please ensure the service is running.`,
        { cause: error },
      );
    }
    throw error;
  }
}

/**
 * Get rates from Redis, auto-fetch if empty (on-demand fallback)
 * @returns Exchange rates data
 */
export async function getRates(): Promise<ExchangeRates> {
  const cached = await getCachedRates();
  if (cached) {
    return cached;
  }

  // Fallback: fetch fresh rates if cache is empty
  return await refreshRates();
}

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param from - Source currency code (ISO 4217)
 * @param to - Target currency code (ISO 4217)
 * @returns Converted amount
 */
export async function convert(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  if (from === to) {
    return amount;
  }

  const rates = await getRates();

  // Frankfurter returns rates with USD as base
  // Convert from source currency to USD, then to target currency
  if (from === "USD") {
    const rate = rates.rates[to.toUpperCase()];
    if (!rate) {
      throw new Error(`Currency ${to} not supported`);
    }
    return amount * rate;
  }

  if (to === "USD") {
    const rate = rates.rates[from.toUpperCase()];
    if (!rate) {
      throw new Error(`Currency ${from} not supported`);
    }
    return amount / rate;
  }

  // Convert from -> USD -> to
  const fromRate = rates.rates[from.toUpperCase()];
  const toRate = rates.rates[to.toUpperCase()];

  if (!fromRate) {
    throw new Error(`Currency ${from} not supported`);
  }
  if (!toRate) {
    throw new Error(`Currency ${to} not supported`);
  }

  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

/**
 * Check if rates are available in cache
 * Gracefully returns false if Redis is unavailable
 * @returns true if rates are cached, false otherwise
 */
export async function hasRates(): Promise<boolean> {
  try {
    const cached = await getCachedRates();
    return cached !== null;
  } catch (error) {
    // If Redis check fails, return false (will trigger fresh fetch)
    console.warn(
      "Failed to check rates cache:",
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}
