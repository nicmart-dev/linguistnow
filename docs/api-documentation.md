# API Documentation

The LinguistNow API provides interactive documentation using OpenAPI 3.0 (Swagger) specification. This allows developers to explore, understand, and test API endpoints directly from the browser.

## Accessing the Documentation

- **Root URL:** Visit the API server root (e.g., `http://localhost:8080/`)
- **JSON Spec:** Raw OpenAPI spec at `/api-docs.json`

The Swagger UI is served at the root URL of the API server. The server list in the UI is dynamically generated based on your environment configuration:

- If `BACKEND_URL` is set, it appears as the production server
- Localhost with the configured `PORT` is always included for development

## Features

### Interactive Swagger UI

When visiting the API root URL, you'll see an interactive Swagger UI that includes:

- **API Overview:** Title, version, description, and license information
- **Server Selection:** Toggle between configured servers
- **Authorization:** "Authorize" button to set Bearer token for authenticated requests
- **Endpoint Explorer:** All endpoints organized by category with request/response details
- **Try It Out:** Execute API calls directly from the browser

### Raw OpenAPI Specification

The raw OpenAPI JSON specification is available at `/api-docs.json`. This can be used for:

- Importing into API clients (Postman, Insomnia)
- Generating client SDKs
- CI/CD validation

## API Endpoint Categories

### Health

| Method | Endpoint      | Description                              |
| ------ | ------------- | ---------------------------------------- |
| GET    | `/api/health` | Health check for container orchestration |

### Auth

Google OAuth authentication endpoints:

| Method | Endpoint                    | Description                              |
| ------ | --------------------------- | ---------------------------------------- |
| POST   | `/api/auth/google/code`     | Exchange authorization code for tokens   |
| POST   | `/api/auth/google/userInfo` | Fetch user info from Google People API   |
| POST   | `/api/auth/google/refresh`  | Refresh access token using refresh token |

### Users

User management endpoints (Airtable):

| Method | Endpoint             | Description                       |
| ------ | -------------------- | --------------------------------- |
| GET    | `/api/users`         | Get all users                     |
| GET    | `/api/users/{email}` | Get user by email address         |
| POST   | `/api/users`         | Create a new user                 |
| PUT    | `/api/users/{email}` | Update user (calendars, tokens)   |
| DELETE | `/api/users/{id}`    | Delete user by Airtable record ID |

### Calendars

Google Calendar availability endpoints:

| Method | Endpoint              | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| POST   | `/api/calendars/free` | Check user availability via n8n workflow |

## Implementation Details

The API documentation is implemented using:

- **[swagger-jsdoc](https://www.npmjs.com/package/swagger-jsdoc):** Generates OpenAPI spec from JSDoc comments in route files
- **[swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express):** Serves the interactive Swagger UI

Both packages are free and MIT-licensed.

### File Structure

```
server/
├── swagger.js          # OpenAPI configuration and schemas
├── server.js           # Swagger UI middleware setup
└── routes/
    ├── authRoutes.js   # Auth endpoint annotations
    ├── usersRoutes.js  # Users endpoint annotations
    └── calendarRoutes.js # Calendar endpoint annotations
```

### Adding New Endpoints

When adding new API endpoints, include JSDoc OpenAPI annotations:

```javascript
/**
 * @openapi
 * /api/example:
 *   get:
 *     tags:
 *       - Example
 *     summary: Short description
 *     description: Detailed description of what the endpoint does
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 */
router.get("/example", controller.exampleHandler);
```

The documentation will automatically update when the server restarts.

## Authentication

Most endpoints require a Google OAuth access token. To test authenticated endpoints:

1. Click the **Authorize** button in Swagger UI
2. Enter a valid access token in the format: `ya29.a0...`
3. Click **Authorize** to set the token for all requests
4. Use **Try it out** on any endpoint

See [Google Authentication](./google-authentication.md) for details on obtaining tokens.
