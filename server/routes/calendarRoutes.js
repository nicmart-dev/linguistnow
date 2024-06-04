const express = require('express');
const { saveSelectedCalendars } = require('../controllers/calendarController');

const router = express.Router();

router.post('/save-calendars', saveSelectedCalendars);

module.exports = router;
