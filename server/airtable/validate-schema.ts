/**
 * Schema validation script for Airtable Users table
 * Compares actual Airtable structure against expected schema definition
 *
 * Run via: npm run airtable:validate
 * Or: tsx server/airtable/validate-schema.ts
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
import Airtable from "airtable";
import { env } from "../env.js";
import {
  UsersTableSchema,
  getFieldNames,
  getRequiredFields,
} from "./schema.js";

interface ValidationResult {
  field: string;
  status: "missing" | "extra" | "type_mismatch" | "options_mismatch" | "ok";
  expected?: string;
  actual?: string;
  message: string;
  expectedOptions?: string[];
  actualOptions?: string[];
}

interface ValidationReport {
  isValid: boolean;
  results: ValidationResult[];
  missingFields: string[];
  extraFields: string[];
  typeMismatches: ValidationResult[];
  optionsMismatches: ValidationResult[];
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
 * Infer field type from Airtable field value
 */
function inferFieldType(value: unknown): string {
  if (value === null || value === undefined) {
    return "unknown";
  }
  if (typeof value === "string") {
    // Check if it's a URL
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return "url";
    }
    // Check if it's an email
    if (value.includes("@") && value.includes(".")) {
      return "email";
    }
    return "singleLineText";
  }
  if (typeof value === "number") {
    return "number";
  }
  if (Array.isArray(value)) {
    return "multipleSelects";
  }
  if (typeof value === "boolean") {
    return "checkbox";
  }
  // Note: Airtable Rating field type stores as number, so we can't distinguish it from number type
  // This is fine - both number and rating types are compatible
  return typeof value;
}

interface FieldInfo {
  type: string;
  options?: string[];
}

/**
 * Try to get table schema using Meta API (if available)
 * Returns null if Meta API is not available
 */
async function tryGetSchemaFromMetaAPI(): Promise<Map<
  string,
  FieldInfo
> | null> {
  try {
    const token =
      env.AIRTABLE_PERSONAL_ACCESS_TOKEN || env.AIRTABLE_API_KEY || "";
    if (!token) return null;

    const baseId = env.AIRTABLE_BASE_ID;
    const tableName = UsersTableSchema.tableName;

    // Try to get table schema via Meta API
    const tablesResponse = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!tablesResponse.ok) {
      return null; // Meta API not available
    }

    const tablesData = (await tablesResponse.json()) as {
      tables: Array<{ id: string; name: string }>;
    };
    const table = tablesData.tables.find((t) => t.name === tableName);
    if (!table) return null;

    const tableResponse = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!tableResponse.ok) {
      return null;
    }

    const tableData = (await tableResponse.json()) as {
      fields: Array<{
        name: string;
        type: string;
        options?: {
          choices?: Array<{ name: string }>;
        };
      }>;
    };
    const fieldMap = new Map<string, FieldInfo>();
    for (const field of tableData.fields) {
      const options =
        field.options?.choices?.map((choice) => choice.name) || undefined;
      fieldMap.set(field.name, { type: field.type, options });
    }
    return fieldMap;
  } catch {
    return null; // Meta API not available or error
  }
}

/**
 * Validate Airtable schema against expected schema
 */
