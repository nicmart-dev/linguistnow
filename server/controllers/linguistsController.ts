import type { Request, Response } from "express";
import Airtable from "airtable";
import { env } from "../env.js";
import { withAutoRefresh } from "../utils/tokenRefresh.js";
import { getFreeBusy } from "../services/googleCalendarClient.js";
import {
  calculateAvailability,
  getDefaultStartDate,
  getDefaultEndDate,
} from "../services/availabilityService.js";
import type {
  SearchLinguistsQuery,
  SearchLinguistsResponse,
  FilterOptionsResponse,
  LinguistWithAvailability,
  SetupStatus,
  AvailabilityRequest,
} from "@linguistnow/shared";
import {
  AVAILABILITY_DEFAULTS,
  parseArrayField,
  parseUserPreferences,
} from "@linguistnow/shared";

/**
 * Airtable field names used throughout the controller.
 * Centralized to ensure consistency and ease of maintenance.
 */
const AIRTABLE_FIELDS = {
  CALENDAR_IDS: "Calendar IDs",
  TIMEZONE: "Timezone",
  WORKING_HOURS_START: "Working Hours Start",
  WORKING_HOURS_END: "Working Hours End",
  OFF_DAYS: "Off Days",
  EMAIL: "Email",
  NAME: "Name",
  PICTURE: "Picture",
  LANGUAGES: "Languages",
  SPECIALIZATION: "Specialization",
  HOURLY_RATE: "Hourly Rate",
  CURRENCY: "Currency",
  RATING: "Rating",
  ROLE: "Role",
} as const;

/**
 * Standard error response format for API endpoints.
 */
interface ErrorResponse {
  error: string;
  details?: string;
  stack?: string;
  code?: string;
  invalidField?: string;
  airtableError?: unknown;
  attemptedFields?: string[];
}

/**
 * Validates email format using a simple regex pattern.
 * @param email - Email address to validate
 * @returns true if email format is valid, false otherwise
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  // Limit email length to prevent ReDoS attacks
  if (email.length > 254) {
    return false; // RFC 5321 maximum email length
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Escape single quotes in Airtable formula strings to prevent formula injection.
 * @param value - String value to escape
 * @returns Escaped string safe for use in Airtable formulas
 */
function escapeAirtableFormulaString(value: string): string {
  return value.replace(/'/g, "''");
}

// parseArrayField is now imported from @linguistnow/shared

/**
 * Extract date string from ISO date string, handling various formats.
 * Safely extracts the date portion (YYYY-MM-DD) from ISO strings.
 * @param isoString - ISO date string (e.g., "2026-01-15T00:00:00Z" or "2026-01-15")
 * @returns Date string in YYYY-MM-DD format, or empty string if invalid
 */
function extractDateString(isoString: string): string {
  // Handle ISO format with 'T' separator
  if (isoString.includes("T")) {
    return isoString.split("T")[0] || "";
  }
  // Handle date-only format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return isoString;
  }
  // Try to parse and format
  try {
    const date = new Date(isoString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0] || "";
    }
  } catch {
    // Invalid date format
  }
  return "";
}

/**
 * Calculate the number of days between two dates (inclusive).
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns Number of days between dates, minimum 1
 */
function calculateDaysInRange(startDate: string, endDate: string): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 7; // Default to 7 days if dates are invalid
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1); // +1 for inclusive range
  } catch {
    return 7; // Default to 7 days on error
  }
}

/**
 * Logs an error with consolidated information.
 * Reduces console.error calls by combining error details into a single log.
 * @param context - Context description (e.g., "searching linguists")
 * @param error - Error object or unknown value
 * @param additionalInfo - Optional additional information to log
 */
