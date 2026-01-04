import express, { type Router } from "express";
import usersController from "../controllers/usersController.js";

const router: Router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Retrieves all users from the Airtable database
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Failed to fetch users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", usersController.getAll);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by email
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
 *       500:
 *         description: Failed to fetch user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", usersController.getOne);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user
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
 *       500:
 *         description: Failed to update user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", usersController.update);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user
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
 *       500:
 *         description: Failed to delete user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", usersController.remove);

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     description: Creates a new user in Airtable upon first login using Google User API information
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
 *                 example: Linguist
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Failed to create user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", usersController.create);

export default router;
