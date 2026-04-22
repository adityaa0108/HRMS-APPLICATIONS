const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); // Override system DNS to fix querySrv ECONNREFUSED

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
require('./cron/emailSender'); // start cron

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect Database with retry logic
const connectWithRetry = async (attempt = 1) => {
  const MAX_ATTEMPTS = Infinity; // Keep retrying until Atlas is reachable
  const RETRY_DELAY_MS = 5000;

  try {
    console.log(`🔄 MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS}...`);
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected');

    console.log('✅ MongoDB Connected');

  } catch (err) {
    console.error(`❌ MongoDB connection failed (attempt ${attempt}): ${err.message}`);
    if (err.code === 'ECONNREFUSED' || err.message.includes('querySrv') || err.message.includes('whitelist') || err.message.includes('IP')) {
      console.error('   ⚠️  Your IP is not whitelisted in MongoDB Atlas.');
      console.error('   ➡️  Go to: https://cloud.mongodb.com → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)');
    }
    if (attempt < MAX_ATTEMPTS) {
      console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => connectWithRetry(attempt + 1), RETRY_DELAY_MS);
    } else {
      console.error('❌ Max connection attempts reached. Please check your MongoDB Atlas settings.');
    }
  }
};

connectWithRetry();

// Guard: block API calls if DB is not connected
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database not connected. Please wait — the server is retrying the MongoDB connection. If this persists, check your MongoDB Atlas IP whitelist at https://cloud.mongodb.com'
    });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/kpi', require('./routes/kpi'));
app.use('/api/settings', require('./routes/settingsRoutes'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT} and bound to 0.0.0.0`));
