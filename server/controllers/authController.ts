import { OAuth2Client } from "google-auth-library";
import type { Request, Response } from "express";
import { env } from "../env.js";
import { writeToken } from "../utils/vaultClient.js";

// Lazy initialization functions to ensure dotenv is loaded before accessing env
function getGoogleRedirectUri(): string {
  // Use validated env variables, fallback to empty string
  return env.GOOGLE_REDIRECT_URI || env.FRONTEND_URL || env.BACKEND_URL || "";
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

    // Validate OAuth code
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return res.status(400).json({ error: "Invalid authorization code" });
    }

    // Exchange the authorization code for access token and refresh token
    const client = getOAuth2ClientInstance();
    const { tokens } = await client.getToken({
      code: code.trim(),
      redirect_uri: getGoogleRedirectUri(), // Ensure this matches the registered redirect URI
    });
    // Set the refresh token
    client.setCredentials({
      refresh_token: tokens.refresh_token,
    });

    // Get userEmail from request or fetch from Google
    // Validate userEmail if provided in request body
    let userEmail: string | undefined = req.body.userEmail;
    if (userEmail && typeof userEmail !== "string") {
      throw new Error("Invalid userEmail: must be a string");
    }
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

    // Validate access token
    if (
      !accessToken ||
      typeof accessToken !== "string" ||
      accessToken.trim().length === 0
    ) {
      return res.status(400).json({ error: "Invalid access token" });
    }

    // Set the access token
    const client = getOAuth2ClientInstance();
    client.setCredentials({
      access_token: accessToken.trim(),
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

export default {
  exchangeCodeForToken,
  getUserInfo,
};
