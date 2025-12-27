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
*/
const airtableApiKey =
  env.AIRTABLE_PERSONAL_ACCESS_TOKEN || env.AIRTABLE_API_KEY || "";
const base = new Airtable({ apiKey: airtableApiKey }).base(
  env.AIRTABLE_BASE_ID,
);

interface AirtableUserFields {
  Email: string;
  Name: string;
  Picture?: string;
  Role?: string;
  "Calendar IDs"?: string;
  "Access Token"?: string;
  "Refresh Token"?: string;
}

interface CreateUserRequest {
  email: string;
  name: string;
  picture_url: string;
  role?: string;
}

interface UpdateUserRequest {
  calendarIds?: string[];
  googleAccessToken?: string;
  googleRefreshToken?: string;
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
    const records = await base("Users").select().all();
    const users = records.map(
      (record) => record.fields as unknown as AirtableUserFields,
    );
    res.json(users);
  } catch (error) {
    console.log("Error getting users", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/* GET /users/:id
Get a single user details based on their email address, set as primary key in Airtable */
export const getOne = async (req: Request<{ id: string }>, res: Response) => {
  const userEmail = req.params.id;
  // Escape single quotes in email to prevent formula injection
  const escapedEmail = escapeAirtableFormulaString(userEmail);
  try {
    const records = await base("Users")
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
    console.log("Error getting single user", error);
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
    const createdRecord = await base("Users").create({
      Email: email,
      Name: name,
      Picture: picture_url,
      Role: role,
    });
    res.json(createdRecord.fields as unknown as AirtableUserFields);
  } catch (error) {
    console.log("Error creating user", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

/* PUT /users/:id
Update lists of calendars, and Google oAuth2 tokens for a user.
Used when user selects calendars and saves them in the account settings, 
or when the access token is refreshed. */
export const update = async (
  req: Request<{ id: string }, Record<string, never>, UpdateUserRequest>,
  res: Response,
) => {
  const userEmail = req.params.id;
  const { calendarIds, googleAccessToken, googleRefreshToken } = req.body;
  // Escape single quotes in email to prevent formula injection
  const escapedEmail = escapeAirtableFormulaString(userEmail);
  try {
    // Find the record with the matching email address
    const records = await base("Users")
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
      if (googleAccessToken) fieldsToUpdate["Access Token"] = googleAccessToken;
      if (googleRefreshToken)
        fieldsToUpdate["Refresh Token"] = googleRefreshToken;

      // Check if any fields to update
      if (Object.keys(fieldsToUpdate).length > 0) {
        const updatedRecord = await base("Users").update(
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
    console.log("Error updating user", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

/* DELETE /users/:id
Delete user from Airtable by their record ID (not currently used) */
export const remove = async (req: Request<{ id: string }>, res: Response) => {
  const recordId = req.params.id;
  try {
    await base("Users").destroy(recordId);
    res.json({ message: "Deleted user", id: recordId });
  } catch (error) {
    console.log("Error deleting user", error);
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
