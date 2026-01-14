/**
 * Zod schemas for Airtable data validation
 *
 * These schemas provide runtime validation for Airtable records,
 * enabling type-safe access to dynamic Airtable data throughout the application.
 */

import { z } from "zod";

// ============================================================================
// Field Value Schemas
// ============================================================================

/**
 * Schema for parsing array fields from Airtable
 * Handles both array format and comma-separated strings
 */
export const AirtableArrayFieldSchema = z.union([
  z.array(z.string()),
  z.string().transform((val) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ),
  z.null().transform(() => []),
  z.undefined().transform(() => []),
]);

/**
 * Schema for parsing optional string fields
 */
export const AirtableStringFieldSchema = z.union([
  z.string(),
  z.null().transform(() => undefined),
  z.undefined(),
]);

/**
 * Schema for parsing optional number fields
 */
export const AirtableNumberFieldSchema = z.union([
  z.number(),
  z.null().transform(() => undefined),
  z.undefined(),
]);

// ============================================================================
// User/Linguist Record Schemas
// ============================================================================

/**
 * Valid user roles
 */
export const UserRoleSchema = z.enum(["Project Manager", "Linguist"]);

/**
 * Day names for off-days field
 */
export const DayNameSchema = z.enum([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

/**
 * Schema for off-days field that can be day names or numbers
 */
export const OffDaysSchema = z
  .array(z.union([DayNameSchema, z.number().min(0).max(6)]))
  .optional()
  .transform((val) => {
    if (!val || val.length === 0) return [];
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return val
      .map((d) => {
        if (typeof d === "string") {
          const index = dayNames.indexOf(d);
          return index !== -1 ? index : parseInt(d.trim(), 10);
        }
        return typeof d === "number" ? d : parseInt(String(d), 10);
      })
      .filter((d) => !isNaN(d) && d >= 0 && d <= 6);
  });

/**
 * Schema for Airtable User record fields
 * Maps Airtable field names to typed values
 */
export const AirtableUserFieldsSchema = z.object({
  // Core fields
  Email: z.email().optional(),
  Name: z.string().optional(),
  Picture: z.url().optional().nullable(),
  Role: UserRoleSchema.optional(),
  "Calendar IDs": AirtableStringFieldSchema,

  // Availability preferences
  Timezone: AirtableStringFieldSchema,
  "Working Hours Start": AirtableStringFieldSchema,
  "Working Hours End": AirtableStringFieldSchema,
  "Off Days": z
    .union([z.array(z.string()), z.null(), z.undefined()])
    .transform((val) => {
      if (!val || val.length === 0) return [];
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return val
        .map((d) => {
          if (typeof d === "string") {
            const index = dayNames.indexOf(d);
            return index !== -1 ? index : parseInt(d.trim(), 10);
          }
          return parseInt(String(d), 10);
        })
        .filter((d) => !isNaN(d) && d >= 0 && d <= 6);
    }),

  // Linguist profile fields
  Languages: AirtableArrayFieldSchema,
  Specialization: AirtableArrayFieldSchema,
  "Hourly Rate": AirtableNumberFieldSchema,
  Currency: AirtableStringFieldSchema,
  Rating: z
    .union([z.number().min(1).max(5), z.null(), z.undefined()])
    .optional(),
});

/**
 * Inferred type from Airtable User fields schema
 */
export type AirtableUserFields = z.infer<typeof AirtableUserFieldsSchema>;

/**
 * Parse and validate Airtable user record fields
 * Returns undefined for invalid data instead of throwing
 */
export function parseAirtableUserFields(
  data: unknown,
): AirtableUserFields | undefined {
  const result = AirtableUserFieldsSchema.safeParse(data);
  return result.success ? result.data : undefined;
}

/**
 * Parse Airtable user fields with strict validation (throws on error)
 */
export function parseAirtableUserFieldsStrict(
  data: unknown,
): AirtableUserFields {
  return AirtableUserFieldsSchema.parse(data);
}

// ============================================================================
// Helper Functions for Field Parsing
// ============================================================================

/**
 * Parse an array field from Airtable (handles both array and comma-separated string)
 */
export function parseArrayField(field: unknown): string[] {
  const result = AirtableArrayFieldSchema.safeParse(field);
  return result.success ? result.data : [];
}

/**
 * Parse user preferences from Airtable fields
 */
export function parseUserPreferences(fields: Record<string, unknown>): {
  timezone?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  offDays: number[];
} {
  const parsed = AirtableUserFieldsSchema.partial().safeParse(fields);

  if (!parsed.success) {
    return { offDays: [] };
  }

  const data = parsed.data;
  return {
    timezone: data.Timezone ?? undefined,
    workingHoursStart: data["Working Hours Start"] ?? undefined,
    workingHoursEnd: data["Working Hours End"] ?? undefined,
    offDays: data["Off Days"] ?? [],
  };
}

// ============================================================================
// Linguist Response Schemas
// ============================================================================

/**
 * Schema for setup status
 */
export const SetupStatusSchema = z.object({
  isComplete: z.boolean(),
  missingItems: z.array(z.string()),
});

/**
 * Schema for availability data
 */
export const AvailabilitySchema = z
  .object({
    isAvailable: z.boolean(),
    freeSlots: z.array(
      z.object({
        start: z.string(),
        end: z.string(),
      }),
    ),
    totalFreeHours: z.number(),
  })
  .nullable();

/**
 * Schema for linguist with availability
 */
export const LinguistWithAvailabilitySchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  picture: z.string().optional(),
  languages: z.array(z.string()).optional(),
  specialization: z.array(z.string()).optional(),
  hourlyRate: z.number().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  setupStatus: SetupStatusSchema,
  availability: AvailabilitySchema,
});

export type LinguistWithAvailabilityData = z.infer<
  typeof LinguistWithAvailabilitySchema
>;
