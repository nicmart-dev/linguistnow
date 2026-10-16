import type { RequestHandler } from "express";
import { verifySessionToken } from "./session.js";
import { getUserRole } from "../controllers/usersController.js";

import { timingSafeEqual } from "crypto";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Requires a valid session token (Authorization: Bearer <token>) issued at login,
 * OR a valid X-API-Key matching INTERNAL_API_KEY (for internal/admin access).
 * On success, stores the authenticated email in res.locals.authEmail.
 */
export const requireSession: RequestHandler = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const apiKeySecret =
    (process.env.INTERNAL_API_KEY ?? "").trim() ||
    (process.env.CURRENCY_REFRESH_API_KEY ?? "").trim();

  if (
    apiKey &&
    typeof apiKey === "string" &&
    apiKeySecret &&
    Buffer.from(apiKey).length === Buffer.from(apiKeySecret).length &&
    timingSafeEqual(Buffer.from(apiKey), Buffer.from(apiKeySecret))
  ) {
    res.locals.authEmail = "__admin__";
    res.locals.isAdmin = true;
    next();
    return;
  }

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    res.status(401).json({
      error: "Unauthorized",
      message: "A valid session token is required. Please log in again.",
    });
    return;
  }

  res.locals.authEmail = session.email;
  next();
};

/**
 * Requires a session AND that the :id route param is the caller's own email.
 * When allowProjectManager is true, Project Managers may also access other users.
 */
export function authorizeUserParam(options: {
  allowProjectManager: boolean;
}): RequestHandler[] {
  const authorize: RequestHandler = async (req, res, next) => {
    if (res.locals.isAdmin) {
      next();
      return;
    }

    const authEmail = res.locals.authEmail as string;
    const target = normalizeEmail(req.params.id as string);

    if (authEmail === target) {
      next();
      return;
    }

    if (options.allowProjectManager) {
      let role: string | undefined;
      try {
        role = await getUserRole(authEmail);
      } catch (error) {
        console.error("Failed to look up role for authorization:", error);
      }
      if (role === "Project Manager") {
        next();
        return;
      }
    }

    res.status(403).json({
      error: "Forbidden",
      message: "You are not allowed to access this user",
    });
  };

  return [requireSession, authorize];
}

/**
 * Requires a session AND that body.email matches the authenticated email,
 * so users can only create their own record at first login.
 */
export const authorizeBodyEmail: RequestHandler[] = [
  requireSession,
  (req, res, next) => {
    if (res.locals.isAdmin) {
      next();
      return;
    }

    const authEmail = res.locals.authEmail as string;
    const body = req.body as { email?: unknown } | undefined;
    const bodyEmail =
      typeof body?.email === "string" ? normalizeEmail(body.email) : "";

    // Missing/invalid email is rejected with 400 by the controller
    if (bodyEmail && bodyEmail !== authEmail) {
      res.status(403).json({
        error: "Forbidden",
        message: "You can only create your own user",
      });
      return;
    }
    next();
  },
];
