import express, { type Router } from "express";
import {
  checkAvailability,
  isUserFree,
  listCalendars,
} from "../controllers/calendarController.js";

const router: Router = express.Router();

/**
 * @openapi
 * /api/calendars/availability:
 *   post:
 *     tags:
 *       - Calendars
 *     summary: Check user availability
 *     description: |
 *       Checks if a user is available by querying their Google Calendars directly.
 *       Reads the access token from Vault and calculates availability based on:
 *       - Working hours (configurable, default 8am-6pm)
 *       - Minimum hours per day (configurable, default 8 hours)
 *       - Weekend exclusion (configurable, default true)
 *       - Timezone (configurable, default America/Los_Angeles)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - calendarIds
 *               - userEmail
 *             properties:
 *               calendarIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of Google Calendar IDs to check
 *                 example: ['primary', 'work@group.calendar.google.com']
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 description: User's email address (used to fetch token from Vault)
 *                 example: user@example.com
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start of time window (ISO 8601). Defaults to tomorrow.
 *                 example: '2024-01-15T00:00:00Z'
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End of time window (ISO 8601). Defaults to 7 days from now.
 *                 example: '2024-01-22T00:00:00Z'
 *               timezone:
 *                 type: string
 *                 description: IANA timezone for working hours calculation
 *                 default: America/Los_Angeles
 *                 example: 'America/Los_Angeles'
 *               workingHoursStart:
 *                 type: integer
 *                 description: Start of working hours (24h format)
 *                 default: 8
 *                 example: 8
 *               workingHoursEnd:
 *                 type: integer
 *                 description: End of working hours (24h format)
 *                 default: 18
 *                 example: 18
 *               minHoursPerDay:
 *                 type: integer
 *                 description: Minimum free hours required per working day
 *                 default: 8
 *                 example: 8
 *               excludeWeekends:
 *                 type: boolean
 *                 description: Whether to exclude weekends from calculation
 *                 default: true
 *                 example: true
 *     responses:
 *       200:
 *         description: Availability check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAvailable:
 *                   type: boolean
 *                   description: Whether user meets minimum availability requirements
 *                   example: true
 *                 freeSlots:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         format: date-time
 *                       end:
 *                         type: string
 *                         format: date-time
 *                   description: List of free time slots within working hours
 *                 totalFreeHours:
 *                   type: number
 *                   description: Total free hours across all working days
 *                   example: 40
 *                 workingDays:
 *                   type: integer
 *                   description: Number of working days in the time window
 *                   example: 5
 *                 hoursPerDay:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                   description: Free hours per day (date string -> hours)
 *                   example: { '2024-01-15': 8, '2024-01-16': 10 }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'calendarIds array is required'
 *                 code:
 *                   type: string
 *                   example: 'VALIDATION_ERROR'
 *       401:
 *         description: Access token expired or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Access token expired or invalid'
 *                 code:
 *                   type: string
 *                   example: 'TOKEN_EXPIRED'
 *       404:
 *         description: No access token found for user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'No access token found for user'
 *                 code:
 *                   type: string
 *                   example: 'TOKEN_NOT_FOUND'
 *       503:
 *         description: Cannot reach Vault service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Cannot read token from Vault'
 *                 code:
 *                   type: string
 *                   example: 'VAULT_ERROR'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/availability", (req, res, next) => {
  void checkAvailability(req, res, next);
});

/**
 * @openapi
 * /api/calendars/free:
 *   post:
 *     tags:
 *       - Calendars
 *     summary: Check user availability (deprecated)
 *     deprecated: true
 *     description: |
 *       **DEPRECATED**: Use POST /api/calendars/availability instead.
 *       This endpoint is kept for backward compatibility and forwards to the new endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - calendarIds
 *               - userEmail
 *             properties:
 *               calendarIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               userEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Availability check result (same as /availability endpoint)
 */
/* eslint-disable @typescript-eslint/no-deprecated -- intentionally kept for backward compatibility */
router.post("/free", (req, res, next) => {
  void isUserFree(req, res, next);
});
/* eslint-enable @typescript-eslint/no-deprecated */

/**
 * @openapi
 * /api/calendars/list/{userEmail}:
 *   get:
 *     tags:
 *       - Calendars
 *     summary: List user's Google Calendars
 *     description: Fetches the list of Google Calendars for a user by reading their access token from Vault
 *     parameters:
 *       - in: path
 *         name: userEmail
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: The user's email address
 *         example: user@example.com
 *     responses:
 *       200:
 *         description: List of user's Google Calendars
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calendars:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 'primary'
 *                       summary:
 *                         type: string
 *                         example: 'My Calendar'
 *                       primary:
 *                         type: boolean
 *                       accessRole:
 *                         type: string
 *                         example: 'owner'
 *       400:
 *         description: Missing userEmail parameter
 *       401:
 *         description: Access token expired or invalid
 *       404:
 *         description: No access token found for user in Vault
 *       503:
 *         description: Cannot reach Vault service
 */
router.get("/list/:userEmail", (req, res, next) => {
  void listCalendars(req, res, next);
});

export default router;
