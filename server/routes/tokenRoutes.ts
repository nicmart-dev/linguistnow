import express from "express";
import { refreshAllTokens } from "../controllers/tokenRefreshController.js";
import { listTokens, deleteToken } from "../utils/vaultClient.js";
import { userExistsInAirtable } from "../controllers/usersController.js";

const router = express.Router();

/**
 * @swagger
 * /api/tokens/list:
 *   get:
 *     summary: List all user emails that have tokens stored
 *     description: Returns list of user emails with tokens in Vault that also exist in Airtable. Users not in Airtable are automatically removed from Vault. Used by Dashboard to filter linguists before checking availability.
 *     tags: [Tokens]
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
 *       503:
 *         description: Vault service unavailable
 */
router.get("/list", async (_req, res) => {
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
});

/**
 * @swagger
 * /api/tokens/refresh-all:
 *   post:
 *     summary: Refresh all user tokens (internal endpoint)
 *     description: Called by n8n on schedule to refresh all tokens and prevent 6-month inactivity expiration
 *     tags: [Tokens]
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
 *                 failures:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalProcessed:
 *                   type: number
 *                 timestamp:
 *                   type: string
 */
router.post("/refresh-all", refreshAllTokens);

export default router;
