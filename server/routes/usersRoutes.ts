import express, { type Router } from "express";
import usersController from "../controllers/usersController.js";
import { apiKeyAuthMiddleware } from "../utils/apiKeyAuth.js";
import { rateLimitMiddleware } from "../utils/rateLimit.js";
import { authorizeUserParam, authorizeBodyEmail } from "../utils/userAuth.js";

const router: Router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users (internal endpoint)
 *     description: Retrieves all users from the Airtable database. Protected by API key or internal network restriction.
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  apiKeyAuthMiddleware,
  rateLimitMiddleware,
  usersController.getAll,
);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by email
 *     security:
 *       - BearerAuth: []
 *     description: Retrieves a single user by their email address (used as primary key)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email address
 *         example: user@example.com
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid email format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - missing or invalid session token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - caller may not access this user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:id",
  rateLimitMiddleware,
  ...authorizeUserParam({ allowProjectManager: true }),
  usersController.getOne,
);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user
 *     security:
 *       - BearerAuth: []
 *     description: Updates user's calendar IDs and availability preferences. Note - OAuth tokens are stored in Vault, not Airtable.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email address
 *         example: user@example.com
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               calendarIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of Google Calendar IDs
 *                 example: ['calendar1@group.calendar.google.com', 'calendar2@group.calendar.google.com']
 *               availabilityPreferences:
 *                 type: object
 *                 description: "User's availability preferences. Note: minHoursPerDay is not a linguist preference - it's a PM requirement set in availability requests."
 *                 properties:
 *                   timezone:
 *                     type: string
 *                     description: IANA timezone identifier
 *                     example: America/Los_Angeles
 *                   workingHoursStart:
 *                     type: string
 *                     description: Start of working day in ISO 8601 time format (HH:mm)
 *                     example: "08:00"
 *                   workingHoursEnd:
 *                     type: string
 *                     description: End of working day in ISO 8601 time format (HH:mm)
 *                     example: "18:00"
 *                   offDays:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: Days off (0=Sunday, 1=Monday, ..., 6=Saturday)
 *                     example: [0, 6]
 *               profile:
 *                 type: object
 *                 description: Linguist profile information (only for linguists)
 *                 properties:
 *                   hourlyRate:
 *                     type: number
 *                     description: Hourly rate (stored as number in Airtable)
 *                     example: 50.00
 *                   currency:
 *                     type: string
 *                     description: "Currency code (ISO 4217). Must be one of: USD, EUR, GBP, JPY, CNY, CAD, AUD, CHF, INR, BRL, MXN, KRW, RUB, ZAR, SGD"
 *                     enum: [USD, EUR, GBP, JPY, CNY, CAD, AUD, CHF, INR, BRL, MXN, KRW, RUB, ZAR, SGD]
 *                     example: USD
 *                   languages:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: "Language pairs. Valid options: EN-FR, EN-ES, EN-DE, EN-ZH, EN-JA, EN-KO, EN-AR, EN-RU, EN-IT, EN-PT, FR-EN, ES-EN, DE-EN, ZH-EN, JA-EN, KO-EN, AR-EN, RU-EN, IT-EN, PT-EN"
 *                     example: ["EN-FR", "EN-ES"]
 *                   specialization:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: "Specialization areas. Valid options: Legal, Medical, Technical, Marketing, Financial, Literary, Academic, General"
 *                     example: ["Legal", "Medical"]
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: No fields provided for update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to update user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - missing or invalid session token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - caller may not access this user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id",
  rateLimitMiddleware,
  ...authorizeUserParam({ allowProjectManager: true }),
  usersController.update,
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user
 *     security:
 *       - BearerAuth: []
 *     description: Deletes a user from Airtable and Vault by their email address. This endpoint is actively used by the Account Settings page to allow linguists to permanently remove themselves from the database. All user data and tokens are permanently deleted.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email address
 *         example: user@example.com
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Deleted user
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: user@example.com
 *       400:
 *         description: Invalid email format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to delete user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - missing or invalid session token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - users can only delete their own account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id",
  rateLimitMiddleware,
  ...authorizeUserParam({ allowProjectManager: false }),
  usersController.remove,
);

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     security:
 *       - BearerAuth: []
 *     description: Creates a new user in Airtable upon first login using Google User API information. Self-registered users are assigned the Linguist role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - picture_url
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *               picture_url:
 *                 type: string
 *                 format: uri
 *                 example: https://lh3.googleusercontent.com/a/...
 *               role:
 *                 type: string
 *                 default: Linguist
 *                 enum: [Linguist]
 *                 example: Linguist
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden - cannot self-assign a privileged role or create a user for a different email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to create user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid or missing email, name or picture_url
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - missing or invalid session token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  rateLimitMiddleware,
  ...authorizeBodyEmail,
  usersController.create,
);

export default router;