function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>,
): void {
  const errorDetails: Record<string, unknown> = {
    context,
    ...additionalInfo,
  };

  if (error instanceof Error) {
    errorDetails.message = error.message;
    errorDetails.stack = error.stack;
  } else {
    errorDetails.error = String(error);
  }

  // Sanitize context to prevent format string injection
  const safeContext =
    typeof context === "string" ? context.replace(/%/g, "%%") : String(context);
  console.error("Error", safeContext + ":", errorDetails);
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
 * Check if linguist setup is complete.
 * Validates that required fields (Calendar IDs, Timezone, Working Hours Start) are present.
 * @param fields - Airtable record fields
 * @returns SetupStatus object indicating completion status and missing items
 */
function checkSetupStatus(fields: Record<string, unknown>): SetupStatus {
  const missingItems: string[] = [];

  if (
    !fields[AIRTABLE_FIELDS.CALENDAR_IDS] ||
    (fields[AIRTABLE_FIELDS.CALENDAR_IDS] as string).trim() === ""
  ) {
    missingItems.push("calendars");
  }
  if (!fields[AIRTABLE_FIELDS.TIMEZONE]) {
    missingItems.push("timezone");
  }
  if (!fields[AIRTABLE_FIELDS.WORKING_HOURS_START]) {
    missingItems.push("working_hours");
  }

  return {
    isComplete: missingItems.length === 0,
    missingItems,
  };
}

/**
 * Parse comma-separated string to array
 */
function parseCommaSeparated(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build Airtable filter formula from query parameters.
 * Constructs a filter formula using AND() function for compatibility with multiple select fields.
 * Validates and sanitizes numeric inputs before including them in the formula.
 * @param query - Search query parameters
 * @returns Airtable filter formula string
 */
function buildFilterFormula(query: Partial<SearchLinguistsQuery>): string {
  const conditions: string[] = [];

  // Always filter to Linguists only
  conditions.push(`{${AIRTABLE_FIELDS.ROLE}} = 'Linguist'`);

  // Language filter (OR - linguist has any of the specified languages)
  // For multiple select fields, use direct equality which works for array fields
  // Airtable supports {Field} = 'Value' for multiple select fields
  if (query.languages) {
    const languages = parseCommaSeparated(query.languages);
    if (languages.length > 0) {
      const escapedLanguages = languages.map((lang) =>
        escapeAirtableFormulaString(lang),
      );
      const langConditions = escapedLanguages.map(
        (lang) => `{${AIRTABLE_FIELDS.LANGUAGES}} = '${lang}'`,
      );
      conditions.push(`(${langConditions.join(" OR ")})`);
    }
  }

  // Specialization filter (OR - linguist has any of the specified specializations)
  // For multiple select fields, use direct equality which works for array fields
  // Airtable supports {Field} = 'Value' for multiple select fields
  if (query.specialization) {
    const specializations = parseCommaSeparated(query.specialization);
    if (specializations.length > 0) {
      const escapedSpecs = specializations.map((spec) =>
        escapeAirtableFormulaString(spec),
      );
      const specConditions = escapedSpecs.map(
        (spec) => `{${AIRTABLE_FIELDS.SPECIALIZATION}} = '${spec}'`,
      );
      if (specConditions.length > 0) {
        conditions.push(`(${specConditions.join(" OR ")})`);
      }
    }
  }

  // Rate range filter with validation
  if (
    query.minRate !== undefined &&
    typeof query.minRate === "number" &&
    !isNaN(query.minRate) &&
    query.minRate >= 0
  ) {
    conditions.push(
      `{${AIRTABLE_FIELDS.HOURLY_RATE}} >= ${String(query.minRate)}`,
    );
  }
  if (
    query.maxRate !== undefined &&
    typeof query.maxRate === "number" &&
    !isNaN(query.maxRate) &&
    query.maxRate >= 0
  ) {
    conditions.push(
      `{${AIRTABLE_FIELDS.HOURLY_RATE}} <= ${String(query.maxRate)}`,
    );
  }

  // Rating filter with validation
  if (
    query.minRating !== undefined &&
    typeof query.minRating === "number" &&
    !isNaN(query.minRating) &&
    query.minRating >= 0 &&
    query.minRating <= 5
  ) {
    conditions.push(
      `{${AIRTABLE_FIELDS.RATING}} >= ${String(query.minRating)}`,
    );
  }

  // Use AND() function instead of AND operator for better compatibility
  if (conditions.length === 0) {
    return "TRUE";
  }
  if (conditions.length === 1) {
    return conditions[0];
  }
  return `AND(${conditions.join(", ")})`;
}

/**
 * Get user preferences from Airtable fields.
 * Uses Zod schema validation from shared package for type safety.
 * @param fields - Airtable record fields
 * @returns User preferences object with timezone, working hours, and off days
 */
function getUserPreferences(fields: Record<string, unknown>): {
  timezone?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  offDays?: number[];
} {
  // Use shared Zod validation for type-safe parsing
  const parsed = parseUserPreferences(fields);
  return {
    timezone: parsed.timezone,
    workingHoursStart: parsed.workingHoursStart,
    workingHoursEnd: parsed.workingHoursEnd,
    offDays: parsed.offDays,
  };
}

/**
 * Check availability for a linguist.
 * Reads calendar data from Google Calendar API and calculates available time slots
 * based on working hours, off days, and busy periods.
 * @param userEmail - User's email address
 * @param calendarIds - Comma-separated list of Google Calendar IDs
 * @param query - Search query with date range and required hours
 * @param preferences - User's availability preferences (timezone, working hours, off days)
 * @returns Availability result with free slots and total hours, or null on error
 */
async function checkLinguistAvailability(
  userEmail: string,
  calendarIds: string,
  query: Partial<SearchLinguistsQuery>,
  preferences: {
    timezone?: string;
    workingHoursStart?: string;
    workingHoursEnd?: string;
    offDays?: number[];
  },
): Promise<{
  isAvailable: boolean;
  freeSlots: Array<{ start: string; end: string }>;
  totalFreeHours: number;
} | null> {
  try {
    // Parse calendar IDs
    const ids = calendarIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      return null;
    }

    // Build availability request
    // Extract defaults - types are already correct from shared package
    const defaults = AVAILABILITY_DEFAULTS;
    const timezoneValue =
      query.timezone ?? preferences.timezone ?? defaults.timezone;
    const defaultStart = getDefaultStartDate(timezoneValue);
    const defaultEnd = getDefaultEndDate(timezoneValue);
    const startDate = query.startDate ?? extractDateString(defaultStart);
    const endDate = query.endDate ?? extractDateString(defaultEnd);
    const workingHoursStartValue =
      preferences.workingHoursStart ?? defaults.workingHoursStart;
    const workingHoursEndValue =
      preferences.workingHoursEnd ?? defaults.workingHoursEnd;
    // Use linguist's offDays (empty array or not set = no off-days)
    // preferences.offDays is always set (empty array if not configured)
    const offDaysValue = [...(preferences.offDays ?? [])];

    // Calculate minHoursPerDay based on actual date range, not hardcoded 7 days
    const daysInRange = calculateDaysInRange(startDate, endDate);
    const minHoursPerDayValue =
      typeof query.requiredHours === "number" && query.requiredHours > 0
        ? Math.ceil(query.requiredHours / daysInRange)
        : defaults.minHoursPerDay;

    // PM's timezone is in query.timezone (if provided), otherwise use linguist's timezone
    // This is used to convert PM's calendar dates to linguist's calendar dates
    const pmTimezoneValue = query.timezone ?? timezoneValue;

    const availabilityRequest: AvailabilityRequest = {
      calendarIds: ids,
      userEmail,
      startDate,
      endDate,
      timezone: timezoneValue, // Linguist's timezone
      pmTimezone: pmTimezoneValue, // PM's timezone (for date conversion)
      workingHoursStart: workingHoursStartValue,
      workingHoursEnd: workingHoursEndValue,
      offDays: offDaysValue,
      minHoursPerDay: minHoursPerDayValue,
    };

    // Get busy slots from Google Calendar with automatic token refresh on expiration
    const busySlots = await withAutoRefresh(userEmail, async (token) => {
      return await getFreeBusy(
        token,
        ids,
        new Date(startDate).toISOString(),
        new Date(`${endDate}T23:59:59`).toISOString(),
      );
    });

    // Calculate availability
    const result = calculateAvailability(busySlots, availabilityRequest);

    // Filter by required hours if specified
    if (
      typeof query.requiredHours === "number" &&
      query.requiredHours > 0 &&
      result.totalFreeHours < query.requiredHours
    ) {
      return {
        isAvailable: false,
        freeSlots: result.freeSlots,
        totalFreeHours: result.totalFreeHours,
      };
    }

    return {
      isAvailable: result.isAvailable,
      freeSlots: result.freeSlots,
      totalFreeHours: result.totalFreeHours,
    };
  } catch (error) {
    logError(`checking availability for ${userEmail}`, error);
    // Return null on error - will be handled as setup incomplete
    return null;
  }
}

/**
 * GET /api/linguists/search
 * Search and filter linguists with availability information.
 * Supports pagination, filtering by languages, specialization, rates, ratings, and availability.
 * @param req - Express request with query parameters
 * @param res - Express response
 */
export const searchLinguists = async (
  req: Request<
    Record<string, never>,
    SearchLinguistsResponse,
    never,
    SearchLinguistsQuery
  >,
  res: Response,
) => {
  try {
    const queryParams = req.query as Partial<
      Record<keyof SearchLinguistsQuery, string>
    >;

    // Validate and sanitize query parameters
    const query: Partial<SearchLinguistsQuery> = {
      languages:
        queryParams.languages && typeof queryParams.languages === "string"
          ? queryParams.languages.trim()
          : undefined,
      specialization:
        queryParams.specialization &&
        typeof queryParams.specialization === "string"
          ? queryParams.specialization.trim()
          : undefined,
      minRate: queryParams.minRate ? Number(queryParams.minRate) : undefined,
      maxRate: queryParams.maxRate ? Number(queryParams.maxRate) : undefined,
      minRating: queryParams.minRating
        ? Number(queryParams.minRating)
        : undefined,
      availableOnly: queryParams.availableOnly === "true",
      startDate:
        queryParams.startDate && typeof queryParams.startDate === "string"
          ? queryParams.startDate.trim()
          : undefined,
      endDate:
        queryParams.endDate && typeof queryParams.endDate === "string"
          ? queryParams.endDate.trim()
          : undefined,
      requiredHours: queryParams.requiredHours
        ? Number(queryParams.requiredHours)
        : undefined,
      timezone:
        queryParams.timezone && typeof queryParams.timezone === "string"
          ? queryParams.timezone.trim()
          : undefined,
      page: queryParams.page ? Math.max(1, Number(queryParams.page)) : 1,
      limit: queryParams.limit
        ? Math.max(1, Math.min(100, Number(queryParams.limit)))
        : 20,
    };

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    // Build filter formula
    const filterFormula = buildFilterFormula(query);

    // Fetch linguists from Airtable
    let records;
    try {
      const base = getAirtableBase();
      records = await base("Users")
        .select({
          filterByFormula: filterFormula,
          pageSize: limit,
          offset,
        })
        .all();
    } catch (airtableError) {
      logError("Airtable query", airtableError, { filterFormula });
      const errorMessage =
        airtableError instanceof Error
          ? airtableError.message
          : String(airtableError);
      throw new Error(
        `Airtable query failed: ${errorMessage}. Formula: ${filterFormula}`,
      );
    }

    // Get total count (for pagination)
    // Note: Airtable doesn't provide total count directly via API.
    // We fetch all records matching the filter to get accurate count.
    // This is expensive but necessary for correct pagination.
    let total = records.length;
    try {
      const base = getAirtableBase();
      const allRecords = await base("Users")
        .select({
          filterByFormula: filterFormula,
        })
        .all();
      total = allRecords.length;
    } catch (airtableError) {
      logError("Airtable total count query", airtableError, { filterFormula });
      // Fallback: use current page count + offset as estimate
      total = records.length + offset;
    }

    // Process each linguist
    const linguists = await Promise.all(
      records.map(async (record): Promise<LinguistWithAvailability | null> => {
        const fields = record.fields as Record<string, unknown>;

        // Check setup status
        const setupStatus = checkSetupStatus(fields);

        // Parse languages and specialization using helper function
        const languages = parseArrayField(fields[AIRTABLE_FIELDS.LANGUAGES]);
        const specialization = parseArrayField(
          fields[AIRTABLE_FIELDS.SPECIALIZATION],
        );

        // Get preferences
        const preferences = getUserPreferences(fields);

        // Check availability if setup is complete
        let availability: {
          isAvailable: boolean;
          freeSlots: Array<{ start: string; end: string }>;
          totalFreeHours: number;
        } | null = null;

        if (setupStatus.isComplete && fields[AIRTABLE_FIELDS.CALENDAR_IDS]) {
          try {
            availability = await checkLinguistAvailability(
              fields[AIRTABLE_FIELDS.EMAIL] as string,
              fields[AIRTABLE_FIELDS.CALENDAR_IDS] as string,
              query,
              preferences,
            );
          } catch (error) {
            // Log error but don't fail the entire request
            logError(
              `checking availability for ${fields[AIRTABLE_FIELDS.EMAIL] as string}`,
              error,
            );
            // Continue with null availability
          }
        }

        // Filter by availableOnly if requested
        if (
          query.availableOnly &&
          (!availability || !availability.isAvailable)
        ) {
          return null;
        }

        return {
          id: record.id,
          email: fields[AIRTABLE_FIELDS.EMAIL] as string,
          name: fields[AIRTABLE_FIELDS.NAME] as string,
          picture: fields[AIRTABLE_FIELDS.PICTURE] as string | undefined,
          languages,
          specialization,
          hourlyRate: fields[AIRTABLE_FIELDS.HOURLY_RATE] as number | undefined,
          currency: fields[AIRTABLE_FIELDS.CURRENCY] as string | undefined,
          timezone: preferences.timezone,
          rating: fields[AIRTABLE_FIELDS.RATING] as number | undefined,
          setupStatus,
          availability,
        };
      }),
    );

    // Filter out nulls (from availableOnly filter)
    const filteredLinguists = linguists.filter(
      (l): l is LinguistWithAvailability => l !== null,
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      linguists: filteredLinguists,
      total: filteredLinguists.length, // Actual filtered count
      page,
      totalPages,
      filters: query,
    });
  } catch (error) {
    logError("searching linguists", error);
    const errorResponse: ErrorResponse = {
      error: error instanceof Error ? error.message : String(error),
    };

    // In development, include full error details
    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      errorResponse.stack = error.stack;
    }

    res.status(500).json({
      linguists: [],
      total: 0,
      page: 1,
      totalPages: 0,
      filters: req.query,
      ...errorResponse,
    });
  }
};

