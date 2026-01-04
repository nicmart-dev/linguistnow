/**
 * Schema synchronization script for Airtable Users table
 * Uses Airtable Meta API to automatically create missing fields
 *
 * Run via: npm run airtable:sync
 * Or: tsx server/airtable/sync-schema.ts
 *
 * Note: This requires Airtable Enterprise plan with Meta API access
 * Reference: https://airtable.com/developers/web/api/meta-introduction
 */

// Load environment variables FIRST, before importing modules that use env
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const envConfig = dotenv.config();
if (envConfig.error) {
  const errorCode = (envConfig.error as NodeJS.ErrnoException).code;
  if (errorCode === "ENOENT") {
    console.log("No .env file found - using environment variables from system");
  } else {
    console.error("Error loading .env file:", envConfig.error);
  }
}
dotenvExpand.expand(envConfig);

// Import modules that use env AFTER dotenv is loaded
import { env } from "../env.js";
import {
  UsersTableSchema,
  getFieldNames,
  type AirtableFieldDefinition,
} from "./schema.js";
import { validateSchema } from "./validate-schema.js";

interface AirtableFieldResponse {
  id: string;
  name: string;
  type: string;
  description?: string;
  options?: {
    choices?: Array<{ id: string; name: string; color?: string }>;
    precision?: number;
  };
}

interface AirtableTableResponse {
  id: string;
  name: string;
  fields: AirtableFieldResponse[];
}

interface AirtableBaseResponse {
  tables: AirtableTableResponse[];
}

interface SyncResult {
  field: string;
  status: "created" | "exists" | "error";
  message: string;
  error?: string;
}

interface SyncReport {
  success: boolean;
  results: SyncResult[];
  created: number;
  existing: number;
  errors: number;
}

/**
 * Get Airtable API token
 */
function getAirtableToken(): string {
  const token =
    env.AIRTABLE_PERSONAL_ACCESS_TOKEN || env.AIRTABLE_API_KEY || "";
  if (!token) {
    throw new Error(
      "AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY must be set",
    );
  }
  return token;
}

/**
 * Map schema field type to Airtable API field type
 */
function mapFieldTypeToAirtable(fieldDef: AirtableFieldDefinition): string {
  const typeMap: Record<string, string> = {
    email: "email",
    singleLineText: "singleLineText",
    url: "url",
    singleSelect: "singleSelect",
    multipleSelects: "multipleSelects",
    number: "number",
    currency: "currency", // Airtable's Currency field type (displays as currency, stores as number)
    rating: "rating", // Airtable's Rating field type (stars 1-5)
    checkbox: "checkbox",
    date: "date",
    dateTime: "dateTime",
    phoneNumber: "phoneNumber",
    multilineText: "multilineText",
  };

  return typeMap[fieldDef.type] || fieldDef.type;
}

/**
 * Build Airtable field options based on schema definition
 */
function buildFieldOptions(
  fieldDef: AirtableFieldDefinition,
): Record<string, unknown> | undefined {
  const options: Record<string, unknown> = {};

  // Handle select fields with options
  if (
    (fieldDef.type === "singleSelect" || fieldDef.type === "multipleSelects") &&
    fieldDef.options
  ) {
    options.choices = fieldDef.options.map((choice) => ({
      name: choice,
    }));
  }

  // Handle number precision (for number and currency fields)
  if (
    (fieldDef.type === "number" || fieldDef.type === "currency") &&
    fieldDef.precision !== undefined
  ) {
    options.precision = fieldDef.precision;
  }

  // Handle currency symbol (for currency fields)
  if (fieldDef.type === "currency") {
    options.symbol = "USD"; // Default to USD, can be customized
  }

  return Object.keys(options).length > 0 ? options : undefined;
}

/**
 * Get table ID from Airtable base
 */
async function getTableId(
  baseId: string,
  tableName: string,
  token: string,
): Promise<string> {
  const response = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch tables: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = (await response.json()) as AirtableBaseResponse;
  const table = data.tables.find((t) => t.name === tableName);

  if (!table) {
    throw new Error(`Table '${tableName}' not found in base`);
  }

  return table.id;
}

/**
 * Get existing fields from Airtable table
 */
async function getExistingFields(
  baseId: string,
  tableId: string,
  token: string,
): Promise<Map<string, AirtableFieldResponse>> {
  const response = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch table schema: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = (await response.json()) as AirtableTableResponse;
  const fieldMap = new Map<string, AirtableFieldResponse>();

  for (const field of data.fields) {
    fieldMap.set(field.name, field);
  }

  return fieldMap;
}

/**
 * Create a new field in Airtable
 */
