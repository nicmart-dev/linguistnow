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
Update lists of calendars for a user.
Used when user selects calendars and saves them in the account settings.
Tokens are now stored in Vault, not Airtable. */
export const update = async (
  req: Request<{ id: string }, Record<string, never>, UpdateUserRequest>,
  res: Response,
) => {
  const userEmail = req.params.id;
  const { calendarIds } = req.body;
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
      if (calendarIds) fieldsToUpdate["Calendar IDs"] = calendarIds.join(",");

      // Check if any fields to update
      if (Object.keys(fieldsToUpdate).length > 0) {
        const updatedRecord = await getAirtableBase()("Users").update(
          recordId,
          fieldsToUpdate,
        );
        res.json(updatedRecord.fields as unknown as AirtableUserFields);
      } else {
        res.status(400).json({ error: "No fields provided for update" });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user", error);
    res.status(500).json({ error: "Failed to update user" });
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
