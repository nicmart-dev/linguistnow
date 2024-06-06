const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// Route for exchanging authorization code for access token and refresh token
router.post('/google/code', authController.exchangeCodeForToken);

// Route for fetching user info from Google People API
router.post('/google/userInfo', authController.getUserInfo);

module.exports = router;
