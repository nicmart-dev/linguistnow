import express, { type Router } from "express";
import authController from "../controllers/authController.js";

const router: Router = express.Router();

/**
 * @openapi
 * /api/auth/google/code:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Exchange authorization code for tokens
 *     description: Exchanges a Google OAuth authorization code for access token and refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Google OAuth authorization code
 *                 example: '4/0AeanS0...'
 *     responses:
 *       200:
 *         description: Successfully exchanged code for tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: 'ya29.a0...'
 *                 refreshToken:
 *                   type: string
 *                   example: '1//0...'
 *       500:
 *         description: Failed to exchange code for token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/google/code", authController.exchangeCodeForToken);

/**
 * @openapi
 * /api/auth/google/userInfo:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Get user info from Google
 *     description: Fetches user information from Google People API using an access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Google OAuth access token
 *                 example: 'ya29.a0...'
 *     responses:
 *       200:
 *         description: Successfully fetched user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userInfo:
 *                   $ref: '#/components/schemas/UserInfo'
 *       500:
 *         description: Failed to fetch user info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/google/userInfo", authController.getUserInfo);

export default router;
