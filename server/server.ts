import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

const app = express();

// Load and expand environment variables FIRST, before importing ANY modules that use env
// This must happen before routes are imported, as they may import controllers that use env
// In Docker/production, env vars come from container environment, so .env file is optional
const envConfig = dotenv.config();
if (envConfig.error) {
  // Check if it's a "file not found" error (expected in Docker containers)
  const errorCode = (envConfig.error as NodeJS.ErrnoException).code;
  if (errorCode === "ENOENT") {
    // .env file not found - this is normal in Docker containers where env vars come from container
    console.log(
      "No .env file found - using environment variables from container",
    );
  } else {
    // Only log error if it's not a "file not found" error
    console.error("Error loading .env file:", envConfig.error);
  }
}
dotenvExpand.expand(envConfig);
// Note: env validation happens in env.ts module
// This log is for debugging dotenv loading only

// Import modules that use env AFTER dotenv is loaded and expanded
// Validate environment variables early - this will throw with helpful error messages
import { env } from "./env.js";

// Trigger validation by accessing a required property without a default
// This will throw with a helpful error message if env vars are missing
let PORT: number;
try {
  // Access a required variable (GOOGLE_CLIENT_ID) to trigger validation
  // PORT has a default, so accessing it won't trigger validation errors
  void env.GOOGLE_CLIENT_ID;
  PORT = env.PORT;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

import calendarRoutes from "./routes/calendarRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import linguistsRoutes from "./routes/linguistsRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";
import swaggerSpec, { apiVersion } from "./swagger.js";

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Configure CORS - use whitelist to prevent CSRF attacks
const getAllowedOrigins = (): string[] => {
  const allowedOrigins: string[] = [];

  if (env.FRONTEND_URL) {
    // Add the configured frontend URL
    allowedOrigins.push(env.FRONTEND_URL);

    // In development, also allow localhost with common ports
    // NODE_ENV is a standard Node.js env var, safe to check directly
    if (process.env.NODE_ENV === "development") {
      allowedOrigins.push("http://localhost:3000");
      allowedOrigins.push("http://localhost:3030");
    }
  }

  return allowedOrigins;
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // If no allowed origins configured, reject all cross-origin requests
    if (allowedOrigins.length === 0) {
      // Allow same-origin requests (no origin header) but reject cross-origin
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(
        new Error(
          "CORS: No allowed origins configured. Set FRONTEND_URL environment variable.",
        ),
      );
      return;
    }

    // Allow requests with no origin (same-origin requests, e.g., from same domain)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if the origin is in the whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Origin not in whitelist - reject
      callback(new Error(`CORS: Origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Raw OpenAPI spec endpoint (must be before Swagger UI)
app.get("/api-docs.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec());
});

// Swagger UI at root URL - fetch spec dynamically from /api-docs.json
// This ensures the version is always correct (not embedded at startup)
app.use("/", swaggerUi.serve);
app.get(
  "/",
  swaggerUi.setup(null, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "LinguistNow API Documentation",
    swaggerOptions: {
      url: "/api-docs.json",
    },
  }),
);

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Returns the health status of the API server. Used for container orchestration (Docker, Portainer).
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: apiVersion,
    buildDate: process.env.BUILD_DATE || null,
    buildSha: process.env.BUILD_SHA || null,
  });
});

// Use routes to handle Google OAuth and fetch user info
app.use("/api/auth", authRoutes);

// Use routes to handle user data
app.use("/api/users", usersRoutes);

// Route to manage Google calendar user data handling
app.use("/api/calendars", calendarRoutes);

// Route for token refresh (internal endpoint called by n8n)
app.use("/api/tokens", tokenRoutes);

// Route for linguist search and filtering
app.use("/api/linguists", linguistsRoutes);

// Route for currency conversion and FX rates
app.use("/api/currency", currencyRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${String(PORT)}`);
});
