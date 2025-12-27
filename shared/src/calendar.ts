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

