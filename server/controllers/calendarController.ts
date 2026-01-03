import axios from "axios";
import type { Request, Response } from "express";
import { readToken } from "../utils/vaultClient.js";
import {
  getFreeBusy,
  GoogleCalendarError,
} from "../services/googleCalendarClient.js";
import {
  calculateAvailability,
  getDefaultStartDate,
  getDefaultEndDate,
} from "../services/availabilityService.js";
import type { AvailabilityRequest } from "@linguistnow/shared";
import { AVAILABILITY_DEFAULTS } from "@linguistnow/shared";
import Airtable from "airtable";
import { env } from "../env.js";

/**
 * Escape single quotes in Airtable formula strings to prevent formula injection.
 */
function escapeAirtableFormulaString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Get Airtable base instance
 */
function getAirtableBase() {
  const airtableApiKey =
    env.AIRTABLE_PERSONAL_ACCESS_TOKEN || env.AIRTABLE_API_KEY || "";
  return new Airtable({ apiKey: airtableApiKey }).base(env.AIRTABLE_BASE_ID);
}

/**
 * Fetch user preferences from Airtable
 */
async function getUserPreferences(userEmail: string): Promise<{
  timezone?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  offDays?: number[];
}> {
  const escapedEmail = escapeAirtableFormulaString(userEmail);
  try {
    const records = await getAirtableBase()("Users")
      .select({
        filterByFormula: `{Email} = '${escapedEmail}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return {};
    }

    const fields = records[0].fields as {
      Timezone?: string;
      "Working Hours Start"?: string; // ISO 8601 time format (HH:mm, e.g., "08:00")
      "Working Hours End"?: string; // ISO 8601 time format (HH:mm, e.g., "18:00")
      "Off Days"?: string[] | string; // Array for dropdown, or string for backward compatibility
    };

    const preferences: {
      timezone?: string;
      workingHoursStart?: string;
      workingHoursEnd?: string;
      offDays?: number[];
    } = {};

    if (fields.Timezone) {
      preferences.timezone = fields.Timezone;
    }
    if (fields["Working Hours Start"] !== undefined) {
      preferences.workingHoursStart = fields["Working Hours Start"];
    }
    if (fields["Working Hours End"] !== undefined) {
      preferences.workingHoursEnd = fields["Working Hours End"];
    }
    if (fields["Off Days"]) {
      // Handle both array (dropdown field) and string (backward compatibility)
      if (Array.isArray(fields["Off Days"])) {
        // Map day names back to day numbers (0-6)
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        preferences.offDays = fields["Off Days"]
          .map((d) => {
            if (typeof d === "string") {
              // Try to find day name in array
              const index = dayNames.indexOf(d);
              if (index !== -1) return index;
              // Fallback: try parsing as number (backward compatibility)
              const num = parseInt(d.trim(), 10);
              return typeof num === "number" &&
                !isNaN(num) &&
                num >= 0 &&
                num <= 6
                ? num
                : null;
            }
            // If it's already a number, validate it
            return typeof d === "number" && !isNaN(d) && d >= 0 && d <= 6
              ? d
              : null;
          })
          .filter((d): d is number => d !== null);
      } else if (typeof fields["Off Days"] === "string") {
        // Backward compatibility: parse comma-separated string
        preferences.offDays = fields["Off Days"]
          .split(",")
          .map((d) => parseInt(d.trim(), 10))
          .filter((d) => !isNaN(d));
      }
    }
    if (fields["Min Hours Per Day"] !== undefined) {
      // Note: minHoursPerDay is not a linguist preference - it's a PM requirement set in availability requests
    }

    return preferences;
  } catch (error) {
    console.log("Error fetching user preferences:", error);
    return {};
  }
}

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole?: string;
}

interface GoogleCalendarListResponse {
  items?: GoogleCalendar[];
  nextPageToken?: string;
}

/* List all calendars for a user by reading their access token from Vault */
/**
 * Validate Google OAuth token by calling Google's tokeninfo endpoint
 * Returns true if token is valid, false otherwise
 */
const validateGoogleToken = async (accessToken: string): Promise<boolean> => {
  try {
    const response = await axios.get<{ expires_in?: number }>(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
      {
        timeout: 5000,
      },
    );
    // Token is valid if we get a 200 response with an expires_in field
    return (
      response.status === 200 &&
      typeof response.data.expires_in === "number" &&
      response.data.expires_in > 0
    );
  } catch {
    // If tokeninfo endpoint returns an error, token is invalid
    return false;
  }
};

// GET /api/calendars/list/:userEmail
export const listCalendars = async (
  req: Request<{ userEmail: string }>,
  res: Response,
) => {
  const { userEmail } = req.params;

  if (!userEmail) {
    return res.status(400).json({ error: "userEmail parameter is required" });
  }

  try {
    // Read access token from Vault
    const tokens = await readToken(userEmail);

    if (!tokens.accessToken) {
      return res.status(404).json({
        error: "No access token found for user",
        details: "User needs to login again to authorize calendar access.",
        code: "TOKEN_NOT_FOUND",
      });
    }

    // Validate token before making calendar API call
    const isTokenValid = await validateGoogleToken(tokens.accessToken);
    if (!isTokenValid) {
      return res.status(401).json({
        error: "Access token expired or invalid",
        details: "User needs to login again to refresh their token.",
        code: "TOKEN_EXPIRED",
      });
    }

    // Fetch calendar list from Google
    const response = await axios.get<GoogleCalendarListResponse>(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        timeout: 10000,
      },
    );

    res.status(200).json({
      calendars: response.data.items || [],
    });
  } catch (error: unknown) {
    console.error("Error fetching calendar list:", error);

    // Handle Vault errors
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.includes("Vault")
    ) {
      return res.status(503).json({
        error: "Cannot read token from Vault",
        details: "Vault service may be unavailable.",
        code: "VAULT_ERROR",
      });
    }

    // Handle Google API errors
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: {
          status?: number;
          data?: { error?: { message?: string; code?: number } };
        };
      };
      const status = axiosError.response?.status;
      const googleError = axiosError.response?.data?.error;

      if (status === 401) {
        return res.status(401).json({
          error: "Access token expired or invalid",
          details:
            googleError?.message ||
            "User needs to login again to refresh their token.",
          code: "TOKEN_EXPIRED",
        });
      }

      return res.status(status || 500).json({
        error: "Google Calendar API error",
        details: googleError?.message || "Unknown error from Google API",
        code: "GOOGLE_API_ERROR",
      });
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: "Error fetching calendar list",
      details: errorMessage,
      code: "UNKNOWN_ERROR",
    });
  }
};

/**
 * Check user availability against their calendars
 * POST /api/calendars/availability
 *
 * This endpoint directly calls Google Calendar API (no n8n dependency).
 * Reads access token from Vault and calculates availability in Express.
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
export const checkAvailability = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    AvailabilityRequest
  >,
  res: Response,
) => {
  // Extract and validate request body with explicit types
  const body = req.body;
  // Handle calendarIds as either string (comma-separated from Airtable) or array
  const rawCalendarIds = body.calendarIds;
  const calendarIds: string[] = Array.isArray(rawCalendarIds)
    ? rawCalendarIds
    : typeof rawCalendarIds === "string"
      ? rawCalendarIds
          .split(",")
          .map((id: string) => id.trim())
          .filter(Boolean)
      : [];
  const userEmail = body.userEmail;
  const startDate = body.startDate;
  const endDate = body.endDate;

  // Validate required fields
  if (!userEmail) {
    return res.status(400).json({
      error: "userEmail is required",
      code: "VALIDATION_ERROR",
    });
  }

  // Fetch user preferences from Airtable
  const userPreferences = await getUserPreferences(userEmail);

  // Use user preferences with fallback to request body, then defaults
  const timezone =
    body.timezone ?? userPreferences.timezone ?? AVAILABILITY_DEFAULTS.timezone;
  const workingHoursStart =
    body.workingHoursStart ??
    userPreferences.workingHoursStart ??
    AVAILABILITY_DEFAULTS.workingHoursStart;
  const workingHoursEnd =
    body.workingHoursEnd ??
    userPreferences.workingHoursEnd ??
    AVAILABILITY_DEFAULTS.workingHoursEnd;
  // minHoursPerDay is a PM requirement, not a linguist preference
  const minHoursPerDay =
    body.minHoursPerDay ?? AVAILABILITY_DEFAULTS.minHoursPerDay;

  // Determine off-days: prefer request body, then user preferences, then defaults
  let offDays: number[] | undefined;
  if (body.offDays !== undefined) {
    offDays = body.offDays;
  } else if (userPreferences.offDays !== undefined) {
    offDays = userPreferences.offDays;
  } else if (body.excludeWeekends === false) {
    offDays = [];
  } else {
    // Default or excludeWeekends === true means weekends
    offDays = AVAILABILITY_DEFAULTS.offDays;
  }

  // Validate required fields
  if (!userEmail) {
    return res.status(400).json({
      error: "userEmail is required",
      code: "VALIDATION_ERROR",
    });
  }

  if (calendarIds.length === 0) {
    return res.status(400).json({
      error: "calendarIds array is required",
      code: "VALIDATION_ERROR",
    });
  }

  try {
    // Step 1: Read token from Vault (single Vault client - DRY)
    const tokens = await readToken(userEmail);

    if (!tokens.accessToken) {
      return res.status(404).json({
        error: "No access token found for user",
        details: "User needs to login again to authorize calendar access.",
        code: "TOKEN_NOT_FOUND",
      });
    }

    // Step 2: Calculate time window
    const timeMin = startDate ?? getDefaultStartDate(timezone);
    const timeMax = endDate ?? getDefaultEndDate(timezone);

    // Step 3: Call Google freeBusy API directly (no n8n)
    const busySlots = await getFreeBusy(
      tokens.accessToken,
      calendarIds,
      timeMin,
      timeMax,
    );

    // Step 4: Calculate availability
    const availability = calculateAvailability(busySlots, {
      calendarIds,
      userEmail,
      startDate: timeMin,
      endDate: timeMax,
      timezone,
      workingHoursStart,
      workingHoursEnd,
      minHoursPerDay,
      offDays,
    });

    // Step 5: Return detailed response
    res.status(200).json(availability);
  } catch (error: unknown) {
    console.error("Error checking availability:", error);

    // Handle Vault errors - check for both:
    // 1. ApiResponseError from node-vault (has response.statusCode)
    // 2. Plain errors with "Vault" in message
    const isVaultApiError =
      error &&
      typeof error === "object" &&
      "response" in error &&
      typeof (error as { response?: { statusCode?: number } }).response
        ?.statusCode === "number";

    const isVaultMessageError =
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      (error.message.includes("Vault") || error.message.includes("vault"));

    if (isVaultApiError) {
      const vaultError = error as {
        response: { statusCode: number };
        message?: string;
      };
      const statusCode = vaultError.response.statusCode;

      if (statusCode === 404) {
        return res.status(404).json({
          error: "No access token found for user",
          details: "User needs to login again to authorize calendar access.",
          code: "TOKEN_NOT_FOUND",
        });
      }

      if (statusCode === 403) {
        return res.status(503).json({
          error: "Cannot read token from Vault",
          details:
            "Vault token may be expired or invalid. Check VAULT_TOKEN environment variable.",
          code: "VAULT_PERMISSION_DENIED",
        });
      }

      return res.status(503).json({
        error: "Cannot read token from Vault",
        details: vaultError.message ?? "Vault service may be unavailable.",
        code: "VAULT_ERROR",
      });
    }

    if (isVaultMessageError) {
      return res.status(503).json({
        error: "Cannot read token from Vault",
        details: "Vault service may be unavailable.",
        code: "VAULT_ERROR",
      });
    }

    // Handle Google Calendar API errors
    if (error instanceof GoogleCalendarError) {
      if (error.code === "TOKEN_EXPIRED") {
        return res.status(401).json({
          error: "Access token expired or invalid",
          details: error.message,
          code: "TOKEN_EXPIRED",
        });
      }

      return res.status(error.statusCode || 500).json({
        error: "Google Calendar API error",
        details: error.message,
        code: error.code,
      });
    }

    // Other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: "Error checking availability",
      details: errorMessage,
      code: "UNKNOWN_ERROR",
    });
  }
};

/**
 * @deprecated Use checkAvailability instead. This endpoint will be removed in a future version.
 * Check if given user is available (legacy endpoint, calls checkAvailability internally)
 * POST /api/calendars/free
 */
export const isUserFree = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    AvailabilityRequest
  >,
  res: Response,
) => {
  // Forward to new implementation
  return checkAvailability(req, res);
};
