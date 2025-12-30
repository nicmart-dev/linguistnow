import { OAuth2Client } from "google-auth-library";
import type { Request, Response } from "express";
import { env } from "../env.js";
import { writeToken, readToken } from "../utils/vaultClient.js";

// Lazy initialization functions to ensure dotenv is loaded before accessing env
function getGoogleRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    env.FRONTEND_URL ||
    process.env.BACKEND_URL ||
    ""
  );
}

// Initialize on first use (lazy)
let oAuth2Client: OAuth2Client | null = null;
function getOAuth2ClientInstance(): OAuth2Client {
  if (!oAuth2Client) {
    console.log("Using Google OAuth credentials from environment variables");
    const redirectUri = getGoogleRedirectUri();
    console.log(`Redirect URI: ${redirectUri}`);
    oAuth2Client = new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );
  }
  return oAuth2Client;
}

interface TokenExchangeRequest {
  code: string;
  userEmail?: string;
}

interface UserInfoRequest {
  accessToken: string;
}

interface RefreshTokenRequest {
  refreshToken?: string;
  userEmail?: string;
}

/* Route for exchanging authorization code for access token and refresh token */
export const exchangeCodeForToken = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    TokenExchangeRequest
  >,
  res: Response,
) => {
  try {
    const { code } = req.body;

    // Exchange the authorization code for access token and refresh token
    const client = getOAuth2ClientInstance();
    const { tokens } = await client.getToken({
      code,
      redirect_uri: getGoogleRedirectUri(), // Ensure this matches the registered redirect URI
    });
    // Set the refresh token
    client.setCredentials({
      refresh_token: tokens.refresh_token,
    });

    // Get userEmail from request or fetch from Google
    let userEmail = req.body.userEmail;
    if (!userEmail && tokens.access_token) {
      try {
        // Fetch user info from Google's userinfo endpoint (simpler, always available with oauth scopes)
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          },
        );
        if (response.ok) {
          const data = (await response.json()) as { email?: string };
          userEmail = data.email;
          if (userEmail) {
            console.log("Fetched user email from Google:", userEmail);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user email:", error);
      }
    }

    // Write tokens to Vault if userEmail is available
    if (userEmail && tokens.access_token && tokens.refresh_token) {
      try {
        await writeToken(userEmail, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        });
        console.log("Tokens written to Vault for user:", userEmail);
      } catch (error) {
        // Log error but don't fail the request - tokens are still returned to client
        console.error(
          "Failed to write tokens to Vault for user:",
          userEmail,
          error,
        );
      }
    } else {
      console.warn(
        `Cannot write to Vault - missing: ${!userEmail ? "userEmail" : ""} ${!tokens.access_token ? "access_token" : ""} ${!tokens.refresh_token ? "refresh_token" : ""}`.trim(),
      );
    }

    res.json({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });
  } catch (error) {
    console.error("Error during token exchange:", error);
    res.status(500).json({ error: "Failed to exchange code for token" });
  }
};

/* Route for fetching user info from Google People API */
export const getUserInfo = async (
  req: Request<Record<string, never>, Record<string, never>, UserInfoRequest>,
  res: Response,
) => {
  try {
    const { accessToken } = req.body;

    // Set the access token
    const client = getOAuth2ClientInstance();
    client.setCredentials({
      access_token: accessToken,
    });

    // You can use this info to get user information too.
    const url =
      "https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos";
    const response = await client.request({ url });

    const data = response.data as {
      emailAddresses?: Array<{ value?: string }>;
      names?: Array<{ displayName?: string }>;
      photos?: Array<{ url?: string }>;
    };
    const userInfo = {
      email: data.emailAddresses?.[0]?.value || "",
      name: data.names?.[0]?.displayName || "",
      picture: data.photos?.[0]?.url || "",
    };

    console.log("User Info:", userInfo);
    res.json({ userInfo });
  } catch (error) {
    console.error("Error during fetching user info:", error);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
};

/* Route for refreshing access token using refresh token
   This endpoint keeps the client secret secure on the server */
export const refreshAccessToken = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    RefreshTokenRequest
  >,
  res: Response,
) => {
  try {
    const { refreshToken, userEmail } = req.body;
    let tokenToUse = refreshToken;

    // If userEmail is provided but no refreshToken, read from Vault
    if (!tokenToUse && userEmail) {
      try {
        const tokens = await readToken(userEmail);
        tokenToUse = tokens.refreshToken;
      } catch (error) {
        console.error("Failed to read token from Vault:", error);
        return res.status(400).json({
          error: "Refresh token is required",
          details: "Could not retrieve refresh token from Vault",
        });
      }
    }

    if (!tokenToUse) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Set the refresh token
    const client = getOAuth2ClientInstance();
    client.setCredentials({
      refresh_token: tokenToUse,
    });

    // Refresh the access token
    const { credentials } = await client.refreshAccessToken();

    if (!credentials.access_token) {
      return res.status(500).json({ error: "Failed to refresh access token" });
    }

    // Write updated tokens to Vault if userEmail is provided
    if (userEmail) {
      try {
        await writeToken(userEmail, {
          accessToken: credentials.access_token,
          refreshToken: tokenToUse,
        });
      } catch (error) {
        // Log error but don't fail the request - token is still returned
        console.error("Failed to write tokens to Vault:", error);
      }
    }

    res.json({ accessToken: credentials.access_token });
  } catch (error: unknown) {
    // Handle specific OAuth errors
    if (error && typeof error === "object" && "response" in error) {
      const oauthError = error as {
        response?: {
          data?: {
            error?: string;
            error_description?: string;
            status?: number;
          };
        };
      };
      const errorData = oauthError.response?.data;

      // invalid_grant typically means refresh token is revoked/expired
      if (errorData?.error === "invalid_grant") {
        // Log concise message for this common error (users need to re-authenticate)
        console.warn(
          "Token refresh failed: invalid_grant - User needs to re-authenticate",
        );
        return res.status(401).json({
          error: "Refresh token is invalid or expired",
          details:
            "The refresh token has been revoked or is no longer valid. User needs to re-authenticate.",
          code: "INVALID_REFRESH_TOKEN",
        });
      }

      console.error(
        "Error during token refresh:",
        errorData?.error,
        errorData?.error_description,
      );
      return res.status(oauthError.response?.data?.status || 500).json({
        error: "Failed to refresh access token",
        details:
          errorData?.error_description ||
          errorData?.error ||
          "Unknown OAuth error",
      });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error during token refresh:", errorMessage);
    res.status(500).json({
      error: "Failed to refresh access token",
      details: errorMessage,
    });
  }
};

export default {
  exchangeCodeForToken,
  getUserInfo,
  refreshAccessToken,
};
