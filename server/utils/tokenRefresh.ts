/**
 * Automatic Token Refresh Utility
 *
 * Provides functions to automatically refresh Google OAuth tokens
 * when they expire during API calls, preventing user disruption.
 */

import { OAuth2Client } from "google-auth-library";
import { readToken, writeToken } from "./vaultClient.js";
import { env } from "../env.js";
import axios from "axios";

// Initialize OAuth client for token refresh
function getOAuth2ClientInstance(): OAuth2Client {
  // Use validated env variables, fallback to empty string
  const redirectUri =
    env.GOOGLE_REDIRECT_URI || env.FRONTEND_URL || env.BACKEND_URL || "";
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
}

/**
 * Validate Google OAuth token by calling Google's tokeninfo endpoint
 * Returns true if token is valid, false otherwise
 */
async function validateGoogleToken(accessToken: string): Promise<boolean> {
  try {
    const response = await axios.get<{ expires_in?: number }>(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
      {
        timeout: 5000,
      },
    );
    // Token is valid if we get a 200 response with an expires_in field > 0
    return (
      response.status === 200 &&
      typeof response.data.expires_in === "number" &&
      response.data.expires_in > 0
    );
  } catch {
    // If tokeninfo endpoint returns an error, token is invalid
    return false;
  }
}

/**
 * Refresh an access token using a refresh token
 * @param refreshToken - The refresh token to use
 * @returns New access token
 * @throws Error with message containing "invalid_grant" if refresh token is invalid/expired
 */
async function refreshToken(refreshToken: string): Promise<string> {
  const client = getOAuth2ClientInstance();
  client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const { credentials } = await client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error("Failed to refresh access token");
    }

    return credentials.access_token;
  } catch (error: unknown) {
    // Check for invalid_grant error (refresh token is revoked/expired)
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      typeof error.response === "object" &&
      error.response !== null &&
      "data" in error.response &&
      typeof error.response.data === "object" &&
      error.response.data !== null &&
      "error" in error.response.data &&
      error.response.data.error === "invalid_grant"
    ) {
      throw new Error("invalid_grant: Refresh token is invalid or expired");
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Get a valid access token for a user, automatically refreshing if expired
 * This function ensures tokens are always fresh before use, preventing expiration errors
 *
 * @param userEmail - User's email address
 * @returns Valid access token
 * @throws Error if token cannot be read or refreshed
 */
export async function getValidAccessToken(userEmail: string): Promise<string> {
  // Read tokens from Vault
  const tokens = await readToken(userEmail);

  if (!tokens.accessToken) {
    throw new Error("No access token found for user");
  }

  if (!tokens.refreshToken) {
    throw new Error("No refresh token found for user");
  }

  // Validate the current access token
  const isValid = await validateGoogleToken(tokens.accessToken);

  if (isValid) {
    // Token is still valid, return it
    return tokens.accessToken;
  }

  // Token is expired, refresh it
  console.log(`Access token expired for ${userEmail}, refreshing...`);
  try {
    const newAccessToken = await refreshToken(tokens.refreshToken);

    // Save the new token to Vault
    await writeToken(userEmail, {
      accessToken: newAccessToken,
      refreshToken: tokens.refreshToken,
    });

    console.log(`Successfully refreshed access token for ${userEmail}`);
    return newAccessToken;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to refresh access token: ${errorMessage}`);
  }
}

/**
 * Execute a function with automatic token refresh on expiration
 * If the function throws a TOKEN_EXPIRED error, the token is refreshed and the function is retried once
 *
 * @param userEmail - User's email address
 * @param fn - Function to execute that uses the access token
 * @returns Result of the function
 */
export async function withAutoRefresh<T>(
  userEmail: string,
  fn: (accessToken: string) => Promise<T>,
): Promise<T> {
  try {
    // Get a valid token (will refresh if needed)
    const accessToken = await getValidAccessToken(userEmail);
    return await fn(accessToken);
  } catch (error) {
    // Check if this is a token expiration error
    // Could be GoogleCalendarError with code "TOKEN_EXPIRED" or axios error with 401 status
    const isTokenExpired =
      (error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "TOKEN_EXPIRED") ||
      (error &&
        typeof error === "object" &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "status" in error.response &&
        error.response.status === 401);

    if (isTokenExpired) {
      // Token expired during the API call, refresh and retry once
      console.log(
        `Token expired during API call for ${userEmail}, refreshing and retrying...`,
      );
      try {
        const tokens = await readToken(userEmail);
        const newAccessToken = await refreshToken(tokens.refreshToken);
        await writeToken(userEmail, {
          accessToken: newAccessToken,
          refreshToken: tokens.refreshToken,
        });

        // Retry the function with the new token
        return await fn(newAccessToken);
      } catch (refreshError) {
        const errorMessage =
          refreshError instanceof Error
            ? refreshError.message
            : "Unknown error";
        throw new Error(
          `Failed to refresh token after expiration: ${errorMessage}`,
        );
      }
    }

    // Not a token expiration error, rethrow
    throw error;
  }
}
