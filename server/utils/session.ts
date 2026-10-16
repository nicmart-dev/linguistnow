import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/** Session lifetime: 7 days */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

let ephemeralSecret: string | null = null;

/**
 * Returns the HMAC secret used to sign session tokens.
 * Uses SESSION_SECRET when configured; otherwise falls back to a random
 * per-process secret (sessions are then invalidated on every restart).
 */
function getSecret(): string {
  const configured = (process.env.SESSION_SECRET ?? "").trim();
  if (configured) {
    return configured;
  }
  if (!ephemeralSecret) {
    ephemeralSecret = randomBytes(32).toString("hex");
    console.warn(
      "SESSION_SECRET is not set - using a temporary secret. Users will be logged out on every server restart.",
    );
  }
  return ephemeralSecret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/**
 * Creates a signed session token for a Google-verified email address.
 * Format: base64url(JSON{sub, exp}).base64url(HMAC-SHA256)
 */
export function createSessionToken(
  email: string,
  nowMs: number = Date.now(),
): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: email.trim().toLowerCase(),
      exp: Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/**
 * Verifies a session token's signature and expiry.
 * @returns the (lower-cased) email the session belongs to, or null if invalid
 */
export function verifySessionToken(
  token: string,
  nowMs: number = Date.now(),
): { email: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [payload, signature] = parts;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const { sub, exp } = parsed as { sub?: unknown; exp?: unknown };
    if (typeof sub !== "string" || !sub || typeof exp !== "number") {
      return null;
    }
    if (exp <= Math.floor(nowMs / 1000)) {
      return null;
    }
    return { email: sub };
  } catch {
    return null;
  }
}
