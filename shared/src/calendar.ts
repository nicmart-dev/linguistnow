/**
 * Calendar-related types shared between client and server
 */

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface CalendarAvailability {
  calendarId: string;
  available: boolean;
  busySlots: CalendarEvent[];
  freeSlots: Array<{
    start: string;
    end: string;
  }>;
}

export interface CalendarSyncRequest {
  calendarIds: string[];
  startDate: string;
  endDate: string;
}

/**
 * Busy time slot from Google Calendar freeBusy API
 */
export interface BusySlot {
  start: string;
  end: string;
}

/**
 * Request to check user availability
 */
export interface AvailabilityRequest {
  calendarIds: string[];
  userEmail: string;
  startDate?: string; // ISO date (YYYY-MM-DD), defaults to tomorrow. Calendar date selected by PM from their timezone.
  endDate?: string; // ISO date (YYYY-MM-DD), defaults to +7 days. Calendar date selected by PM from their timezone.
  timezone?: string; // Linguist's timezone. Default: America/Los_Angeles
  pmTimezone?: string; // PM's timezone (for converting PM's calendar dates to linguist's timezone). If not provided, assumes dates are already in linguist's timezone.
  workingHoursStart?: string; // Default: "08:00" (ISO 8601 time format HH:mm)
  workingHoursEnd?: string; // Default: "18:00" (ISO 8601 time format HH:mm)
  minHoursPerDay?: number; // Default: 8
  offDays?: number[]; // Days off (0=Sunday, 1=Monday, ..., 6=Saturday). Default: [0, 6] (weekends)
  // Deprecated: use offDays instead
  excludeWeekends?: boolean; // Default: true (for backward compatibility)
}

/**
 * Default values for availability calculation
 */
export const AVAILABILITY_DEFAULTS: {
  readonly timezone: string;
  readonly workingHoursStart: string;
  readonly workingHoursEnd: string;
  readonly minHoursPerDay: number;
  readonly offDays: readonly number[];
  readonly excludeWeekends: boolean;
} = {
  timezone: "America/Los_Angeles",
  workingHoursStart: "08:00", // ISO 8601 time format (HH:mm)
  workingHoursEnd: "18:00", // ISO 8601 time format (HH:mm)
  minHoursPerDay: 8,
  offDays: [0, 6], // Sunday and Saturday
  excludeWeekends: true, // Deprecated: kept for backward compatibility
} as const;

/**
 * Result of availability calculation
 */
export interface AvailabilityResult {
  isAvailable: boolean;
  freeSlots: BusySlot[];
  totalFreeHours: number;
  workingDays: number;
  hoursPerDay: Record<string, number>; // Date string -> hours free
}

/**
 * Google Calendar freeBusy API response
 */
export interface GoogleFreeBusyResponse {
  kind: "calendar#freeBusy";
  timeMin: string;
  timeMax: string;
  calendars: Record<
    string,
    {
      busy: BusySlot[];
      errors?: Array<{ domain: string; reason: string }>;
    }
  >;
}
