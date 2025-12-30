import express, { type Router } from "express";
import {
  isUserFree,
  listCalendars,
} from "../controllers/calendarController.js";

const router: Router = express.Router();

/**
 * @openapi
 * /api/calendars/free:
 *   post:
 *     tags:
 *       - Calendars
 *     summary: Check user availability
 *     description: Checks if a user is available by querying their Google Calendars through an n8n workflow. The access token is read from Vault using the userEmail.
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
 *     responses:
 *       200:
 *         description: Availability check result from n8n workflow
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response from n8n workflow (structure varies based on workflow configuration)
 *       404:
 *         description: n8n webhook not found (workflow may not be active)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'n8n webhook not found'
 *                 details:
 *                   type: string
 *                   example: 'The workflow may not be active. Please activate the workflow in n8n.'
 *                 hint:
 *                   type: string
 *                   example: 'Make sure the workflow is active in n8n for production URLs to work.'
 *                 userEmail:
 *                   type: string
 *                   nullable: true
 *                 code:
 *                   type: string
 *                   example: 'N8N_WEBHOOK_NOT_FOUND'
 *       503:
 *         description: Cannot reach n8n workflow
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Cannot reach n8n workflow'
 *                 details:
 *                   type: string
 *                   example: 'The n8n service may be down or unreachable.'
 *                 userEmail:
 *                   type: string
 *                   nullable: true
 *                 code:
 *                   type: string
 *                   example: 'N8N_SERVICE_UNAVAILABLE'
 *       504:
 *         description: n8n workflow timeout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'n8n workflow timeout'
 *                 details:
 *                   type: string
 *                   example: 'The n8n workflow took too long to execute (exceeded 90 seconds).'
 *                 hint:
 *                   type: string
 *                   example: 'Check the n8n workflow execution logs.'
 *                 userEmail:
 *                   type: string
 *                   nullable: true
 *                 code:
 *                   type: string
 *                   example: 'N8N_WORKFLOW_TIMEOUT'
 *       500:
 *         description: Error triggering n8n workflow
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/free", (req, res, next) => {
  void isUserFree(req, res, next);
});

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
