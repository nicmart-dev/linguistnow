const express = require('express');
const { triggerN8nWorkflow } = require('../controllers/calendarController');

const router = express.Router();

router.post('/free', triggerN8nWorkflow);

module.exports = router;
