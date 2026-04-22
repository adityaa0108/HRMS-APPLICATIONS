const express = require('express');
const router = express.Router();
const { loginUser, registerUser, setupPassword, checkToken, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/setup-password/:token', setupPassword);
router.get('/check-token/:token', checkToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;




