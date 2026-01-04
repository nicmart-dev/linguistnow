import express, { type Router } from "express";
import {
  searchLinguists,
  getFilterOptions,
  getLinguistById,
  updateLinguistRating,
} from "../controllers/linguistsController.js";

const router: Router = express.Router();

/**
 * @openapi
 * /api/linguists/search:
 *   get:
 *     tags:
 *       - Linguists
 *     summary: Search and filter linguists with availability
 *     description: |
 *       Search linguists by various criteria and get their availability information.
 *       Supports filtering by languages, specialization, rate, rating, and availability status.
 *       Returns paginated results with availability details.
 *     parameters:
 *       - in: query
 *         name: languages
 *         schema:
 *           type: string
 *         description: Comma-separated language pairs (e.g., "EN-FR,EN-ES")
 *         example: EN-FR,EN-ES
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Comma-separated specializations (e.g., "Legal,Medical")
 *         example: Legal,Medical
 *       - in: query
 *         name: minRate
 *         schema:
 *           type: number
 *         description: Minimum hourly rate
 *         example: 25
 *       - in: query
 *         name: maxRate
 *         schema:
 *           type: number
 *         description: Maximum hourly rate
 *         example: 100
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating (1-5)
 *         example: 4
 *       - in: query
 *         name: availableOnly
 *         schema:
 *           type: boolean
 *         description: Only show available linguists
 *         example: true
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Availability window start date (ISO format)
 *         example: 2024-01-15
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Availability window end date (ISO format)
 *         example: 2024-01-22
 *       - in: query
 *         name: requiredHours
 *         schema:
 *           type: number
 *         description: Project size in hours (filters linguists with enough free time)
 *         example: 40
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *         description: IANA timezone for availability calculation
 *         example: America/Los_Angeles
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Search results with linguists and availability
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 linguists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LinguistWithAvailability'
 *                 total:
 *                   type: integer
 *                   description: Total number of linguists matching filters
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                 filters:
 *                   type: object
 *                   description: Echo back applied filters
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/search", searchLinguists);

/**
 * @openapi
 * /api/linguists/filters:
 *   get:
 *     tags:
 *       - Linguists
 *     summary: Get available filter options
 *     description: Returns all available values for filter dropdowns (languages, specializations, rate ranges, etc.)
 *     responses:
 *       200:
 *         description: Filter options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 languages:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: All language pairs in system
 *                   example: ["EN-FR", "EN-ES", "EN-DE"]
 *                 specializations:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: All specialization options
 *                   example: ["Legal", "Medical", "Technical"]
 *                 rateRange:
 *                   type: object
 *                   properties:
 *                     min:
 *                       type: number
 *                     max:
 *                       type: number
 *                   description: Min and max hourly rates
 *                   example: { "min": 20, "max": 150 }
 *                 ratingRange:
 *                   type: object
 *                   properties:
 *                     min:
 *                       type: number
 *                     max:
 *                       type: number
 *                   description: Min and max ratings
 *                   example: { "min": 1, "max": 5 }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/filters", getFilterOptions);

/**
 * @openapi
 * /api/linguists/{id}:
 *   get:
 *     tags:
 *       - Linguists
 *     summary: Get single linguist with full details
 *     description: Retrieves a single linguist by email with complete profile and availability information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Linguist's email address
 *         example: linguist@example.com
 *     responses:
 *       200:
 *         description: Linguist details with availability
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LinguistWithAvailability'
 *       404:
 *         description: Linguist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", getLinguistById);

/**
 * @openapi
 * /api/linguists/{id}/rating:
 *   patch:
 *     tags:
 *       - Linguists
 *     summary: Update linguist rating
 *     description: Updates a linguist's rating (1-5 stars). Only PMs can update ratings.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Linguist's email address
 *         example: linguist@example.com
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating value (1-5 stars)
 *                 example: 4
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rating:
 *                   type: number
 *                   minimum: 1
 *                   maximum: 5
 *       400:
 *         description: Invalid rating value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Linguist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:id/rating", updateLinguistRating);

export default router;
