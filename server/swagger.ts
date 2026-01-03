import swaggerJsdoc from "swagger-jsdoc";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Type for the minimal package.json fields we need
interface PackageJson {
  version: string;
}

// Read version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson: PackageJson = JSON.parse(
  readFileSync(join(__dirname, "package.json"), "utf-8"),
) as PackageJson;
export const apiVersion: string = packageJson.version;

// Lazy function to get swagger options - only called after dotenv is loaded
// Use process.env directly since dotenv will be loaded by the time this is called
function getSwaggerOptions() {
  // Build server list dynamically based on environment
  const servers: Array<{ url: string; description: string }> = [];

  // Add production server if BACKEND_URL is configured
  if (process.env.BACKEND_URL) {
    servers.push({
      url: process.env.BACKEND_URL,
      description: "Production server",
    });
  }

  // Always add localhost for development
  // Use process.env.PORT directly (defaults to 5000 if not set)
  const port = process.env.PORT || "5000";
  servers.push({
    url: `http://localhost:${port}`,
    description: "Development server",
  });

  return {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "LinguistNow API",
        version: apiVersion,
        description:
          "API for LinguistNow - A platform connecting linguists with clients through Google Calendar integration",
        contact: {
          name: "LinguistNow Support",
          url:
            process.env.FRONTEND_URL ||
            "https://github.com/nicmart-dev/linguistnow",
        },
        license: {
          name: "ISC",
          url: "https://opensource.org/licenses/ISC",
        },
      },
      servers,
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Google OAuth2 access token",
          },
        },
        schemas: {
          User: {
            type: "object",
            description:
              "User data stored in Airtable. Note: OAuth tokens are stored in Vault, not Airtable.",
            properties: {
              Email: {
                type: "string",
                format: "email",
                example: "user@example.com",
              },
              Name: { type: "string", example: "John Doe" },
              Picture: {
                type: "string",
                format: "uri",
                example: "https://lh3.googleusercontent.com/a/...",
              },
              Role: { type: "string", example: "Linguist" },
              "Calendar IDs": {
                type: "string",
                description:
                  "Comma-separated list of Google Calendar IDs (not display names)",
                example:
                  "calendar1@group.calendar.google.com,calendar2@group.calendar.google.com",
              },
              Timezone: {
                type: "string",
                description: "IANA timezone identifier",
                example: "America/Los_Angeles",
              },
              "Working Hours Start": {
                type: "string",
                description:
                  "Start of working day in ISO 8601 time format (HH:mm)",
                example: "08:00",
              },
              "Working Hours End": {
                type: "string",
                description:
                  "End of working day in ISO 8601 time format (HH:mm)",
                example: "18:00",
              },
              "Off Days": {
                type: "array",
                items: {
                  type: "string",
                },
                description:
                  "Days off as day names (e.g., ['Sunday', 'Saturday']) or numbers (0-6) for backward compatibility",
                example: ["Sunday", "Saturday"],
              },
            },
          },
          UserInfo: {
            type: "object",
            properties: {
              email: {
                type: "string",
                format: "email",
                example: "user@example.com",
              },
              name: { type: "string", example: "John Doe" },
              picture: {
                type: "string",
                format: "uri",
                example: "https://lh3.googleusercontent.com/a/...",
              },
            },
          },
          Error: {
            type: "object",
            properties: {
              error: { type: "string", example: "Error message" },
              details: { type: "string", example: "Additional error details" },
              code: { type: "string", example: "ERROR_CODE" },
            },
          },
          HealthCheck: {
            type: "object",
            properties: {
              status: { type: "string", example: "healthy" },
              timestamp: {
                type: "string",
                format: "date-time",
                example: "2025-12-25T12:00:00.000Z",
              },
              uptime: { type: "number", example: 3600.5 },
              version: {
                type: "string",
                example: "main",
                description: "Build version (branch name or tag)",
              },
              buildDate: {
                type: "string",
                format: "date-time",
                nullable: true,
                example: "2025-12-30T10:00:00Z",
                description: "When the Docker image was built",
              },
              buildSha: {
                type: "string",
                nullable: true,
                example: "abc1234",
                description: "Git commit SHA of the build",
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Health", description: "Health check endpoints" },
      { name: "Auth", description: "Google OAuth authentication endpoints" },
      { name: "Users", description: "User management endpoints (Airtable)" },
      {
        name: "Calendars",
        description: "Google Calendar availability endpoints",
      },
      {
        name: "Tokens",
        description: "Token management endpoints (internal)",
      },
    ],
    apis: ["./server.ts", "./routes/*.ts"],
  };
}

// Lazy initialization - only create spec when accessed
let _swaggerSpec: ReturnType<typeof swaggerJsdoc> | null = null;

function getSwaggerSpec() {
  if (!_swaggerSpec) {
    const options = getSwaggerOptions();
    _swaggerSpec = swaggerJsdoc(options);
  }
  return _swaggerSpec;
}

// Export as a getter function - will be created lazily when first accessed
// This ensures dotenv is loaded before the spec is created
export default getSwaggerSpec;
