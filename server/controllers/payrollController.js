const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const numberToWords = (num) => {
  if (num === 0) return 'Zero Only';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  let n = ('000000000' + Math.floor(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? '' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + ' Only' : ' Only';
  return str.replace(/\s+/g, ' ').trim();
};

const generateSalarySlipPDF = (payroll) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    const p = payroll;
    const u = p.user || {};
    const bank = u.bankDetails || {};
    
    // Page Border
    doc.rect(20, 20, 555, 800).lineWidth(1.5).strokeColor('#333333').stroke();

    // -- HEADER --
    // Attempt to load logo.png if it exists
    const fs = require('fs');
    const path = require('path');
    const logoPath = path.join(__dirname, '../logo.png'); // Expecting logo.png in the server root folder
    
    if (fs.existsSync(logoPath)) {
        // Draw the image matching the width of the layout
        doc.image(logoPath, 80, 30, { width: 400, align: 'center' });
    } else {
        // Fallback text if logo.png is not found
        doc.fontSize(36).font('Helvetica-Bold').fillColor('#15803d').text('STUDY', 180, 50, { continued: true }).fillColor('#3b82f6').text(' PALACE ', { continued: true }).fillColor('#333333').text('HUB');
        doc.moveTo(180, 90).lineTo(480, 90).lineWidth(3).strokeColor('#15803d').stroke();
        doc.moveTo(180, 95).lineTo(480, 95).lineWidth(1.5).strokeColor('#3b82f6').stroke();
        doc.fontSize(16).fillColor('#dc2626').text('DOCTORS MAKING DOCTORS', 180, 105, { align: 'center', width: 300 });
    }

    // Address
    doc.fontSize(8).fillColor('#2563eb').text('KLJ TOWER, NETAJI SUBHASH PLACE, DELHI - 110034', 0, 145, { align: 'center' });

    // Pay Slip Month
    const monthStr = new Date(2000, p.month - 1).toLocaleString('default', { month: 'long' });
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#7e22ce').text(`Pay Slip for the Month of ${monthStr}`, 0, 165, { align: 'center' });

    // -- EMPLOYEE DETAILS --
    const detailsY = 200;
    const col1X = 40;
    const val1X = 150;
    const col2X = 320;
    const val2X = 420;
    const dy = 16;
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#7e22ce');
    
    const printDetailRow = (yPos, lbl1, val1, lbl2, val2) => {
      doc.font('Helvetica-Bold').fillColor('#7e22ce').text(lbl1, col1X, yPos);
      doc.font('Helvetica').fillColor('#333333').text(val1, val1X, yPos);
      if (lbl2) {
         doc.font('Helvetica-Bold').fillColor('#7e22ce').text(lbl2, col2X, yPos);
         doc.font('Helvetica').fillColor('#333333').text(val2, val2X, yPos);
      }
    };

    printDetailRow(detailsY, 'Employee Code', u.employeeId || 'N/A', 'DOB', u.birthDate ? new Date(u.birthDate).toLocaleDateString() : 'N/A');
    printDetailRow(detailsY + dy*1, 'Name', u.name || 'N/A', 'DOJ', u.joiningDate ? new Date(u.joiningDate).toLocaleDateString() : 'N/A');
    printDetailRow(detailsY + dy*2, 'Bank Name', bank.bankName || 'N/A', 'PAN No', u.panCard || 'N/A');
    printDetailRow(detailsY + dy*3, 'Bank Acc No', bank.accountNumber ? `:${bank.accountNumber}` : 'N/A', 'Bank Pay Mode', 'NEFT');
    printDetailRow(detailsY + dy*4, 'Location', 'Netaji Subhash Place', 'Month', monthStr);
    printDetailRow(detailsY + dy*5, 'Department', u.department || 'N/A', 'LOP Days', p.absentDays || 0);
    printDetailRow(detailsY + dy*6, 'WORKDAYS', p.presentDays + (p.paidLeaves || 0), 'Days in Month', p.workingDays);

    // -- TABLE SECTION --
    const tableY = 325;
    const c1 = 40;   // Earnings Col Start
    const c2 = 200;  // Earnings Amount Start
    const c3 = 300;  // Deductions Col Start
    const c4 = 460;  // Deductions Amount Start
    const wE = 160;  // Width Earngs
    const wR = 100;  // Width Rs
    const wD = 160;  // Width Ded
    const wA = 95;   // Width Amt
    
    // Draw Grid Lines (Vertical)
    doc.lineWidth(1).strokeColor('#333333');
    const drawGridLines = (topY, bottomY) => {
       doc.moveTo(c1, topY).lineTo(c1, bottomY).stroke();
       doc.moveTo(c2, topY).lineTo(c2, bottomY).stroke();
       doc.moveTo(c3, topY).lineTo(c3, bottomY).stroke();
       doc.moveTo(c4, topY).lineTo(c4, bottomY).stroke();
       doc.moveTo(c1 + wE + wR + wD + wA, topY).lineTo(c1 + wE + wR + wD + wA, bottomY).stroke();
    };

    // Draw row and horizontal line
    const drawTableRow = (yPos, eLbl, eAmt, dLbl, dAmt, isBold = false) => {
       if (isBold) doc.font('Helvetica-Bold'); else doc.font('Helvetica');
       doc.fillColor('#333333');
       
       if (eLbl) doc.text(eLbl, c1 + 5, yPos + 4);
       if (eAmt !== '') doc.text(eAmt, c2, yPos + 4, { width: wR - 5, align: 'right' });
       if (dLbl) doc.text(dLbl, c3 + 5, yPos + 4);
       if (dAmt !== '') doc.text(dAmt, c4, yPos + 4, { width: wA - 5, align: 'right' });

       doc.moveTo(c1, yPos + 18).lineTo(555, yPos + 18).stroke();
    };

    doc.moveTo(c1, tableY).lineTo(555, tableY).stroke();
    drawTableRow(tableY, 'Earnings', 'Rs', 'Deductions', 'Amount', true);
    
    let curY = tableY + 18;
    
    // Arrays for rows
    const earningsRows = [
       { label: 'Basic', amount: p.grossBaseSalary || p.baseSalary || 0 },
       ...(p.totalAllowances ? [{ label: 'Allowances', amount: p.totalAllowances }] : []),
       ...(p.monthlyBonus ? [{ label: 'Monthly Bonus', amount: p.monthlyBonus }] : []),
       ...(p.performanceBonus ? [{ label: 'Performance Bonus', amount: p.performanceBonus }] : [])
    ];
    if (p.adjustments) {
        p.adjustments.filter(a => a.type === 'Addition').forEach(a => earningsRows.push({ label: a.reason, amount: a.amount }));
    }

    const deductionsRows = [
       ...(p.absentDeduction ? [{ label: 'Leave Deduction', amount: parseFloat(p.absentDeduction.toFixed(2)) }] : []),
       ...(p.halfDayDeduction ? [{ label: 'Half-Day Deduction', amount: parseFloat(p.halfDayDeduction.toFixed(2)) }] : [])
    ];
    if (p.adjustments) {
        p.adjustments.filter(a => a.type === 'Deduction').forEach(a => deductionsRows.push({ label: a.reason, amount: a.amount }));
    }

    const maxRows = Math.max(earningsRows.length, deductionsRows.length, 6);
    
    let totalE = 0;
    let totalD = 0;
    
    for (let i = 0; i < maxRows; i++) {
        let eLbl = '', eAmt = '', dLbl = '', dAmt = '';
        if (i < earningsRows.length) {
            eLbl = earningsRows[i].label;
            eAmt = Math.round(earningsRows[i].amount);
            totalE += Number(earningsRows[i].amount);
        }
        if (i < deductionsRows.length) {
            dLbl = deductionsRows[i].label;
            dAmt = deductionsRows[i].amount;
            totalD += Number(deductionsRows[i].amount);
        }
        drawTableRow(curY, eLbl, eAmt.toString(), dLbl, dAmt.toString());
        curY += 18;
    }

    // Totals row
    drawTableRow(curY, 'Total Earning', Math.round(totalE).toString(), 'Total Deduction', totalD.toString(), true);
    curY += 18;

    // Blank spacer row
    drawTableRow(curY, '', '', '', '');
    curY += 18;

    // Bottom Summary
    const netPay = Math.round(p.netSalary);
    const perDay = (totalE / p.workingDays).toFixed(7);
    
    drawGridLines(tableY, curY + 18 * 3); // extend vertical lines

    // Per day
    doc.font('Helvetica-Bold').fillColor('#7e22ce').text('Per Day:', c1 + 5, curY + 4);
    doc.font('Helvetica-Bold').fillColor('#333333').text(perDay, c4, curY + 4, { width: wA - 5, align: 'right' });
    doc.moveTo(c1, curY + 18).lineTo(555, curY + 18).strokeColor('#333333').stroke();
    curY += 18;
    
    // Net Pay (Bank)
    doc.font('Helvetica-Bold').fillColor('#7e22ce').text('Net Pay (Bank):', c1 + 5, curY + 4);
    doc.font('Helvetica-Bold').fillColor('#333333').text(netPay.toString(), c4, curY + 4, { width: wA - 5, align: 'right' });
    doc.moveTo(c1, curY + 18).lineTo(555, curY + 18).strokeColor('#333333').stroke();
    curY += 18;

    // In Words
    doc.font('Helvetica-Bold').fillColor('#7e22ce').text('In Words:', c1 + 5, curY + 4);
    doc.font('Helvetica-Bold').fillColor('#333333').text(numberToWords(netPay), c3 + 5, curY + 4, { width: wD + wA - 5, align: 'center' });
    doc.moveTo(c1, curY + 18).lineTo(555, curY + 18).strokeColor('#333333').stroke();
    curY += 18;

    // Footer Message
    curY += 40;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#dc2626').text('Dear Employee we thank you for being part of Study Palace Hub Family', 0, curY, { align: 'center' });

    // Seal and Signature
    curY += 50;
    
    // Fake seal drawing
    doc.save()
       .rotate(-30, { origin: [450, curY + 30] })
       .circle(450, curY + 30, 40).lineWidth(1).strokeColor('#7c3aed').stroke()
       .circle(450, curY + 30, 35).stroke();
    
    doc.fontSize(8).fillColor('#7c3aed').text('STUDY PALACE HUB PVT LTD', 390, curY + 10, { width: 120, align: 'center' });
    doc.text('HR DEPARTMENT', 390, curY + 30, { width: 120, align: 'center' });
    doc.restore();
    
    // Signature text overlapping
    doc.fontSize(8).fillColor('#333333').text('Authorised Signatory', 400, curY + 60);
    doc.text('New Delhi', 420, curY + 70);

    doc.end();
  });
};

