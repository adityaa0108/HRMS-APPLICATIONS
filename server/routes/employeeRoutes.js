const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getEmployees, getEmployeeById, getEmployeeStats, updateEmployee, submitKYC, reviewKYC } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Multer Config for KYC
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.get('/', protect, authorize('Admin', 'HR', 'Manager', 'AGM'), getEmployees);
router.get('/stats', protect, authorize('Admin', 'HR'), getEmployeeStats);
router.get('/:id', protect, getEmployeeById);
router.patch('/:id', protect, authorize('Admin', 'HR'), updateEmployee);

// KYC Routes
router.post('/submit-kyc', protect, upload.fields([
  { name: 'panCard', maxCount: 1 },
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), submitKYC);

router.patch('/:id/kyc-review', protect, authorize('Admin', 'HR'), reviewKYC);

module.exports = router;

