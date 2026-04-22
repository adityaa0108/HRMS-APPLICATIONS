const User = require('../models/User');
const KpiRecord = require('../models/KpiRecord');

const manageKpi = async (req, res) => {
  const { employeeId, date, points, reason } = req.body;
  const adminId = req.user._id;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ message: 'A mandatory reason must be provided' });
  }

  if (!date || points === undefined || points === null) {
     return res.status(400).json({ message: 'Date and points are required' });
  }

  try {
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }

    const kpiRecord = await KpiRecord.create({
      employeeId,
      assignedBy: adminId,
      date,
      points: Number(points),
      reason
    });

    employee.totalKpi += Number(points);
    if (Number(points) > 0) employee.totalAdded += Number(points);
    else employee.totalDeducted += Math.abs(Number(points));
    await employee.save();

    res.status(201).json({ message: 'KPI updated successfully', kpiRecord, totalKpi: employee.totalKpi });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ isActive: 'Active', role: { $ne: 'Admin' } })
      .select('name role totalKpi totalAdded totalDeducted profilePic designation')
      .sort({ totalKpi: -1 });
    
    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { manageKpi, getLeaderboard };
