const express = require('express');
const { getReports } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.get('/', getReports);

module.exports = router;
