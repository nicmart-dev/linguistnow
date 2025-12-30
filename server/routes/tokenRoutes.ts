import express from "express";
import { refreshAllTokens } from "../controllers/tokenRefreshController.js";

const router = express.Router();

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