// @desc    Generate payroll for all employees for a given month
// @route   POST /api/payroll/generate
// @access  Private (Admin/HR)
const generateMonthlyPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    const employees = await User.find({ role: { $ne: 'Admin' }, isActive: 'Active' });

    const results = [];

    for (const emp of employees) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const dailyRate = (emp.salaryStructure?.baseSalary || 0) / daysInMonth;

      const datePrefix = `${year}-${month.toString().padStart(2, '0')}`;
      const attendanceRecords = await Attendance.find({
        user: emp._id,
        date: { $regex: `^${datePrefix}` }
      });

      const holidays = await Holiday.find({
        date: { $regex: `^${datePrefix}` }
      });
      const holidayDates = holidays.map(h => h.date);

      let presentDays = 0;
      let lateDays = 0;
      let unpaidLeaves = 0;
      let halfDays = 0;
      let paidLeaves = 0;

      // Map attendance for quick lookup
      const attendanceMap = {};
      attendanceRecords.forEach(r => attendanceMap[r.date] = r);

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        const dateObj = new Date(year, month - 1, d);
        const isSunday = dateObj.getDay() === 0;
        const isHoliday = holidayDates.includes(dateStr);

        const record = attendanceMap[dateStr];

        if (record) {
          if (record.status === 'Present') presentDays += 1;
          else if (record.status === 'Late') { presentDays += 1; lateDays += 1; }
          else if (record.status === 'Half-day') { presentDays += 0.5; halfDays += 1; }
          else if (record.status === 'Paid Leave') paidLeaves += 1;
          else if (record.status === 'Unpaid Leave' || record.status === 'Absent') {
            // Deduct only if NOT Sunday and NOT Holiday
            if (!isSunday && !isHoliday) {
              unpaidLeaves += 1;
            }
          }
        } else {
          // No record. Check if it's a workday.
          if (!isSunday && !isHoliday) {
            unpaidLeaves += 1; // Default to unpaid leave if absent on workday
          }
        }
      }

      const grossBaseSalary = emp.salaryStructure?.baseSalary || 0;
      const totalAllowances = (emp.salaryStructure?.housingAllowance || 0) + 
                             (emp.salaryStructure?.transportAllowance || 0) +
                             (emp.salaryStructure?.otherAllowances || 0);
      const monthlyBonus = emp.salaryStructure?.monthlyBonus || 0;
      
      // Explicit Deductions
      const absentDeduction = unpaidLeaves * dailyRate;
      const halfDayDeduction = halfDays * (dailyRate / 2);
      const lateDeduction = lateDays * 0; // Removing late penalty as per "Salary deductions should ONLY occur based on: Half Days, Leaves"

      // KPI Bonuses
      const KpiRecord = require('../models/KpiRecord');
      const startOfMonths = new Date(year, month - 1, 1);
      const endOfMonths = new Date(year, month, 1);
      const kpiRecords = await KpiRecord.find({
        employeeId: emp._id,
        date: { $gte: startOfMonths, $lt: endOfMonths }
      });
      const monthlyKpiPoints = kpiRecords.reduce((acc, curr) => acc + (curr.points || 0), 0);
      const performanceBonus = Math.max(0, monthlyKpiPoints * 50);

      const calculatedNetSalary = grossBaseSalary + totalAllowances + monthlyBonus + performanceBonus - absentDeduction - halfDayDeduction;

      // Persist or Update Payroll
      let payroll = await Payroll.findOne({ user: emp._id, month, year });
      
      const payrollData = {
        user: emp._id, month, year,
        workingDays: daysInMonth,
        presentDays, 
        absentDays: unpaidLeaves, // Mapping unpaid leaves to absentDays for UI compatibility
        lateDays, halfDays, paidLeaves,
        baseSalary: parseFloat((grossBaseSalary).toFixed(2)), 
        grossBaseSalary: parseFloat(grossBaseSalary.toFixed(2)),
        totalAllowances, 
        monthlyBonus,
        performanceBonus,
        absentDeduction: parseFloat(absentDeduction.toFixed(2)),
        halfDayDeduction: parseFloat(halfDayDeduction.toFixed(2)),
        lateDeduction: parseFloat(lateDeduction.toFixed(2)),
        totalDeductions: payroll ? payroll.adjustments.filter(a => a.type==='Deduction').reduce((sum, a) => sum + a.amount, 0) : 0,
        netSalary: parseFloat(Math.max(0, calculatedNetSalary).toFixed(2)),
        status: payroll?.status || 'Draft'
      };

      // Apply existing manual adjustments to net salary
      if (payroll && payroll.adjustments && payroll.adjustments.length > 0) {
        payroll.adjustments.forEach(adj => {
          if (adj.type === 'Addition') payrollData.netSalary += adj.amount;
          else payrollData.netSalary -= adj.amount;
        });
        payrollData.netSalary = Math.max(0, payrollData.netSalary);
      }

      if (payroll) {
        if (payroll.status === 'Draft') {
          Object.assign(payroll, payrollData);
          await payroll.save();
        }
      } else {
        payroll = await Payroll.create(payrollData);
      }
      
      const populatedPayroll = await Payroll.findById(payroll._id).populate('user', 'name role email employeeId designation department bankDetails panCard birthDate joiningDate');
      results.push(populatedPayroll);
    }

    res.status(200).json({ message: `Payroll generated for ${results.length} employees`, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const convertLeavesToPaid = async (req, res) => {
  try {
    const { daysToConvert } = req.body;
    const payroll = await Payroll.findById(req.params.id);
    
    if (!payroll) return res.status(404).json({ message: 'Payroll record not found' });
    if (payroll.status === 'Paid') return res.status(400).json({ message: 'Cannot modify paid payroll' });
    if (!daysToConvert || daysToConvert <= 0) return res.status(400).json({ message: 'Invalid days to convert' });

    // Find attendance records for this month that are "Absent"
    const datePrefix = `${payroll.year}-${payroll.month.toString().padStart(2, '0')}`;
    const absentRecords = await Attendance.find({
      user: payroll.user,
      date: { $regex: `^${datePrefix}` },
      status: 'Absent'
    }).limit(daysToConvert);

    if (absentRecords.length < daysToConvert) {
      return res.status(400).json({ message: `Employee only has ${absentRecords.length} absent days available to convert.` });
    }

    // Convert them to Paid Leave
    for (let record of absentRecords) {
      record.status = 'Paid Leave';
      await record.save();
    }

    res.status(200).json({ message: `Successfully converted ${daysToConvert} absent days to paid leave. Please regenerate payroll.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addAdjustment = async (req, res) => {
  try {
    const { amount, reason, type } = req.body;
    const payroll = await Payroll.findById(req.params.id);
    
    if (!payroll) return res.status(404).json({ message: 'Payroll record not found' });
    if (payroll.status === 'Paid') return res.status(400).json({ message: 'Cannot adjust paid payroll' });

    const numAmount = Number(amount);
    payroll.adjustments.push({ amount: numAmount, reason, type });
    
    // Update net salary
    if (type === 'Addition') {
      payroll.netSalary += numAmount;
    } else {
      payroll.netSalary -= numAmount;
      payroll.totalDeductions = (payroll.totalDeductions || 0) + numAmount;
    }

    await payroll.save();
    const populated = await Payroll.findById(payroll._id).populate('user', 'name role email employeeId designation department bankDetails panCard birthDate joiningDate');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const processPayment = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('user');
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });

    payroll.status = 'Paid';
    payroll.paymentDate = new Date();
    await payroll.save();

    // Trigger share email automatically upon payment if desired
    // For now we just return the record as the frontend has a manual share button too
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyPayroll = async (req, res) => {
  try {
    const records = await Payroll.find({ user: req.user._id }).sort({ year: -1, month: -1 }).populate('user', 'name role email employeeId designation department bankDetails panCard birthDate joiningDate');
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('user', 'name role email employeeId designation department bankDetails panCard birthDate joiningDate');
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });
    const isAdminOrHR = ['Admin', 'HR'].includes(req.user.role);
    const isOwner = payroll.user._id.toString() === req.user._id.toString();
    if (!isAdminOrHR && !isOwner) return res.status(403).json({ message: 'Not authorized' });
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPayrollPDF = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('user', 'name role email employeeId designation department bankDetails panCard birthDate joiningDate');
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });
    const isAdminOrHR = ['Admin', 'HR'].includes(req.user.role);
    const isOwner = payroll.user?._id?.toString() === req.user._id.toString();
    if (!isAdminOrHR && !isOwner) return res.status(403).json({ message: 'Not authorized' });
    const pdfBuffer = await generateSalarySlipPDF(payroll);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="SalarySlip_${payroll.user?.name || 'Employee'}_${payroll.month}_${payroll.year}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sharePayrollEmail = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('user');
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });

    // Permissions
    const isAdminOrHR = ['Admin', 'HR'].includes(req.user.role);
    const isOwner = payroll.user._id.toString() === req.user._id.toString();

    if (!isAdminOrHR && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to share this slip' });
    }

    // Generate PDF
    const pdfBuffer = await generateSalarySlipPDF(payroll);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ Email credentials not set. Simulated share with PDF for:', payroll.user.email);
      return res.status(200).json({ message: 'Simulated: PDF Slip shared to employee email', simulated: true });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"Study Palace Hub HRMS" <${process.env.SMTP_USER}>`,
      to: payroll.user.email,
      subject: `Official Salary Slip - ${payroll.month}/${payroll.year}`,
      text: `Hello ${payroll.user.name}, please find attached your official salary slip for ${payroll.month}/${payroll.year}.`,
      attachments: [
        {
          filename: `SalarySlip_${payroll.month}_${payroll.year}.pdf`,
          content: pdfBuffer
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Salary slip PDF shared successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ message: 'Error sending email or generating PDF' });
  }
};

module.exports = { 
  generateMonthlyPayroll, 
  convertLeavesToPaid,
  addAdjustment, 
  processPayment, 
  getMyPayroll,
  getPayrollById,
  getPayrollPDF,
  sharePayrollEmail 
};

