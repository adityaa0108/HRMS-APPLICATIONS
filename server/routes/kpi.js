const express = require('express');
const router = express.Router();
const { manageKpi, getLeaderboard } = require('../controllers/kpiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/manage', protect, authorize('Admin', 'HR', 'AGM'), manageKpi);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
