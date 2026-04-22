const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getMyHistory, getAllAttendance, getMonthlyAttendance, getTodayRecord, updateAttendanceStatus } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/my-history', protect, getMyHistory);
router.get('/today', protect, getTodayRecord);
router.get('/all', protect, authorize('Admin', 'HR', 'AGM'), getAllAttendance);
router.get('/monthly/:year/:month', protect, getMonthlyAttendance);
router.patch('/status', protect, authorize('Admin', 'HR'), updateAttendanceStatus);

module.exports = router;
