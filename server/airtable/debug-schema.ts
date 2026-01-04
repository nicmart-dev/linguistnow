/**
 * Debug script to inspect Airtable schema and data
 * Helps troubleshoot filter formula issues
 *
 * Run via: tsx airtable/debug-schema.ts
 */

// Load environment variables FIRST
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

/**
 * Get Airtable base instance
 */
function getAirtableBase() {
  const airtableApiKey =
    env.AIRTABLE_PERSONAL_ACCESS_TOKEN || env.AIRTABLE_API_KEY || "";
  return new Airtable({ apiKey: airtableApiKey }).base(env.AIRTABLE_BASE_ID);
}

async function debugSchema() {
  try {
    const base = getAirtableBase();
    const table = base("Users");

    console.log("=== Fetching sample records ===\n");

    // Fetch a few records to inspect
    const records = await table.select({ maxRecords: 5 }).firstPage();

    console.log(`Found ${records.length} records\n`);

    if (records.length === 0) {
      console.log("No records found in Users table");
      return;
    }

    // Inspect each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const fields = record.fields;

      console.log(`\n--- Record ${i + 1} (ID: ${record.id}) ---`);
      console.log(`Email: ${fields["Email"] || "N/A"}`);
      console.log(`Name: ${fields["Name"] || "N/A"}`);
      console.log(`Role: ${fields["Role"] || "N/A"}`);

      // Check Specialization field
      const specialization = fields["Specialization"];
      console.log(`\nSpecialization field:`);
      console.log(
        `  Type: ${Array.isArray(specialization) ? "Array" : typeof specialization}`,
      );
      console.log(`  Value: ${JSON.stringify(specialization)}`);
      if (Array.isArray(specialization)) {
        console.log(`  Array length: ${specialization.length}`);
        specialization.forEach((val, idx) => {
          console.log(`    [${idx}]: "${val}" (type: ${typeof val})`);
        });
      }
      if (specialization) {
        const asString = String(specialization);
        console.log(`  As string: "${asString}"`);
        const concatenated = specialization + "";
        console.log(`  Concatenated (field + ""): "${concatenated}"`);
      }

      // Check Languages field
      const languages = fields["Languages"];
      console.log(`\nLanguages field:`);
      console.log(
        `  Type: ${Array.isArray(languages) ? "Array" : typeof languages}`,
      );
      console.log(`  Value: ${JSON.stringify(languages)}`);

      // Check all field names
      console.log(`\nAll field names in this record:`);
      Object.keys(fields).forEach((fieldName) => {
        const value = fields[fieldName];
        const type = Array.isArray(value) ? "Array" : typeof value;
        console.log(
          `  "${fieldName}": ${type}${value ? ` = ${JSON.stringify(value).substring(0, 50)}` : ""}`,
        );
      });
    }

    // Test filter formulas
    console.log("\n\n=== Testing Filter Formulas ===\n");

    const testFormulas = [
      `{Role} = 'Linguist'`,
      `SEARCH('Medical', {Specialization} & "")`,
      `FIND('Medical', {Specialization} & '')`,
      `{Specialization} = 'Medical'`,
      `{Role} = 'Linguist' AND (SEARCH('Medical', {Specialization} & "") > 0)`,
      `{Role} = 'Linguist' AND (IFERROR(SEARCH('Medical', {Specialization} & ""), 0) > 0)`,
      `{Role} = 'Linguist' AND (FIND('Medical', {Specialization} & '') > 0)`,
      `{Role} = 'Linguist' AND ({Specialization} = 'Medical')`,
      `AND({Role} = 'Linguist', {Specialization} = 'Medical')`,
      `AND({Role} = 'Linguist', FIND('Medical', {Specialization} & '') > 0)`,
    ];

    for (const formula of testFormulas) {
      try {
        console.log(`Testing: ${formula}`);
        const testRecords = await table
          .select({
            filterByFormula: formula,
            maxRecords: 1,
          })
          .firstPage();
        console.log(`  ✅ SUCCESS: Found ${testRecords.length} records`);
        if (testRecords.length > 0) {
          const testFields = testRecords[0].fields;
          console.log(
            `  Sample Specialization: ${JSON.stringify(testFields["Specialization"])}`,
          );
        }
      } catch (error) {
        console.log(
          `  ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      console.log("");
    }
  } catch (error) {
    console.error("Error debugging schema:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (
  import.meta.url.endsWith(process.argv[1]) ||
  process.argv[1]?.includes("debug-schema")
) {
  debugSchema().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
} else {
  // Always run when imported/executed
  debugSchema().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export { debugSchema };
