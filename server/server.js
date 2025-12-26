const express = require('express');
const app = express();

// load environment variables from a .env file into process.env
const dotenv = require('dotenv')
const envConfig = dotenv.config()

// Expand environment variables for nested variables
const dotenvExpand = require('dotenv-expand')
dotenvExpand.expand(envConfig)

const PORT = process.env.PORT || 5000; // Define the port number, use environment variable if available

const cors = require('cors');

// Swagger/OpenAPI documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

/* Import routes */
const calendarRoutes = require('./routes/calendarRoutes');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Configure CORS - restrict to frontend URL in production
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Swagger UI at root URL
app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LinguistNow API Documentation'
}));

// Raw OpenAPI spec endpoint
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
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
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Use routes to handle Google OAuth and fetch user info
app.use('/api/auth', authRoutes);

// Use routes to handle user data
app.use('/api/users', usersRoutes);

// Route to manage Google calendar user data handling
app.use('/api/calendars', calendarRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
