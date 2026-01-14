/**
 * Airtable schema definition for the Users table
 * This defines the expected structure of fields in Airtable
 * Used for validation and documentation purposes
 */

export interface AirtableFieldDefinition {
  type: string;
  required?: boolean;
  primaryKey?: boolean;
  default?: unknown;
  options?: string[];
  precision?: number;
  deprecated?: boolean;
  description?: string;
}

export interface AirtableTableSchema {
  tableName: string;
  fields: Record<string, AirtableFieldDefinition>;
}

export const UsersTableSchema: AirtableTableSchema = {
  tableName: "Users",
  fields: {
    // Core fields
    Email: {
      type: "email",
      required: true,
      primaryKey: true,
      description: "User's email address (primary key)",
    },
    Name: {
      type: "singleLineText",
      required: true,
      description: "User's full name",
    },
    Picture: {
      type: "url",
      description: "Profile picture URL",
    },
    Role: {
      type: "singleSelect",
      options: ["Project Manager", "Linguist"],
      description: "User role",
    },
    "Calendar IDs": {
      type: "singleLineText",
      description: "Comma-separated list of Google Calendar IDs",
    },

    // EXISTING - Availability preferences (PR 121)
    Timezone: {
      type: "singleLineText",
      description: "IANA timezone identifier (e.g., 'America/New_York')",
    },
    "Working Hours Start": {
      type: "singleLineText",
      description:
        "Start of workday in ISO 8601 time format (HH:mm, e.g., '08:00')",
    },
    "Working Hours End": {
      type: "singleLineText",
      description:
        "End of workday in ISO 8601 time format (HH:mm, e.g., '18:00')",
    },
    "Off Days": {
      type: "multipleSelects",
      description:
        "Days off as comma-separated day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)",
    },

    // NEW - Linguist profile fields (to be added)
    Languages: {
      type: "multipleSelects",
      options: [
        "EN-FR",
        "EN-ES",
        "EN-DE",
        "EN-ZH",
        "EN-JA",
        "EN-KO",
        "EN-AR",
        "EN-RU",
        "EN-IT",
        "EN-PT",
        "FR-EN",
        "ES-EN",
        "DE-EN",
        "ZH-EN",
        "JA-EN",
        "KO-EN",
        "AR-EN",
        "RU-EN",
        "IT-EN",
        "PT-EN",
      ],
      description: "Language pairs the linguist can translate",
    },
    Specialization: {
      type: "multipleSelects",
      options: [
        "Legal",
        "Medical",
        "Technical",
        "Marketing",
        "Financial",
        "Literary",
        "Academic",
        "General",
      ],
      description: "Domain expertise areas",
    },
    "Hourly Rate": {
      type: "currency", // Airtable's Currency field type (displays as currency, stores as number)
      precision: 2,
      description: "Hourly rate",
    },
    Currency: {
      type: "singleSelect",
      options: [
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "CNY",
        "CAD",
        "AUD",
        "CHF",
        "INR",
        "BRL",
        "MXN",
        "KRW",
        "ZAR",
        "SGD",
      ],
      description: "Currency code for hourly rate (ISO 4217)",
    },
    Rating: {
      type: "rating", // Airtable's Rating field type (displays as stars, stores as number 1-5)
      description: "Average rating from 1-5",
    },
  },
};

/**
 * Get field definition for a specific field
 */
export function getFieldDefinition(
  fieldName: string,
): AirtableFieldDefinition | undefined {
  return UsersTableSchema.fields[fieldName];
}

/**
 * Get all field names
 */
export function getFieldNames(): string[] {
  return Object.keys(UsersTableSchema.fields);
}

/**
 * Get all required field names
 */
export function getRequiredFields(): string[] {
  return Object.entries(UsersTableSchema.fields)
    .filter(([, def]) => def.required)
    .map(([name]) => name);
}
