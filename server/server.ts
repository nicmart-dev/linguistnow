import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import { env } from "./env.js";

const app = express();

// Load and expand environment variables
const envConfig = dotenv.config();
dotenvExpand.expand(envConfig);

const PORT = env.PORT;

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
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Swagger UI at root URL
app.use("/", swaggerUi.serve);
app.get(
  "/",
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "LinguistNow API Documentation",
  }),
);

// Raw OpenAPI spec endpoint
app.get("/api-docs.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

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
  });
});

// Use routes to handle Google OAuth and fetch user info
app.use("/api/auth", authRoutes);

// Use routes to handle user data
app.use("/api/users", usersRoutes);

// Route to manage Google calendar user data handling
app.use("/api/calendars", calendarRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${String(PORT)}`);
});
