import { z } from "zod";

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    FRONTEND_URL: z.url().optional(),
    AIRTABLE_PERSONAL_ACCESS_TOKEN: z.string().min(1).optional(),
    AIRTABLE_API_KEY: z.string().min(1).optional(),
    AIRTABLE_BASE_ID: z.string().min(1),
    GOOGLE_REDIRECT_URI: z.url().optional(),
    BACKEND_URL: z.url().optional(),
    VAULT_ADDR: z.url().optional(),
    VAULT_TOKEN: z.string().optional(),
    VAULT_SECRET_PATH: z.string().optional(),
    REDIS_URL: z.url().default("redis://localhost:6379"),
    FRANKFURTER_URL: z.url().default("http://localhost:8081"),
  })
  .refine(
    (data) => data.AIRTABLE_PERSONAL_ACCESS_TOKEN || data.AIRTABLE_API_KEY,
    {
      message:
        "Either AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY must be set",
    },
  );

let _env: z.infer<typeof envSchema> | null = null;

/**
 * Validates environment variables and returns helpful error messages if validation fails.
 * @throws Error with detailed message about missing or invalid environment variables
 */
function validateEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missingRequired: string[] = [];
    const invalidFormat: string[] = [];

    for (const error of result.error.issues) {
      const pathStr = error.path.length > 0 ? error.path.join(".") : "unknown";
      if (
        error.code === "too_small" &&
        "minimum" in error &&
        error.minimum === 1
      ) {
        missingRequired.push(pathStr);
      } else if (error.code === "invalid_type") {
        missingRequired.push(pathStr);
      } else if (
        error.code === "invalid_string" ||
        error.code === "invalid_url"
      ) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        invalidFormat.push(`${pathStr}: ${error.message}`);
      } else {
        missingRequired.push(`${pathStr}: ${error.message}`);
      }
    }

    // Check for Airtable token requirement
    const hasAirtableToken =
      process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN ||
      process.env.AIRTABLE_API_KEY;

    let errorMessage = "\n" + "=".repeat(80) + "\n";
    errorMessage += "  ENVIRONMENT VARIABLE CONFIGURATION ERROR\n";
    errorMessage += "=".repeat(80) + "\n\n";

    if (missingRequired.length > 0) {
      errorMessage += "Missing required environment variables:\n";
      missingRequired.forEach((varName) => {
        errorMessage += `  ✗ ${varName}\n`;
      });
      errorMessage += "\n";
    }

    if (invalidFormat.length > 0) {
      errorMessage += "Invalid environment variable format:\n";
      invalidFormat.forEach((varName) => {
        errorMessage += `  ✗ ${varName}\n`;
      });
      errorMessage += "\n";
    }

    if (!hasAirtableToken) {
      errorMessage += "Airtable authentication:\n";
      errorMessage +=
        "  ✗ Either AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY must be set\n\n";
    }

    errorMessage += "To fix this:\n";
    errorMessage += "  1. Copy server/example.env to server/.env\n";
    errorMessage +=
      "  2. Fill in all required values (see server/example.env for details)\n";
    errorMessage += "  3. Restart the server\n\n";
    errorMessage += "Required variables:\n";
    errorMessage += "  • GOOGLE_CLIENT_ID - Google OAuth client ID\n";
    errorMessage += "  • GOOGLE_CLIENT_SECRET - Google OAuth client secret\n";
    errorMessage += "  • AIRTABLE_BASE_ID - Your Airtable base ID\n";
    errorMessage +=
      "  • AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY - Airtable auth\n";
    errorMessage += "\nOptional but recommended:\n";
    errorMessage +=
      "  • FRONTEND_URL - Frontend URL for CORS (defaults to localhost:3000 in dev)\n";
    errorMessage +=
      "  • VAULT_ADDR, VAULT_TOKEN, VAULT_SECRET_PATH - For token storage\n";
    errorMessage +=
      "\nFX Rate Conversion (optional, has defaults but services must be running):\n";
    errorMessage += "  • REDIS_URL - Redis server for FX rate caching\n";
    errorMessage += "    Default: redis://localhost:6379\n";
    errorMessage += "    Docker: redis://redis:6379\n";
    errorMessage +=
      "    Note: If Redis is not running, currency conversion will still work but rates won't be cached.\n";
    errorMessage +=
      "  • FRANKFURTER_URL - Frankfurter API for ECB exchange rates\n";
    errorMessage += "    Default: http://localhost:8080\n";
    errorMessage += "    Docker: http://frankfurter:8080\n";
    errorMessage +=
      "    Note: If Frankfurter is not running, currency conversion will be unavailable.\n";
    errorMessage +=
      "    See: docs/integrations/redis-setup.md and docs/integrations/frankfurter-setup.md\n";
    errorMessage += "\n" + "=".repeat(80) + "\n";

    throw new Error(errorMessage);
  }

  return result.data;
}

function getEnv() {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

// Export as a getter object so it behaves like the original env export
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_target, prop) {
    return getEnv()[prop as keyof typeof _env];
  },
  ownKeys() {
    return Object.keys(getEnv());
  },
  has(_target, prop) {
    return prop in getEnv();
  },
});
