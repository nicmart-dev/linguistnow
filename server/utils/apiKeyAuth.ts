import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";
import { isIP } from "net";

/**
 * Checks whether a single IP address is a loopback or private network address
 * (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, ::1, fc00::/7, fe80::/10).
 * Handles IPv4-mapped IPv6 addresses, trailing ports and IPv6 zone indices.
 * Anything that is not a syntactically valid IP address is rejected.
 */
export function isPrivateOrLoopbackIp(rawIp: string): boolean {
  let ip = rawIp
    .trim()
    .toLowerCase()
    .replace(/^::ffff:/, "");

  const withPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(ip);
  if (withPort) {
    ip = withPort[1];
  }

  const zoneIndex = ip.indexOf("%");
  if (zoneIndex !== -1) {
    ip = ip.slice(0, zoneIndex);
  }

  const version = isIP(ip);

  if (version === 4) {
    return (
      ip.startsWith("127.") ||
      ip.startsWith("10.") ||
      ip.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
    );
  }

  if (version === 6) {
    return ip === "::1" || /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip);
  }

  return false;
}

/**
 * Determines whether a request originated strictly from the internal network.
 * Both the direct socket/request IP and any proxy-forwarded IPs must be private/loopback.
 */
function isInternalNetworkRequest(req: Request): boolean {
  const clientIp = req.ip || req.socket.remoteAddress || "";
  if (!isPrivateOrLoopbackIp(clientIp)) {
    return false;
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    const rawList = Array.isArray(forwardedFor)
      ? forwardedFor.join(",")
      : forwardedFor;
    const forwardedIps = rawList
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
    if (
      forwardedIps.length === 0 ||
      !forwardedIps.every(isPrivateOrLoopbackIp)
    ) {
      return false;
    }
  }

  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    const realIpStr = Array.isArray(realIp) ? realIp[0] : realIp;
    if (!realIpStr || !isPrivateOrLoopbackIp(realIpStr)) {
      return false;
    }
  }

  return true;
}

/**
 * Returns the configured internal API key (trimmed), preferring INTERNAL_API_KEY
 * and falling back to CURRENCY_REFRESH_API_KEY for backward compatibility.
 * Read from process.env directly (like other middleware) so it can be changed in tests.
 * Whitespace-only values are treated as "not configured".
 */
function getConfiguredApiKey(): string {
  return (
    (process.env.INTERNAL_API_KEY ?? "").trim() ||
    (process.env.CURRENCY_REFRESH_API_KEY ?? "").trim()
  );
}

/**
 * API key authentication middleware for internal/management endpoints.
 *
 * - If an API key is configured, EVERY caller (including the Docker network,
 *   e.g. n8n) must send a matching X-API-Key header.
 * - If no key is configured, only strictly internal-network requests are allowed.
 */
export const apiKeyAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"];
  const apiKeySecret = getConfiguredApiKey();

  if (!apiKeySecret) {
    if (isInternalNetworkRequest(req)) {
      next();
      return;
    }
    res.status(401).json({
      error: "Unauthorized",
      message:
        "API key required. Set INTERNAL_API_KEY environment variable or use internal network.",
    });
    return;
  }

  // Validate API key using byte-safe timing-safe comparison to prevent timing attacks
  if (!apiKey || typeof apiKey !== "string") {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing API key",
    });
    return;
  }

  const apiKeyBuffer = Buffer.from(apiKey);
  const secretBuffer = Buffer.from(apiKeySecret);

  if (
    apiKeyBuffer.length !== secretBuffer.length ||
    !timingSafeEqual(apiKeyBuffer, secretBuffer)
  ) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing API key",
    });
    return;
  }

  next();
};
