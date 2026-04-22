const User = require('../models/User');

// @desc    Get all employees with filters
// @route   GET /api/employees
// @access  Private (Admin/HR/Manager)
const getEmployees = async (req, res) => {
  try {
    const { department, role, search } = req.query;
    let query = {};
    
    if (department) query.department = department;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await User.find(query).select('-password');
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single employee details
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    // Also fetch KPI history if needed, or handle in a separate controller
    // For now, let's keep it consistent with the frontend expectations if possible
    res.status(200).json({ employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get counts and stats for dashboard
// @route   GET /api/employees/stats
// @access  Private (Admin/HR)
// @desc    Get counts and stats for dashboard
// @route   GET /api/employees/stats
// @access  Private (Admin/HR)
const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: { $ne: 'Admin' } });
    const departmentStats = await User.aggregate([
      { $match: { role: { $ne: 'Admin' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    
    // Upcoming birthdays (within 30 days)
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    
    const upcomingBirthdays = await User.find({
      birthDate: { $exists: true, $ne: null }
      // Complex logic for birthdays regardless of year usually involves aggregation
    }).select('name birthDate profilePic');

    res.status(200).json({
      totalEmployees,
      departmentStats,
      upcomingBirthdays
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee details
// @route   PATCH /api/employees/:id
// @access  Private (Admin/HR)
const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const updates = req.body;
    
    // Prevent role escalation: ONLY Admins can promote someone TO Admin.
    if (updates.role) {
      if (req.user.role === 'Admin') {
         // Admins can set any role
      } else if (req.user.role === 'HR') {
         // HR can promote to Manager or HR, but NOT Admin
         if (updates.role === 'Admin') {
            return res.status(403).json({ message: 'Only Admins can promote to the Admin role' });
         }
      } else {
         // Others cannot change roles
         delete updates.role;
      }
    }

    Object.assign(employee, updates);
    await employee.save();

    res.status(200).json(employee);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit KYC details
// @route   POST /api/employees/submit-kyc
// @access  Private
const submitKYC = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { phoneNumber, address, bankDetails, employeeId, birthDate, joiningDate, panCard } = req.body;
    
    // Update text fields
    user.phoneNumber = phoneNumber;
    user.address = address;
    user.employeeId = employeeId;
    if (birthDate) user.birthDate = birthDate;
    if (joiningDate) user.joiningDate = joiningDate;
    if (panCard) user.panCard = panCard;

    if (bankDetails) {
       user.bankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;
    }

    // Update File paths from multer
    if (req.files) {
      if (req.files.panCard) user.panCardImage = `/uploads/${req.files.panCard[0].filename}`;
      if (req.files.aadhaarFront) user.aadhaarFrontImage = `/uploads/${req.files.aadhaarFront[0].filename}`;
      if (req.files.aadhaarBack) user.aadhaarBackImage = `/uploads/${req.files.aadhaarBack[0].filename}`;
      if (req.files.photo) user.employeePhoto = `/uploads/${req.files.photo[0].filename}`;
    }

    user.kycStatus = 'Pending';
    await user.save();

    res.status(200).json({ message: 'KYC details submitted successfully and pending approval', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Review KYC (Approve/Reject)
// @route   PATCH /api/employees/:id/kyc-review
// @access  Private (Admin/HR)
const reviewKYC = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    employee.kycStatus = status;
    // We could store remarks in a new field if needed
    await employee.save();

    res.status(200).json({ message: `Employee KYC ${status}`, employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEmployees, getEmployeeById, getEmployeeStats, updateEmployee, submitKYC, reviewKYC };

