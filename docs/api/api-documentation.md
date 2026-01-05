# API Documentation

The LinguistNow API provides interactive documentation using OpenAPI 3.0 (Swagger) specification.

## Accessing the Documentation

| URL                                   | Description                                    |
| ------------------------------------- | ---------------------------------------------- |
| `http://localhost:8080/`              | Interactive Swagger UI                         |
| `http://localhost:8080/api-docs.json` | Raw OpenAPI spec (for Postman, SDK generation) |

## Using Swagger UI

1. Visit the API root URL
2. Click **Authorize** and enter your Google OAuth access token (`ya29.a0...`)
3. Expand any endpoint and click **Try it out**
4. Fill in parameters and click **Execute**

## Adding New Endpoints

When adding API endpoints, include JSDoc OpenAPI annotations in route files:

```javascript
/**
 * @openapi
 * /api/example:
 *   get:
 *     tags: [Example]
 *     summary: Short description
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/example", controller.handler);
```

The Swagger UI updates automatically when the server restarts.

## Related

- [Google Authentication](../integrations/google-authentication.md) - How to obtain tokens
- [Integration of Google Calendar API](../integrations/integration-of-google-calendar-api.md) - Availability endpoint details
