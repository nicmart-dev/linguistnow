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
  startDate?: string; // ISO date, defaults to tomorrow
  endDate?: string; // ISO date, defaults to +7 days
  timezone?: string; // Default: America/Los_Angeles
  workingHoursStart?: number; // Default: 8
  workingHoursEnd?: number; // Default: 18
  minHoursPerDay?: number; // Default: 8
  excludeWeekends?: boolean; // Default: true
}

/**
 * Default values for availability calculation
 */
export const AVAILABILITY_DEFAULTS = {
  timezone: "America/Los_Angeles",
  workingHoursStart: 8,
  workingHoursEnd: 18,
  minHoursPerDay: 8,
  excludeWeekends: true,
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