/**
 * GET /api/linguists/filters
 * Get available filter options for the dashboard.
 * Fetches all linguists and extracts unique values for languages, specializations,
 * and calculates min/max ranges for rates and ratings.
 * @param _req - Express request (unused)
 * @param res - Express response with filter options
 */
export const getFilterOptions = async (
  _req: Request,
  res: Response<FilterOptionsResponse>,
) => {
  try {
    const base = getAirtableBase();

    // Fetch all linguists to extract unique values
    const records = await base("Users")
      .select({
        filterByFormula: `{${AIRTABLE_FIELDS.ROLE}} = 'Linguist'`,
      })
      .all();

    const languagesSet = new Set<string>();
    const specializationsSet = new Set<string>();
    const rates: number[] = [];
    const ratings: number[] = [];

    for (const record of records) {
      const fields = record.fields as Record<string, unknown>;

      // Extract languages using helper function
      const languages = parseArrayField(fields[AIRTABLE_FIELDS.LANGUAGES]);
      languages.forEach((lang) => languagesSet.add(lang));

      // Extract specializations using helper function
      const specializations = parseArrayField(
        fields[AIRTABLE_FIELDS.SPECIALIZATION],
      );
      specializations.forEach((spec) => specializationsSet.add(spec));

      // Extract rates
      if (
        fields[AIRTABLE_FIELDS.HOURLY_RATE] &&
        typeof fields[AIRTABLE_FIELDS.HOURLY_RATE] === "number"
      ) {
        rates.push(fields[AIRTABLE_FIELDS.HOURLY_RATE] as number);
      }

      // Extract ratings
      if (
        fields[AIRTABLE_FIELDS.RATING] &&
        typeof fields[AIRTABLE_FIELDS.RATING] === "number"
      ) {
        ratings.push(fields[AIRTABLE_FIELDS.RATING] as number);
      }
    }

    res.json({
      languages: Array.from(languagesSet).sort(),
      specializations: Array.from(specializationsSet).sort(),
      rateRange: {
        min: rates.length > 0 ? Math.min(...rates) : 0,
        max: rates.length > 0 ? Math.max(...rates) : 0,
      },
      ratingRange: {
        min: ratings.length > 0 ? Math.min(...ratings) : 0,
        max: ratings.length > 0 ? Math.max(...ratings) : 5,
      },
    });
  } catch (error) {
    logError("getting filter options", error);
    res.status(500).json({
      languages: [],
      specializations: [],
      rateRange: { min: 0, max: 0 },
      ratingRange: { min: 0, max: 5 },
    });
  }
};

