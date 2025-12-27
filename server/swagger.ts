import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

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
servers.push({
  url: `http://localhost:${String(env.PORT)}`,
  description: "Development server",
});

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LinguistNow API",
      version: "1.0.0",
      description:
        "API for LinguistNow - A platform connecting linguists with clients through Google Calendar integration",
      contact: {
        name: "LinguistNow Support",
        url: env.FRONTEND_URL || "https://github.com/nicmart-dev/linguistnow",
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
              example:
                "calendar1@group.calendar.google.com,calendar2@group.calendar.google.com",
            },
            "Access Token": { type: "string", example: "ya29.a0..." },
            "Refresh Token": { type: "string", example: "1//0..." },
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
    ],
  },
  apis: ["./server.ts", "./routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
