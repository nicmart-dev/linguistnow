import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { listTokens, readToken, writeToken } from "../utils/vaultClient.js";
import { env } from "../env.js";

// Initialize OAuth client for token refresh
function getOAuth2ClientInstance(): OAuth2Client {
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    env.FRONTEND_URL ||
    process.env.BACKEND_URL ||
    "";
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
}

/**
 * POST /api/tokens/refresh-all
 * Internal endpoint - called by n8n on schedule to refresh all tokens
 * Prevents 6-month inactivity expiration by proactively refreshing tokens
 */
export const refreshAllTokens = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const results = {
    success: 0,
    failures: [] as Array<{
      userEmail: string;
      error: string;
      code: string;
    }>,
    totalProcessed: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    // List all tokens from Vault
    const userEmails = await listTokens();
    results.totalProcessed = userEmails.length;

    for (const userEmail of userEmails) {
      try {
        // Read current tokens from Vault
        const tokens = await readToken(userEmail);

        // Refresh access token using OAuth client
        const client = getOAuth2ClientInstance();
        client.setCredentials({
          refresh_token: tokens.refreshToken,
        });

        const { credentials } = await client.refreshAccessToken();

        if (!credentials.access_token) {
          throw new Error("Failed to refresh access token");
        }

        const newAccessToken = credentials.access_token;

        // Write updated token back to Vault
        await writeToken(userEmail, {
          accessToken: newAccessToken,
          refreshToken: tokens.refreshToken,
        });

        results.success++;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorCode =
          error && typeof error === "object" && "code" in error
            ? String(error.code)
            : "UNKNOWN";
        results.failures.push({
          userEmail,
          error: errorMessage,
          code: errorCode,
        });
      }
    }

    res.json(results);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to refresh tokens";
    res.status(500).json({
      error: errorMessage,
      ...results,
    });
  }
};

export default {
  refreshAllTokens,
};