/**
 * GET /api/linguists/:id
 * Get single linguist with full details including availability information.
 * @param req - Express request with linguist email as id parameter
 * @param res - Express response with linguist data or error
 */
export const getLinguistById = async (
  req: Request<{ id: string }>,
  res: Response<LinguistWithAvailability | ErrorResponse>,
) => {
  try {
    const userEmail = req.params.id;

    // Validate email format
    if (!isValidEmail(userEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const escapedEmail = escapeAirtableFormulaString(userEmail);

    const base = getAirtableBase();
    const records = await base("Users")
      .select({
        filterByFormula: `AND({${AIRTABLE_FIELDS.EMAIL}} = '${escapedEmail}', {${AIRTABLE_FIELDS.ROLE}} = 'Linguist')`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return res.status(404).json({ error: "Linguist not found" });
    }

    const record = records[0];
    const fields = record.fields as Record<string, unknown>;

    const setupStatus = checkSetupStatus(fields);
    const preferences = getUserPreferences(fields);

    // Parse languages and specialization using helper function
    const languages = parseArrayField(fields[AIRTABLE_FIELDS.LANGUAGES]);
    const specialization = parseArrayField(
      fields[AIRTABLE_FIELDS.SPECIALIZATION],
    );

    let availability: {
      isAvailable: boolean;
      freeSlots: Array<{ start: string; end: string }>;
      totalFreeHours: number;
    } | null = null;

    if (setupStatus.isComplete && fields[AIRTABLE_FIELDS.CALENDAR_IDS]) {
      // Use default date range for single linguist view
      const timezone = preferences.timezone ?? AVAILABILITY_DEFAULTS.timezone;
      const defaultStart = getDefaultStartDate(timezone);
      const defaultEnd = getDefaultEndDate(timezone);
      const startDate = extractDateString(defaultStart);
      const endDate = extractDateString(defaultEnd);

      availability = await checkLinguistAvailability(
        userEmail,
        fields[AIRTABLE_FIELDS.CALENDAR_IDS] as string,
        { startDate, endDate },
        preferences,
      );
    }

    res.json({
      id: record.id,
      email: fields[AIRTABLE_FIELDS.EMAIL] as string,
      name: fields[AIRTABLE_FIELDS.NAME] as string,
      picture: fields[AIRTABLE_FIELDS.PICTURE] as string | undefined,
      languages,
      specialization,
      hourlyRate: fields[AIRTABLE_FIELDS.HOURLY_RATE] as number | undefined,
      currency: fields[AIRTABLE_FIELDS.CURRENCY] as string | undefined,
      timezone: preferences.timezone,
      rating: fields[AIRTABLE_FIELDS.RATING] as number | undefined,
      setupStatus,
      availability,
    });
  } catch (error) {
    logError("getting linguist", error);
    const errorResponse: ErrorResponse = {
      error: "Failed to fetch linguist",
      details: error instanceof Error ? error.message : String(error),
    };
    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      errorResponse.stack = error.stack;
    }
    res.status(500).json(errorResponse);
  }
};

/**
 * PATCH /api/linguists/:id/rating
 * Update linguist rating.
 * Validates email format and rating value, then updates the Rating field in Airtable.
 * @param req - Express request with linguist email as id and rating in body
 * @param res - Express response with updated rating or error
 */
export const updateLinguistRating = async (
  req: Request<
    { id: string },
    { rating: number } | ErrorResponse,
    { rating: number }
  >,
  res: Response<{ rating: number } | ErrorResponse>,
) => {
  try {
    // Express automatically decodes URL parameters, but handle edge cases
    let userEmail = req.params.id;
    try {
      // Try decoding in case it's double-encoded
      userEmail = decodeURIComponent(userEmail);
    } catch {
      // If already decoded, use as-is
      userEmail = req.params.id;
    }

    // Validate email format
    if (!isValidEmail(userEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const { rating } = req.body;

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Escape single quotes in email to prevent formula injection
    const escapedEmail = escapeAirtableFormulaString(userEmail);

    // First, try to find the user by email only (without Role filter)
    // This allows rating users who haven't completed setup yet
    const base = getAirtableBase();
    const records = await base("Users")
      .select({
        filterByFormula: `{${AIRTABLE_FIELDS.EMAIL}} = '${escapedEmail}'`,
        maxRecords: 1,
      })
      .firstPage();

    // If not found, return 404
    if (records.length === 0) {
      logError("updating linguist rating", new Error("User not found"), {
        userEmail,
        filterFormula: `{${AIRTABLE_FIELDS.EMAIL}} = '${escapedEmail}'`,
      });
      return res.status(404).json({
        error: "User not found",
        details: "The user may not have logged in or completed setup yet.",
      });
    }

    const record = records[0];
    const recordFields = record.fields as Record<string, unknown>;

    // Check if user has Role set to 'Linguist' (optional check for better UX)
    const userRole = recordFields[AIRTABLE_FIELDS.ROLE];
    if (userRole && userRole !== "Linguist") {
      logError(
        "updating linguist rating",
        new Error("User is not a linguist"),
        {
          userEmail,
          role: userRole,
        },
      );
      return res.status(403).json({
        error: "Cannot rate this user",
        details: "Only linguists can be rated.",
      });
    }

    // Update rating in Airtable
    // Note: Airtable Rating field accepts integers 1-5
    // Ensure we pass an integer, not a float, and clamp to valid range
    const ratingValue = Math.max(1, Math.min(5, Math.round(rating)));

    // Try to find Rating field name (case-insensitive check)
    // IMPORTANT: Empty/null fields don't appear in record.fields, but can still be updated.
    // We use the schema field name directly if not found in record.fields.
    // Airtable allows updating fields that exist in the schema even if they're empty/null.
    let ratingFieldName = Object.keys(recordFields).find(
      (key) => key.toLowerCase() === AIRTABLE_FIELDS.RATING.toLowerCase(),
    );

    // If not found in record fields, use the schema field name directly
    // Airtable allows updating fields even if they're empty/null in the record
    if (!ratingFieldName) {
      ratingFieldName = AIRTABLE_FIELDS.RATING;

      // Log that we're using schema field name (field might be empty in record)
      if (process.env.NODE_ENV !== "production") {
        console.log("Rating field not in record.fields, using schema name:", {
          userEmail,
          recordId: record.id,
          schemaFieldName: AIRTABLE_FIELDS.RATING,
          availableFields: Object.keys(recordFields),
        });
      }
    }

    // Log the update attempt for debugging (only in development)
    if (process.env.NODE_ENV !== "production") {
      console.log("Updating linguist rating:", {
        userEmail,
        recordId: record.id,
        ratingValue,
        ratingFieldName,
        currentRating: recordFields[ratingFieldName],
      });
    }

    // Create update object with proper typing
    // Airtable accepts field names as keys with values of supported types
    const fieldsToUpdate: { [key: string]: number } = {};
    fieldsToUpdate[ratingFieldName] = ratingValue;

    try {
      await base("Users").update(record.id, fieldsToUpdate);
    } catch (airtableError: unknown) {
      // Enhanced error logging for Airtable update failures
      // Parse Airtable error structure (similar to usersController)
      let errorMessage = "Failed to update rating in Airtable";
      let errorDetails: unknown = airtableError;
      let invalidField: string | undefined;

      if (airtableError && typeof airtableError === "object") {
        // Airtable errors often have error property with nested structure
        if ("error" in airtableError) {
          errorDetails = airtableError.error;
          const errorObj = airtableError.error;

          if (errorObj && typeof errorObj === "object") {
            // Check for message
            if ("message" in errorObj) {
              errorMessage = String(errorObj.message);
            }
            // Check for field name in error (common in Airtable errors)
            if ("field" in errorObj) {
              invalidField = String(errorObj.field);
            }
            // Sometimes the field is in a different structure
            if ("errors" in errorObj && Array.isArray(errorObj.errors)) {
              const errorsArray = errorObj.errors as unknown[];
              if (errorsArray.length > 0) {
                const firstError = errorsArray[0];
                if (
                  typeof firstError === "object" &&
                  firstError !== null &&
                  "field" in firstError &&
                  "message" in firstError
                ) {
                  const fieldError = firstError as {
                    field: string | number;
                    message: string;
                  };
                  invalidField =
                    typeof fieldError.field === "string"
                      ? fieldError.field
                      : String(fieldError.field);
                  errorMessage = fieldError.message;
                }
              }
            }
          }
        } else if ("message" in airtableError) {
          errorMessage = String(airtableError.message);
        } else if (airtableError instanceof Error) {
          errorMessage = airtableError.message;
        }
      }

      // Log comprehensive error details
      logError(
        "updating linguist rating - Airtable update failed",
        airtableError,
        {
          userEmail,
          recordId: record.id,
          ratingValue,
          ratingFieldName,
          fieldsToUpdate,
          errorMessage,
          invalidField,
          errorDetails: JSON.stringify(errorDetails, null, 2),
        },
      );

      // Return detailed error response
      const errorResponse: ErrorResponse = {
        error: "Failed to update rating in database",
        details: errorMessage,
      };

      // In development, include full error details
      if (process.env.NODE_ENV !== "production") {
        errorResponse.code = "AIRTABLE_UPDATE_ERROR";
        if (invalidField) {
          errorResponse.invalidField = invalidField;
        }
        errorResponse.airtableError = errorDetails;
        errorResponse.attemptedFields = Object.keys(fieldsToUpdate);
      }

      return res.status(500).json(errorResponse);
    }

    res.json({ rating: ratingValue });
  } catch (error) {
    // Enhanced error logging with more context
    logError("updating linguist rating", error, {
      userEmail: req.params.id,
      rating: req.body.rating,
    });

    const errorResponse: ErrorResponse = {
      error: "Failed to update rating",
      details: error instanceof Error ? error.message : String(error),
    };
    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      errorResponse.stack = error.stack;
    }
    res.status(500).json(errorResponse);
  }
};
