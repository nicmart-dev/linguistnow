import express from "express";
import { refreshAllTokens } from "../controllers/tokenRefreshController.js";
import { listTokens } from "../utils/vaultClient.js";

const router = express.Router();

/**
 * @swagger
 * /api/tokens/list:
 *   get:
 *     summary: List all user emails that have tokens stored
 *     description: Returns list of user emails with tokens in Vault. Used by Dashboard to filter linguists before checking availability.
 *     tags: [Tokens]
 *     responses:
 *       200:
 *         description: List of user emails with tokens
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
    const emails = await listTokens();
    res.json({ emails });
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
