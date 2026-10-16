/**
 * API request/response types shared between client and server
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Linguist search request query parameters
 */
export interface SearchLinguistsQuery {
  languages?: string; // Comma-separated language pairs (e.g., "EN-FR,EN-ES")
  specialization?: string; // Comma-separated specializations (e.g., "Legal,Medical")
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  availableOnly?: boolean;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  requiredHours?: number; // Project size in hours
  timezone?: string; // IANA timezone
  displayCurrency?: string; // Currency code for rate conversion (ISO 4217)
  page?: number;
  limit?: number;
}

/**
 * Setup status for linguist profile
 */
export interface SetupStatus {
  isComplete: boolean;
  missingItems: string[]; // e.g., ["calendars", "timezone", "working_hours"]
  tokenExpired?: boolean; // true when Google OAuth token is missing, expired, or revoked
}

/**
 * Check whether a linguist user has completed their initial setup.
 * Requires configured calendars, timezone, and working hours start.
 * Supports Airtable fields as well as camelCase User preference fields.
 *
 * @param fields - User or Airtable record fields
 * @returns SetupStatus object indicating completion status and missing items
 */
export function checkSetupStatus(fields: Record<string, unknown>): SetupStatus {
  const missingItems: string[] = [];

  const calendarIds =
    fields["Calendar IDs"] ?? fields.calendarIds ?? fields.googleCalendarId;

  if (
    typeof calendarIds !== "string" ||
    calendarIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean).length === 0
  ) {
    missingItems.push("calendars");
  }

  const timezone = fields.Timezone ?? fields.timezone;
  if (!timezone) {
    missingItems.push("timezone");
  }

  const workingHoursStart =
    fields["Working Hours Start"] ??
    fields.workingHoursStart ??
    (
      fields.availabilityPreferences as
        { workingHoursStart?: string } | undefined
    )?.workingHoursStart;
  if (!workingHoursStart) {
    missingItems.push("working_hours");
  }

  return {
    isComplete: missingItems.length === 0,
    missingItems,
  };
}

/**
 * Linguist with availability information
 */
export interface LinguistWithAvailability {
  id: string;
  email: string;
  name: string;
  picture?: string;
  languages?: string[];
  specialization?: string[];
  hourlyRate?: number;
  currency?: string;
  hourlyRateConverted?: number; // Rate converted to displayCurrency
  timezone?: string;
  rating?: number;
  setupStatus: SetupStatus;
  availability: {
    isAvailable: boolean;
    freeSlots: Array<{ start: string; end: string }>;
    totalFreeHours: number;
  } | null; // null if setup incomplete, token expired, or check failed
}

/**
 * Search linguists response
 */
export interface SearchLinguistsResponse {
  linguists: LinguistWithAvailability[];
  total: number;
  page: number;
  totalPages: number;
  filters: SearchLinguistsQuery; // Echo back applied filters
}

/**
 * Filter options response
 */
export interface FilterOptionsResponse {
  languages: string[]; // All language pairs in system
  specializations: string[]; // All specialization options
  rateRange: { min: number; max: number };
  ratingRange: { min: number; max: number };
}
