const express = require('express');
const {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
} = require('../controllers/readingController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All reading routes require authentication
router.use(authenticateToken);

router.post('/', createReading);
router.get('/', getReadings);
router.get('/:id', getReadingById);
router.put('/:id', updateReading);
router.delete('/:id', deleteReading);

module.exports = router;
