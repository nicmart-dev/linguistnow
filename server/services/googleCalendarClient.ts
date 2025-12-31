/**
 * Google Calendar Client
 *
 * Direct integration with Google Calendar freeBusy API.
 * Replaces n8n workflow for Google Calendar availability checks.
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-condition */

import axios from "axios";
import type { BusySlot, GoogleFreeBusyResponse } from "@linguistnow/shared";

const GOOGLE_FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";

/**
 * Error codes for Google Calendar API errors
 */
export const GoogleCalendarErrorCodes = {
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  GOOGLE_API_ERROR: "GOOGLE_API_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

/**
 * Custom error class for Google Calendar API errors
 */
export class GoogleCalendarError extends Error {
  constructor(
    message: string,
    public code: keyof typeof GoogleCalendarErrorCodes,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "GoogleCalendarError";
  }
}

/**
 * Get busy slots from Google Calendar freeBusy API
 *
 * @param accessToken - OAuth access token for the user
 * @param calendarIds - List of calendar IDs to check
 * @param timeMin - Start of time window (ISO string)
 * @param timeMax - End of time window (ISO string)
 * @returns Flattened array of busy slots from all calendars, sorted by start time
 */
export async function getFreeBusy(
  accessToken: string,
  calendarIds: string[],
  timeMin: string,
  timeMax: string,
): Promise<BusySlot[]> {
  try {
    const response = await axios.post<GoogleFreeBusyResponse>(
      GOOGLE_FREEBUSY_URL,
      {
        timeMin,
        timeMax,
        items: calendarIds.map((id) => ({ id })),
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    // Flatten busy slots from all calendars
    const busySlots: BusySlot[] = [];

    for (const [calendarId, calendar] of Object.entries(
      response.data.calendars,
    )) {
      // Check for per-calendar errors
      if (calendar.errors && calendar.errors.length > 0) {
        console.warn(`Calendar ${calendarId} has errors:`, calendar.errors);
        // Continue with other calendars
      }

      if (calendar.busy) {
        busySlots.push(...calendar.busy);
      }
    }

    // Sort by start time
    return busySlots.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  } catch (error: unknown) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseData = error.response?.data as
        | { error?: { message?: string } }
        | undefined;
      const googleError = responseData?.error;

      if (status === 401) {
        throw new GoogleCalendarError(
          googleError?.message ?? "Access token expired or invalid",
          "TOKEN_EXPIRED",
          401,
        );
      }

      throw new GoogleCalendarError(
        googleError?.message ?? error.message ?? "Google Calendar API error",
        "GOOGLE_API_ERROR",
        status,
      );
    }

    // Handle network errors
    if (error instanceof Error) {
      throw new GoogleCalendarError(error.message, "NETWORK_ERROR");
    }

    throw new GoogleCalendarError(
      "Unknown error calling Google Calendar API",
      "GOOGLE_API_ERROR",
    );
  }
}
