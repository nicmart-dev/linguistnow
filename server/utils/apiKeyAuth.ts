import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";

/**
 * API key authentication middleware for internal endpoints
 * Checks for X-API-Key header and validates against configured secret
 */
export const apiKeyAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"];

  // Allow requests from internal IPs (Docker network) without API key
  const clientIp = req.ip || req.socket.remoteAddress || "";
  const isInternalIp =
    clientIp.startsWith("172.") ||
    clientIp.startsWith("10.") ||
    clientIp.startsWith("192.168.") ||
    clientIp === "::1" ||
    clientIp === "127.0.0.1";

  // If no API key secret is configured, allow internal IPs only
  const apiKeySecret = process.env.CURRENCY_REFRESH_API_KEY;
  if (!apiKeySecret) {
    if (isInternalIp) {
      next();
      return;
    }
    res.status(401).json({
      error: "Unauthorized",
      message:
        "API key required. Set CURRENCY_REFRESH_API_KEY environment variable or use internal network.",
    });
    return;
  }

  // Validate API key using timing-safe comparison to prevent timing attacks
  if (
    !apiKey ||
    typeof apiKey !== "string" ||
    apiKey.length !== apiKeySecret.length ||
    !timingSafeEqual(Buffer.from(apiKey), Buffer.from(apiKeySecret))
  ) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing API key",
    });
    return;
  }

  next();
};