async function createField(
  baseId: string,
  tableId: string,
  fieldName: string,
  fieldDef: AirtableFieldDefinition,
  token: string,
): Promise<SyncResult> {
  const airtableType = mapFieldTypeToAirtable(fieldDef);
  const options = buildFieldOptions(fieldDef);

  const fieldPayload: Record<string, unknown> = {
    name: fieldName,
    type: airtableType,
  };

  if (fieldDef.description) {
    fieldPayload.description = fieldDef.description;
  }

  if (options) {
    fieldPayload.options = options;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fieldPayload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        (errorData as { error?: { message?: string } })?.error?.message ||
        response.statusText;
      throw new Error(
        `Failed to create field: ${response.status} - ${errorMessage}`,
      );
    }

    return {
      field: fieldName,
      status: "created",
      message: `Created field '${fieldName}' (type: ${airtableType})`,
    };
  } catch (error) {
    return {
      field: fieldName,
      status: "error",
      message: `Failed to create field '${fieldName}'`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Synchronize schema with Airtable base
 * Creates missing fields but does not modify existing fields
 */
export async function syncSchema(): Promise<SyncReport> {
  const token = getAirtableToken();
  const baseId = env.AIRTABLE_BASE_ID;
  const tableName = UsersTableSchema.tableName;

  console.log(
    `\n🔄 Syncing schema for table '${tableName}' in base '${baseId}'...\n`,
  );

  try {
    // Get table ID
    let tableId: string;
    try {
      tableId = await getTableId(baseId, tableName, token);
      console.log(`✓ Found table '${tableName}' (ID: ${tableId})\n`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("403")) {
        console.error("\n❌ Error: Meta API access denied (403 Forbidden)");
        console.error("\nThis typically means:");
        console.error(
          "  1. Your Airtable plan doesn't include Meta API access (requires Enterprise plan)",
        );
        console.error(
          "  2. Your Personal Access Token doesn't have the required permissions",
        );
        console.error("  3. The base ID or table name is incorrect");
        console.error("\n💡 Solution: Create fields manually in Airtable");
        console.error(
          "   See: docs/airtable-manual-field-setup.md for step-by-step instructions\n",
        );
      }
      throw error;
    }

    // Get existing fields
    const existingFields = await getExistingFields(baseId, tableId, token);
    console.log(`✓ Found ${existingFields.size} existing fields in Airtable\n`);

    // Validate schema first to see what's missing
    const validationReport = await validateSchema();
    const missingFields = validationReport.missingFields;

    if (missingFields.length === 0) {
      console.log("✅ All fields exist in Airtable. No sync needed.\n");
      return {
        success: true,
        results: [],
        created: 0,
        existing: getFieldNames().length,
        errors: 0,
      };
    }

    console.log(`📋 Found ${missingFields.length} missing fields to create:\n`);

    // Create missing fields
    const results: SyncResult[] = [];
    let created = 0;
    let existing = 0;
    let errors = 0;

    for (const fieldName of missingFields) {
      const fieldDef = UsersTableSchema.fields[fieldName];
      if (!fieldDef) {
        console.warn(`⚠️  Field '${fieldName}' not found in schema definition`);
        continue;
      }

      // Check if field already exists (double-check)
      if (existingFields.has(fieldName)) {
        results.push({
          field: fieldName,
          status: "exists",
          message: `Field '${fieldName}' already exists`,
        });
        existing++;
        continue;
      }

      // Create the field
      console.log(`Creating field '${fieldName}'...`);
      const result = await createField(
        baseId,
        tableId,
        fieldName,
        fieldDef,
        token,
      );
      results.push(result);

      if (result.status === "created") {
        created++;
        console.log(`  ✓ ${result.message}`);
      } else {
        errors++;
        console.error(
          `  ✗ ${result.message}: ${result.error || "Unknown error"}`,
        );
      }

      // Rate limiting: wait a bit between requests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(`\n📊 Sync Summary:`);
    console.log(`  Created: ${created}`);
    console.log(`  Existing: ${existing}`);
    console.log(`  Errors: ${errors}\n`);

    return {
      success: errors === 0,
      results,
      created,
      existing,
      errors,
    };
  } catch (error) {
    console.error("❌ Schema sync failed:", error);
    throw error;
  }
}

/**
 * Print sync report
 */
export function printSyncReport(report: SyncReport): void {
  console.log("\n📋 Airtable Schema Sync Report\n");
  console.log("=".repeat(50));

  if (report.success) {
    console.log("✅ Schema sync completed successfully\n");
  } else {
    console.log("⚠️  Schema sync completed with errors\n");
  }

  if (report.results.length > 0) {
    const created = report.results.filter((r) => r.status === "created");
    const existing = report.results.filter((r) => r.status === "exists");
    const errors = report.results.filter((r) => r.status === "error");

    if (created.length > 0) {
      console.log(`✅ Created Fields (${created.length}):`);
      for (const result of created) {
        console.log(`   - ${result.field}: ${result.message}`);
      }
      console.log();
    }

    if (existing.length > 0) {
      console.log(`ℹ️  Existing Fields (${existing.length}):`);
      for (const result of existing) {
        console.log(`   - ${result.field}`);
      }
      console.log();
    }

    if (errors.length > 0) {
      console.log(`❌ Errors (${errors.length}):`);
      for (const result of errors) {
        console.log(`   - ${result.field}: ${result.error || result.message}`);
      }
      console.log();
    }
  }

  console.log("=".repeat(50));
}

/**
 * Main execution
 */
async function main() {
  try {
    const report = await syncSchema();
    printSyncReport(report);
    process.exit(report.success ? 0 : 1);
  } catch (error) {
    console.error("Sync failed:", error);
    process.exit(1);
  }
}

// Run if executed directly (check if this file is being run, not imported)
const isMainModule =
  process.argv[1] &&
  import.meta.url.includes(process.argv[1].replace(/\\/g, "/"));
if (isMainModule) {
  void main();
}
