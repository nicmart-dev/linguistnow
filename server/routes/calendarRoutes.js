const express = require('express');
const { isUserFree } = require('../controllers/calendarController');

const router = express.Router();

// POST /api/calendars/free
router.post('/free', isUserFree);

module.exports = router;