export async function validateSchema(): Promise<ValidationReport> {
  const base = getAirtableBase();
  const table = base(UsersTableSchema.tableName);
  const expectedFields = getFieldNames();
  const requiredFields = getRequiredFields();

  const results: ValidationResult[] = [];
  const missingFields: string[] = [];
  const typeMismatches: ValidationResult[] = [];
  const optionsMismatches: ValidationResult[] = [];

  try {
    // Try to get schema from Meta API first (more reliable)
    const metaApiFields = await tryGetSchemaFromMetaAPI();
    let actualFields: string[] = [];
    const fieldTypeMap: Map<string, string> = new Map();
    const fieldOptionsMap: Map<string, string[]> = new Map();

    if (metaApiFields) {
      // Use Meta API results
      actualFields = Array.from(metaApiFields.keys());
      for (const [fieldName, fieldInfo] of metaApiFields) {
        fieldTypeMap.set(fieldName, fieldInfo.type);
        if (fieldInfo.options) {
          fieldOptionsMap.set(fieldName, fieldInfo.options);
        }
      }
      console.log("ℹ️  Using Meta API to get table schema (more accurate)\n");
    } else {
      // Fallback to record-based detection
      // Fetch multiple records to increase chance of finding all fields
      const records = await table.select({ maxRecords: 10 }).firstPage();

      if (records.length === 0) {
        console.warn(
          "⚠️  No records found in Users table. Cannot validate field types using records.",
        );
        console.warn(
          "💡 Tip: Add a test record with values in all fields, or use Meta API (Enterprise plan) for accurate validation.\n",
        );
        // Still check for missing required fields
        for (const field of requiredFields) {
          missingFields.push(field);
          results.push({
            field,
            status: "missing",
            message: `Required field '${field}' not found in any records`,
          });
        }
        return {
          isValid: missingFields.length === 0,
          results,
          missingFields,
          extraFields: [],
          typeMismatches: [],
        };
      }

      // Collect all fields from all records (fields might be empty in some records)
      const allFieldsSet = new Set<string>();
      for (const record of records) {
        Object.keys(record.fields).forEach((field) => allFieldsSet.add(field));
      }
      actualFields = Array.from(allFieldsSet);
      console.log(
        `ℹ️  Using record-based detection (found ${actualFields.length} fields across ${records.length} records)\n`,
      );
    }

    // Check for missing expected fields
    for (const field of expectedFields) {
      if (!actualFields.includes(field)) {
        const isRequired = requiredFields.includes(field);
        missingFields.push(field);
        results.push({
          field,
          status: "missing",
          expected: UsersTableSchema.fields[field]?.type,
          message: `Field '${field}' is ${isRequired ? "required" : "expected"} but not found in Airtable`,
        });
      } else {
        // Field exists, check type compatibility
        const expectedType = UsersTableSchema.fields[field]?.type;

        // Try to get actual type from Meta API if available
        let actualType: string | undefined;
        if (fieldTypeMap.has(field)) {
          actualType = fieldTypeMap.get(field);
        }

        // Fallback to inferring from value if Meta API not available
        let inferredType: string;
        if (actualType) {
          inferredType = actualType;
        } else {
          // Need to find a record with this field populated
          const base = getAirtableBase();
          const table = base(UsersTableSchema.tableName);
          const records = await table.select({ maxRecords: 10 }).firstPage();
          let actualValue: unknown = null;
          for (const record of records) {
            const fieldValue = record.fields[field];
            if (
              field in record.fields &&
              fieldValue !== null &&
              fieldValue !== undefined
            ) {
              actualValue = fieldValue;
              break;
            }
          }
          inferredType = inferFieldType(actualValue);
        }

        // Type checking is lenient - just warn on obvious mismatches
        // Note: "rating" and "currency" types are compatible with "number" since they store as number
        const isCompatibleType =
          (expectedType === "rating" && inferredType === "number") ||
          (expectedType === "currency" && inferredType === "number") ||
          (expectedType === "number" && inferredType === "number") ||
          (expectedType === "email" &&
            (inferredType === "email" || inferredType === "singleLineText"));

        if (
          expectedType === "email" &&
          inferredType !== "email" &&
          inferredType !== "singleLineText"
        ) {
          const mismatchResult = {
            field,
            status: "type_mismatch" as const,
            expected: expectedType ?? "unknown",
            actual: inferredType,
            message: `Field '${field}' expected type '${expectedType ?? "unknown"}' but found '${inferredType}'`,
          };
          typeMismatches.push(mismatchResult);
          results.push(mismatchResult);
        } else if (expectedType === "rating" && inferredType === "number") {
          // Rating field type is compatible - it stores as number
          results.push({
            field,
            status: "ok",
            expected: expectedType ?? "unknown",
            actual: "rating (stored as number)",
            message: `Field '${field}' exists (Rating field type, compatible with number)`,
          });
        } else if (expectedType === "currency" && inferredType === "number") {
          // Currency field type is compatible - it stores as number
          results.push({
            field,
            status: "ok",
            expected: expectedType ?? "unknown",
            actual: "currency (stored as number)",
            message: `Field '${field}' exists (Currency field type, compatible with number)`,
          });
        } else {
          results.push({
            field,
            status: "ok",
            expected: expectedType ?? "unknown",
            actual: inferredType,
            message: `Field '${field}' exists (expected: ${expectedType ?? "unknown"}, actual: ${inferredType})`,
          });
        }

        // Validate field options for singleSelect and multipleSelects fields
        const fieldDef = UsersTableSchema.fields[field];
        if (
          fieldDef &&
          (fieldDef.type === "singleSelect" ||
            fieldDef.type === "multipleSelects") &&
          fieldDef.options
        ) {
          const expectedOptions = fieldDef.options.sort();
          const actualOptions = fieldOptionsMap.get(field);

          if (actualOptions) {
            // Compare options (case-insensitive, sorted)
            const actualOptionsSorted = actualOptions
              .map((opt) => opt.toUpperCase())
              .sort();
            const expectedOptionsSorted = expectedOptions
              .map((opt) => opt.toUpperCase())
              .sort();

            const missingOptions = expectedOptionsSorted.filter(
              (opt) => !actualOptionsSorted.includes(opt),
            );
            const extraOptions = actualOptionsSorted.filter(
              (opt) => !expectedOptionsSorted.includes(opt),
            );

            if (missingOptions.length > 0 || extraOptions.length > 0) {
              const mismatchResult: ValidationResult = {
                field,
                status: "options_mismatch",
                expected: expectedType ?? "unknown",
                actual: inferredType,
                expectedOptions: expectedOptions,
                actualOptions: actualOptions,
                message: `Field '${field}' options mismatch. Missing: ${missingOptions.join(", ") || "none"}. Extra: ${extraOptions.join(", ") || "none"}`,
              };
              optionsMismatches.push(mismatchResult);
              // Replace the previous "ok" result with the mismatch result
              const okIndex = results.findIndex(
                (r) => r.field === field && r.status === "ok",
              );
              if (okIndex !== -1) {
                results[okIndex] = mismatchResult;
              } else {
                results.push(mismatchResult);
              }
            } else {
              // Options match - update the message to include option count
              const okIndex = results.findIndex(
                (r) => r.field === field && r.status === "ok",
              );
              if (okIndex !== -1) {
                results[okIndex].message =
                  `Field '${field}' exists with correct options (${actualOptions.length} options)`;
              }
            }
          } else {
            // Options not available from Meta API, try to infer from records
            const base = getAirtableBase();
            const table = base(UsersTableSchema.tableName);
            const records = await table.select({ maxRecords: 10 }).firstPage();
            const foundOptions = new Set<string>();
            for (const record of records) {
              const value = record.fields[field];
              if (Array.isArray(value)) {
                value.forEach((v) => foundOptions.add(String(v)));
              } else if (value !== null && value !== undefined) {
                foundOptions.add(String(value));
              }
            }

            if (foundOptions.size > 0) {
              const actualOptionsFromRecords = Array.from(foundOptions).sort();
              const expectedOptionsSorted = expectedOptions
                .map((opt) => opt.toUpperCase())
                .sort();
              const actualOptionsSorted = actualOptionsFromRecords
                .map((opt) => opt.toUpperCase())
                .sort();

              const missingOptions = expectedOptionsSorted.filter(
                (opt) => !actualOptionsSorted.includes(opt),
              );
              const extraOptions = actualOptionsSorted.filter(
                (opt) => !expectedOptionsSorted.includes(opt),
              );

              if (missingOptions.length > 0 || extraOptions.length > 0) {
                console.warn(
                  `⚠️  Field '${field}' options validation incomplete (using record-based detection).`,
                );
                console.warn(
                  `   Expected ${expectedOptions.length} options: ${expectedOptions.join(", ")}`,
                );
                console.warn(
                  `   Found ${foundOptions.size} option(s) in records: ${actualOptionsFromRecords.join(", ")}`,
                );
                if (missingOptions.length > 0) {
                  console.warn(
                    `   ⚠️  Missing options (not found in any records): ${missingOptions.join(", ")}`,
                  );
                }
                if (extraOptions.length > 0) {
                  console.warn(
                    `   ⚠️  Extra options (not in schema): ${extraOptions.join(", ")}`,
                  );
                }
                console.warn(
                  `   💡 Note: Record-based detection only sees options that are used in records.`,
                );
                console.warn(
                  `   💡 To fully validate: Use Meta API (Enterprise plan) OR ensure all ${expectedOptions.length} options are set in Airtable and used in at least one record.\n`,
                );
              } else {
                // All expected options found in records
                console.log(
                  `✅ Field '${field}' options validated: Found all ${expectedOptions.length} expected options in records.`,
                );
              }
            }
          }
        }
      }
    }

    // Check for extra fields in Airtable (not in schema)
    const extraFields = actualFields.filter(
      (field) => !expectedFields.includes(field),
    );
    for (const field of extraFields) {
      // Skip deprecated fields
      if (field === "Access Token" || field === "Refresh Token") {
        continue;
      }
      results.push({
        field,
        status: "extra",
        message: `Field '${field}' exists in Airtable but not in schema definition`,
      });
    }

    return {
      isValid:
        missingFields.length === 0 &&
        typeMismatches.length === 0 &&
        optionsMismatches.length === 0,
      results,
      missingFields,
      extraFields,
      typeMismatches,
      optionsMismatches,
    };
  } catch (error) {
    console.error("Error validating schema:", error);
    throw error;
  }
}

