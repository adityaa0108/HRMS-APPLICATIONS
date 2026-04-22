const Attendance = require('../models/Attendance');

// @desc    Check-in for today
// @route   POST /api/attendance/check-in
// @access  Private (Employee)
exports.checkIn = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await Attendance.findOne({ user: req.user._id, date: today });

    if (existing && existing.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const checkInTime = new Date();
    // Default Late threshold: 10:15 AM
    const lateThreshold = new Date();
    lateThreshold.setHours(10, 15, 0);

    let status = 'Present';
    if (checkInTime > lateThreshold) {
      status = 'Late';
    }

    if (existing) {
      existing.checkIn = checkInTime;
      existing.status = status;
      await existing.save();
      return res.status(200).json(existing);
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      date: today,
      checkIn: checkInTime,
      status: status
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check-out for today
// @route   POST /api/attendance/check-out
// @access  Private (Employee)
exports.checkOut = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ user: req.user._id, date: today });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'No check-in record found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    
    // Calculate total hours
    const diff = attendance.checkOut - attendance.checkIn;
    const hours = diff / (1000 * 60 * 60);
    attendance.totalHours = parseFloat(hours.toFixed(2));

    // Handle minor shortfalls (>= 8.5) and half-days
    if (attendance.totalHours >= 8.5) {
       if (attendance.status === 'Late') {
          attendance.status = 'Present'; // Waiver for completing hours despite being late
          attendance.note = (attendance.note ? attendance.note + ' | ' : '') + 'Late waived: completed full hours';
       }
    } else {
       attendance.status = 'Half-day';
       attendance.note = (attendance.note ? attendance.note + ' | ' : '') + 'Half-day due to shortfall in hours';
    }

    await attendance.save();
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's attendance history
// @route   GET /api/attendance/my-history
// @access  Private
exports.getMyHistory = async (req, res) => {
  try {
    const history = await Attendance.find({ user: req.user._id }).sort({ date: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all employees' attendance for a specific date (Admin/HR)
// @route   GET /api/attendance/all
// @access  Private (Admin/HR)
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, userId } = req.query;
    let query = {};
    if (date) query.date = date;
    if (userId) query.user = userId;

    const history = await Attendance.find(query)
      .populate('user', 'name email employeeId designation')
      .sort({ date: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's today attendance
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayRecord = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    res.status(200).json(attendance ? [attendance] : []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly attendance for a user
// @route   GET /api/attendance/monthly/:year/:month
// @access  Private
exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { userId } = req.query;
    const targetUserId = userId || req.user._id;

    const datePrefix = `${year}-${month.toString().padStart(2, '0')}`;
    const records = await Attendance.find({
      user: targetUserId,
      date: { $regex: `^${datePrefix}` }
    }).sort({ date: 1 });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update attendance status manually (Admin/HR)
// @route   PATCH /api/attendance/status
// @access  Private (Admin/HR)
exports.updateAttendanceStatus = async (req, res) => {
  try {
    const { userId, date, status, note } = req.body;
    
    let record = await Attendance.findOne({ user: userId, date });
    
    if (record) {
      record.status = status;
      if (note) record.note = note;
      await record.save();
    } else {
      record = await Attendance.create({
        user: userId,
        date,
        status,
        note: note || 'Manually set by HR'
      });
    }
    
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkIn: exports.checkIn,
  checkOut: exports.checkOut,
  getMyHistory: exports.getMyHistory,
  getAllAttendance: exports.getAllAttendance,
  getMonthlyAttendance: exports.getMonthlyAttendance,
  getTodayRecord: exports.getTodayRecord,
  updateAttendanceStatus: exports.updateAttendanceStatus
};
