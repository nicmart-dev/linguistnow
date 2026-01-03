import type { Request, Response } from "express";
import Airtable from "airtable";
import { env } from "../env.js";

/**
 * Escape single quotes in Airtable formula strings to prevent formula injection.
 * Airtable uses single quotes for string literals, so we need to escape them.
 * @param value - The string value to escape
 * @returns The escaped string safe for use in Airtable formulas
 */
function escapeAirtableFormulaString(value: string): string {
  // Escape single quotes by doubling them (Airtable formula syntax)
  return value.replace(/'/g, "''");
}

/* Configure Airtable DB using token, created using https://airtable.com/create/tokens
and connecting to associated base ID https://support.airtable.com/docs/finding-airtable-ids
Lazy initialization to ensure dotenv is loaded before accessing env
*/
function getAirtableBase() {
  const airtableApiKey =
    env.AIRTABLE_PERSONAL_ACCESS_TOKEN || env.AIRTABLE_API_KEY || "";
  return new Airtable({ apiKey: airtableApiKey }).base(env.AIRTABLE_BASE_ID);
}

interface AirtableUserFields {
  Email: string;
  Name: string;
  Picture?: string;
  Role?: string;
  "Calendar IDs"?: string;
  Timezone?: string;
  "Working Hours Start"?: string; // ISO 8601 time format (HH:mm, e.g., "08:00")
  "Working Hours End"?: string; // ISO 8601 time format (HH:mm, e.g., "18:00")
  "Off Days"?: string[] | string; // Array for dropdown field, or comma-separated string for backward compatibility
  "Min Hours Per Day"?: number;
  // Tokens are now stored in Vault, not Airtable
}

interface CreateUserRequest {
  email: string;
  name: string;
  picture_url: string;
  role?: string;
}

interface UpdateUserRequest {
  calendarIds?: string[];
  availabilityPreferences?: {
    timezone?: string;
    workingHoursStart?: number;
    workingHoursEnd?: number;
    offDays?: number[];
  };
  // Tokens are now stored in Vault, not Airtable
}

/* GET /users
Get all users from Airtable alongside all their fields */
export const getAll = async (
  _req: Request<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>
  >,
  res: Response,
) => {
  try {
    const records = await getAirtableBase()("Users").select().all();
    const users = records.map(
      (record) => record.fields as unknown as AirtableUserFields,
    );
    res.json(users);
  } catch (error) {
    console.error("Error getting users", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Check if a user exists in Airtable by email
 * @param userEmail - User's email address
 * @returns true if user exists, false otherwise
 */
export async function userExistsInAirtable(
  userEmail: string,
): Promise<boolean> {
  const escapedEmail = escapeAirtableFormulaString(userEmail);
  try {
    const records = await getAirtableBase()("Users")
      .select({
        filterByFormula: `{Email} = '${escapedEmail}'`,
        maxRecords: 1,
      })
      .firstPage();
    return records.length > 0;
  } catch (error) {
    console.log("Error checking if user exists in Airtable", error);
    return false;
  }
}

/* GET /users/:id
Get a single user details based on their email address, set as primary key in Airtable */
export const getOne = async (req: Request<{ id: string }>, res: Response) => {
  const userEmail = req.params.id;
  // Escape single quotes in email to prevent formula injection
  const escapedEmail = escapeAirtableFormulaString(userEmail);
  try {
    const records = await getAirtableBase()("Users")
      .select({
        filterByFormula: `{Email} = '${escapedEmail}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length > 0) {
      const record = records[0];
      res.json(record.fields as unknown as AirtableUserFields);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error getting single user", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/* POST /users
Create new user upon first log in based on information from Google User API */
export const create = async (
  req: Request<Record<string, never>, Record<string, never>, CreateUserRequest>,
  res: Response,
) => {
  const { email, name, picture_url, role = "Linguist" } = req.body;
  try {
    const createdRecord = await getAirtableBase()("Users").create({
      Email: email,
      Name: name,
      Picture: picture_url,
      Role: role,
    });
    res.json(createdRecord.fields as unknown as AirtableUserFields);
  } catch (error) {
    console.error("Error creating user", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

/* PUT /users/:id
Update lists of calendars and availability preferences for a user.
Used when user selects calendars and saves them in the account settings.
Tokens are now stored in Vault, not Airtable. */
export const update = async (
  req: Request<{ id: string }, Record<string, never>, UpdateUserRequest>,
  res: Response,
) => {
  const userEmail = req.params.id;
  const { calendarIds, availabilityPreferences } = req.body;

  // Debug logging
  console.log("Update user request:", {
    userEmail,
    hasCalendarIds: !!calendarIds,
    hasAvailabilityPreferences: !!availabilityPreferences,
    availabilityPreferences,
  });

  // Escape single quotes in email to prevent formula injection
  const escapedEmail = escapeAirtableFormulaString(userEmail);
  try {
    // Find the record with the matching email address
    const records = await getAirtableBase()("Users")
      .select({
        filterByFormula: `{Email} = '${escapedEmail}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length > 0) {
      const recordId = records[0].id;
      const fieldsToUpdate: Partial<AirtableUserFields> =
        {} as Partial<AirtableUserFields>;

      // Update the fields if provided
      // IMPORTANT: Store only calendar IDs (not display names) for privacy
      // Calendar IDs can be email addresses (primary calendars) or alphanumeric strings (secondary calendars)
      if (calendarIds) fieldsToUpdate["Calendar IDs"] = calendarIds.join(",");

      // Update availability preferences if provided
      if (availabilityPreferences) {
        console.log(
          "Processing availability preferences:",
          availabilityPreferences,
        );
        // Only set timezone if it's a non-empty string
        if (
          availabilityPreferences.timezone !== undefined &&
          typeof availabilityPreferences.timezone === "string" &&
          availabilityPreferences.timezone.trim() !== ""
        ) {
          fieldsToUpdate["Timezone"] = availabilityPreferences.timezone.trim();
        }
        // Set workingHoursStart - validate HH:mm format
        if (
          availabilityPreferences.workingHoursStart !== undefined &&
          typeof availabilityPreferences.workingHoursStart === "string"
        ) {
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (timeRegex.test(availabilityPreferences.workingHoursStart)) {
            fieldsToUpdate["Working Hours Start"] =
              availabilityPreferences.workingHoursStart;
          }
        }
        // Set workingHoursEnd - validate HH:mm format
        if (
          availabilityPreferences.workingHoursEnd !== undefined &&
          typeof availabilityPreferences.workingHoursEnd === "string"
        ) {
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (timeRegex.test(availabilityPreferences.workingHoursEnd)) {
            fieldsToUpdate["Working Hours End"] =
              availabilityPreferences.workingHoursEnd;
          }
        }
        // Handle offDays - convert to array of day names for Airtable dropdown field
        if (availabilityPreferences.offDays !== undefined) {
          if (
            Array.isArray(availabilityPreferences.offDays) &&
            availabilityPreferences.offDays.length > 0
          ) {
            // Map day numbers to day names for readability in Airtable dropdown
            const dayNames = [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ];
            // Filter out invalid values and convert to day names
            const validOffDays = availabilityPreferences.offDays
              .filter(
                (day) =>
                  typeof day === "number" &&
                  !isNaN(day) &&
                  day >= 0 &&
                  day <= 6,
              )
              .map((day) => dayNames[day]); // Convert to day names for Airtable dropdown
            // Only set if we have valid days
            if (validOffDays.length > 0) {
              // Airtable dropdown fields accept arrays of strings
              fieldsToUpdate["Off Days"] = validOffDays;
            }
            // If no valid days, don't set the field (let Airtable keep existing value)
          }
          // If array is empty or undefined, don't set the field
        }
        // Note: minHoursPerDay is not a linguist preference - it's a PM requirement set in availability requests
      }

      // Check if any fields to update
      if (Object.keys(fieldsToUpdate).length > 0) {
        console.log("Fields to update:", fieldsToUpdate);
        try {
          const updatedRecord = await getAirtableBase()("Users").update(
            recordId,
            fieldsToUpdate,
          );
          console.log("Successfully updated user:", updatedRecord.fields);
          res.json(updatedRecord.fields as unknown as AirtableUserFields);
        } catch (airtableError: unknown) {
          console.error("Airtable update error:", airtableError);
          console.error("Fields that were attempted:", fieldsToUpdate);

          // Extract Airtable error message if available
          let errorMessage = "Failed to update user in Airtable";
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
            }
          }

          console.error(
            "Airtable error details:",
            JSON.stringify(errorDetails, null, 2),
          );
          if (invalidField) {
            console.error(`Invalid field detected: ${invalidField}`);
          }

          res.status(500).json({
            error: "Failed to update user",
            details: errorMessage,
            code: "AIRTABLE_UPDATE_ERROR",
            invalidField,
            airtableError: errorDetails,
            attemptedFields: Object.keys(fieldsToUpdate),
          });
          return;
        }
      } else {
        res.status(400).json({ error: "No fields provided for update" });
        return;
      }
    } else {
      res.status(404).json({ error: "User not found" });
      return;
    }
  } catch (error) {
    console.error("Error updating user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: "Failed to update user",
      details: errorMessage,
    });
  }
};

/* DELETE /users/:id
Delete user from Airtable and Vault by their email address.
Allows linguists to remove themselves from the database. */
export const remove = async (req: Request<{ id: string }>, res: Response) => {
  const userEmail = req.params.id;

  // Basic email validation with length check to prevent ReDoS
  // Email addresses are typically under 254 characters (RFC 5321)
  if (!userEmail || userEmail.length > 254) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Escape single quotes in email to prevent formula injection
  const escapedEmail = escapeAirtableFormulaString(userEmail);
  try {
    // Find the record with the matching email address
    const records = await getAirtableBase()("Users")
      .select({
        filterByFormula: `{Email} = '${escapedEmail}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length > 0) {
      const recordId = records[0].id;
      // Delete from Airtable
      await getAirtableBase()("Users").destroy(recordId);

      // Delete tokens from Vault
      try {
        const { deleteToken } = await import("../utils/vaultClient.js");
        await deleteToken(userEmail);
        // Safe to log: email is validated and escaped before use
        console.log("Deleted tokens from Vault for user:", userEmail);
      } catch (vaultError) {
        // Log error but don't fail the request - Airtable deletion succeeded
        // Safe to log: email is validated and escaped before use
        console.error(
          "Failed to delete tokens from Vault for user:",
          userEmail,
          vaultError,
        );
      }

      res.json({ message: "Deleted user", email: userEmail });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error deleting user", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export default {
  getAll,
  getOne,
  create,
  update,
  remove,
};