/**
 * Print validation report
 */
export function printReport(report: ValidationReport): void {
  console.log("\n📋 Airtable Schema Validation Report\n");
  console.log("=".repeat(50));

  if (report.isValid) {
    console.log("✅ Schema validation PASSED\n");
  } else {
    console.log("❌ Schema validation FAILED\n");
  }

  if (report.missingFields.length > 0) {
    console.log("❌ Missing Fields:");
    for (const field of report.missingFields) {
      const def = UsersTableSchema.fields[field];
      const isRequired = def?.required ? " (REQUIRED)" : "";
      console.log(`   - ${field}${isRequired} (expected type: ${def?.type})`);
    }
    console.log();
  }

  if (report.typeMismatches.length > 0) {
    console.log("⚠️  Type Mismatches:");
    for (const mismatch of report.typeMismatches) {
      console.log(
        `   - ${mismatch.field}: expected ${String(mismatch.expected ?? "unknown")}, found ${String(mismatch.actual ?? "unknown")}`,
      );
    }
    console.log();
  }

  if (report.optionsMismatches.length > 0) {
    console.log("⚠️  Options Mismatches:");
    for (const mismatch of report.optionsMismatches) {
      console.log(`   - ${mismatch.field}: ${mismatch.message}`);
      if (mismatch.expectedOptions && mismatch.actualOptions) {
        console.log(`     Expected: ${mismatch.expectedOptions.join(", ")}`);
        console.log(`     Actual: ${mismatch.actualOptions.join(", ")}`);
      }
    }
    console.log();
  }

  if (report.extraFields.length > 0) {
    console.log("ℹ️  Extra Fields (not in schema):");
    for (const field of report.extraFields) {
      console.log(`   - ${field}`);
    }
    console.log();
  }

  const okFields = report.results.filter((r) => r.status === "ok");
  if (okFields.length > 0) {
    console.log(`✅ Validated Fields (${String(okFields.length)}):`);
    for (const result of okFields) {
      console.log(`   - ${String(result.field)}`);
    }
  }

  console.log("\n" + "=".repeat(50));
}

/**
 * Main execution
 */
async function main() {
  try {
    const report = await validateSchema();
    printReport(report);
    process.exit(report.isValid ? 0 : 1);
  } catch (error) {
    console.error("Validation failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
const isMainModule =
  process.argv[1] &&
  import.meta.url.includes(process.argv[1].replace(/\\/g, "/"));
if (isMainModule) {
  void main();
}
