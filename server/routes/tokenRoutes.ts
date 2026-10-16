import express from "express";
import { refreshAllTokens } from "../controllers/tokenRefreshController.js";
import { listTokens, deleteToken } from "../utils/vaultClient.js";
import { userExistsInAirtable } from "../controllers/usersController.js";
import { apiKeyAuthMiddleware } from "../utils/apiKeyAuth.js";
import { rateLimitMiddleware } from "../utils/rateLimit.js";

const router: express.Router = express.Router();

/**
 * @openapi
 * /api/tokens/list:
 *   get:
 *     tags:
 *       - Tokens
 *     summary: List all user emails that have tokens stored (internal endpoint)
 *     description: Returns list of user emails with tokens in Vault that also exist in Airtable. Users not in Airtable are automatically removed from Vault. Protected by API key or internal network restriction.
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of user emails with tokens that exist in Airtable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emails:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['user1@example.com', 'user2@example.com']
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Vault service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/list",
  apiKeyAuthMiddleware,
  rateLimitMiddleware,
  async (_req, res) => {
    try {
      const allEmails = await listTokens();
      const validEmails: string[] = [];
      const removedEmails: string[] = [];

      // Check each user and remove from Vault if not in Airtable
      for (const email of allEmails) {
        const exists = await userExistsInAirtable(email);
        if (exists) {
          validEmails.push(email);
        } else {
          // User not in Airtable - remove from Vault
          try {
            await deleteToken(email);
            removedEmails.push(email);
            console.log(
              `Removed tokens from Vault for user not in Airtable: ${email}`,
            );
          } catch (deleteError) {
            console.error(
              `Failed to delete tokens for user ${email}:`,
              deleteError,
            );
            // Continue processing other users even if one deletion fails
          }
        }
      }

      if (removedEmails.length > 0) {
        console.log(
          `Removed ${String(removedEmails.length)} user(s) from Vault (not in Airtable):`,
          removedEmails,
        );
      }

      res.json({ emails: validEmails });
    } catch (error: unknown) {
      console.error("Error listing tokens from Vault:", error);

      // Check for Vault permission/connection errors
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response: { statusCode: number } }).response.statusCode ===
          403
      ) {
        return res.status(503).json({
          error: "Cannot list tokens from Vault",
          details:
            "Vault token may be expired or invalid. Check VAULT_TOKEN environment variable.",
          code: "VAULT_PERMISSION_DENIED",
        });
      }

      res.status(503).json({
        error: "Cannot list tokens from Vault",
        details: "Vault service may be unavailable.",
        code: "VAULT_ERROR",
      });
    }
  },
);

/**
 * @openapi
 * /api/tokens/refresh-all:
 *   post:
 *     tags:
 *       - Tokens
 *     summary: Refresh all user tokens (internal endpoint)
 *     description: Called by n8n on schedule to refresh all tokens and prevent 6-month inactivity expiration. Protected by API key or internal network restriction.
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Token refresh results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: number
 *                   description: Number of successfully refreshed tokens
 *                   example: 10
 *                 failures:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         format: email
 *                       error:
 *                         type: string
 *                   description: List of failed token refreshes
 *                   example: []
 *                 totalProcessed:
 *                   type: number
 *                   description: Total number of tokens processed
 *                   example: 10
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of the refresh operation
 *                   example: '2024-01-15T12:00:00Z'
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Vault service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/refresh-all",
  apiKeyAuthMiddleware,
  rateLimitMiddleware,
  refreshAllTokens,
);

export default router;
