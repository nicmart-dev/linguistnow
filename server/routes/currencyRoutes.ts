import { Router, type Request, type Response } from "express";
import {
  refreshRates,
  getRates,
  convert,
  hasRates,
} from "../services/currencyService.js";
import { apiKeyAuthMiddleware } from "../utils/apiKeyAuth.js";
import { rateLimitMiddleware } from "../utils/rateLimit.js";

const router = Router();

/**
 * @openapi
 * /api/currency/refresh:
 *   post:
 *     tags:
 *       - Currency
 *     summary: Refresh exchange rates from Frankfurter
 *     description: Fetches fresh exchange rates from Frankfurter API and stores them in Redis cache. Called by n8n scheduler daily.
 *     responses:
 *       200:
 *         description: Rates refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 base:
 *                   type: string
 *                   example: USD
 *                 date:
 *                   type: string
 *                   example: "2024-01-15"
 *                 rates:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to refresh rates
 */
router.post(
  "/refresh",
  apiKeyAuthMiddleware,
  rateLimitMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const rates = await refreshRates();
      res.json(rates);
    } catch (error) {
      console.error("Failed to refresh rates:", error);
      res.status(500).json({
        error: "Failed to refresh exchange rates",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  },
);

/**
 * @openapi
 * /api/currency/rates:
 *   get:
 *     tags:
 *       - Currency
 *     summary: Get current exchange rates
 *     description: Returns cached exchange rates from Redis. Auto-fetches from Frankfurter if cache is empty.
 *     responses:
 *       200:
 *         description: Current exchange rates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 base:
 *                   type: string
 *                   example: USD
 *                 date:
 *                   type: string
 *                   example: "2024-01-15"
 *                 rates:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to get rates
 */
router.get("/rates", async (_req: Request, res: Response) => {
  try {
    const rates = await getRates();
    res.json(rates);
  } catch (error) {
    console.error("Failed to get rates:", error);
    res.status(500).json({
      error: "Failed to get exchange rates",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @openapi
 * /api/currency/convert:
 *   get:
 *     tags:
 *       - Currency
 *     summary: Convert amount between currencies
 *     description: Converts an amount from one currency to another using current exchange rates.
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Amount to convert
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Source currency code (ISO 4217)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Target currency code (ISO 4217)
 *     responses:
 *       200:
 *         description: Conversion result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 amount:
 *                   type: number
 *                   example: 50.25
 *                 from:
 *                   type: string
 *                   example: EUR
 *                 to:
 *                   type: string
 *                   example: USD
 *                 converted:
 *                   type: number
 *                   example: 54.75
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Failed to convert
 */
router.get("/convert", async (req: Request, res: Response) => {
  try {
    // Safely parse amount parameter
    const amountRaw = req.query.amount;
    let amount: number;
    if (Array.isArray(amountRaw)) {
      amount = Number(amountRaw[0]);
    } else if (typeof amountRaw === "string" || typeof amountRaw === "number") {
      amount = Number(amountRaw);
    } else {
      return res.status(400).json({
        error: "Invalid amount parameter",
      });
    }

    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({
        error: "Invalid amount parameter",
      });
    }

    // Safely parse from parameter
    const fromRaw = req.query.from;
    let from: string;
    if (Array.isArray(fromRaw)) {
      from = String(fromRaw[0]);
    } else if (typeof fromRaw === "string") {
      from = fromRaw;
    } else {
      return res.status(400).json({
        error: "Invalid from parameter",
      });
    }

    // Safely parse to parameter
    const toRaw = req.query.to;
    let to: string;
    if (Array.isArray(toRaw)) {
      to = String(toRaw[0]);
    } else if (typeof toRaw === "string") {
      to = toRaw;
    } else {
      return res.status(400).json({
        error: "Invalid to parameter",
      });
    }

    const converted = await convert(
      amount,
      from.toUpperCase(),
      to.toUpperCase(),
    );

    res.json({
      amount,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      converted: Math.round(converted * 100) / 100, // Round to 2 decimal places
    });
  } catch (error) {
    console.error("Failed to convert currency:", error);
    res.status(500).json({
      error: "Failed to convert currency",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @openapi
 * /api/currency/check:
 *   get:
 *     tags:
 *       - Currency
 *     summary: Check if rates are cached
 *     description: Returns whether exchange rates are available in Redis cache.
 *     responses:
 *       200:
 *         description: Cache status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasRates:
 *                   type: boolean
 */
router.get("/check", async (_req: Request, res: Response) => {
  try {
    const cached = await hasRates();
    res.json({ hasRates: cached });
  } catch (error) {
    console.error("Failed to check rates:", error);
    res.status(500).json({
      error: "Failed to check rates",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
