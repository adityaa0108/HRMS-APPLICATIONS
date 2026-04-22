import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import {
  DollarSign, FileText, Download, Send, PlusCircle, CreditCard,
  Filter, X, Eye, TrendingUp,
  TrendingDown, AlertCircle, CheckCircle, Clock, User as UserIcon,
  ChevronDown, Calendar
} from 'lucide-react';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const monthName = (m) => new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

// ─── Invoice Modal ───────────────────────────────────────────────────────────
function InvoiceModal({ payroll, onClose, onDownload }) {
  if (!payroll) return null;
  const p = payroll;
  const grossBase = p.grossBaseSalary || p.baseSalary || 0;
  const totalDeductAuto = (p.absentDeduction || 0) + (p.halfDayDeduction || 0);
  const manualDeductions = (p.adjustments || []).filter(a => a.type === 'Deduction');
  const manualAdditions  = (p.adjustments || []).filter(a => a.type === 'Addition');
  const manualDedTotal   = manualDeductions.reduce((s, a) => s + a.amount, 0);
  const manualAddTotal   = manualAdditions.reduce((s, a) => s + a.amount, 0);
  const totalEarnings    = grossBase + (p.totalAllowances || 0) + (p.monthlyBonus || 0) + (p.performanceBonus || 0) + manualAddTotal;
  const totalDeductions  = totalDeductAuto + manualDedTotal;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-8 flex justify-between items-start relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">Official Salary Slip</p>
            <h2 className="text-3xl font-black mt-2 tracking-tight">Study Palace Hub</h2>
            <p className="text-slate-400 font-bold mt-1">{monthName(p.month)} {p.year}</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition relative z-10">
            <X size={20} />
          </button>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          {/* Employee Info Card */}
          <div className="grid grid-cols-2 gap-8 bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Employee Info</p>
              <p className="font-black text-slate-800 text-lg leading-tight">{p.user?.name}</p>
              <p className="text-xs font-bold text-slate-500">{p.user?.designation || 'Staff Member'} • {p.user?.employeeId || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Pay Period</p>
              <p className="font-black text-slate-800 text-lg leading-tight">{monthName(p.month)} {p.year}</p>
              <p className="text-xs font-bold text-slate-500">{p.workingDays} Total Days</p>
            </div>
          </div>

          {/* Attendance Stats Summary */}
          <div className="grid grid-cols-4 gap-4">
               <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-emerald-600">{p.presentDays || 0}</p>
                  <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">Days Present</p>
               </div>
               <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-red-600">{p.absentDays || 0}</p>
                  <p className="text-[9px] font-black text-red-600/60 uppercase tracking-widest">Unpaid Leave</p>
               </div>
               <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-amber-600">{p.halfDays || 0}</p>
                  <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest">Half Days</p>
               </div>
               <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-blue-600">{p.paidLeaves || 0}</p>
                  <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">Paid Leaves</p>
               </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Earnings Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Earnings breakdown
              </h3>
              <div className="space-y-3 bg-white">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm font-bold text-slate-500">Fixed Monthly Salary</span>
                  <span className="font-black text-slate-800">{fmt(grossBase)}</span>
                </div>
                {p.totalAllowances > 0 && (
                   <div className="flex justify-between items-center py-1">
                     <span className="text-sm font-bold text-slate-500">Allowances</span>
                     <span className="font-black text-slate-800">{fmt(p.totalAllowances)}</span>
                   </div>
                )}
                {p.monthlyBonus > 0 && (
                   <div className="flex justify-between items-center py-1">
                     <span className="text-sm font-bold text-slate-500">Monthly Bonus</span>
                     <span className="font-black text-emerald-600">+{fmt(p.monthlyBonus)}</span>
                   </div>
                )}
                {p.performanceBonus > 0 && (
                   <div className="flex justify-between items-center py-1">
                     <span className="text-sm font-bold text-slate-500">Performance Bonus</span>
                     <span className="font-black text-emerald-600">+{fmt(p.performanceBonus)}</span>
                   </div>
                )}
                {manualAdditions.map((adj, i) => (
                   <div key={i} className="flex justify-between items-center py-1">
                     <span className="text-sm font-bold text-slate-500">{adj.reason}</span>
                     <span className="font-black text-emerald-600">+{fmt(adj.amount)}</span>
                   </div>
                ))}
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex justify-between items-center py-2 px-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-sm font-black text-emerald-700">Gross Payout</span>
                  <span className="text-lg font-black text-emerald-700">{fmt(totalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Deductions breakdown
              </h3>
              <div className="space-y-3 bg-white">
                {p.absentDeduction > 0 && (
                   <div className="flex justify-between items-center py-1">
                     <span className="text-sm font-bold text-slate-500">Unpaid Leaves ({p.absentDays}d)</span>
                     <span className="font-black text-red-600">-{fmt(p.absentDeduction)}</span>
                   </div>
                )}
                {p.halfDayDeduction > 0 && (
                   <div className="flex justify-between items-center py-1">
                     <span className="text-sm font-bold text-slate-500">Half-day Deductions ({p.halfDays}d)</span>
                     <span className="font-black text-red-600">-{fmt(p.halfDayDeduction)}</span>
                   </div>
                )}
                {manualDeductions.map((adj, i) => (
                   <div key={i} className="flex justify-between items-center py-1">
                     <span className="text-sm font-bold text-slate-500">{adj.reason}</span>
                     <span className="font-black text-red-600">-{fmt(adj.amount)}</span>
                   </div>
                ))}
                {totalDeductions === 0 && (
                   <p className="text-sm italic font-bold text-slate-300 py-4 text-center">No deductions applicable</p>
                )}
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex justify-between items-center py-2 px-4 bg-red-50 rounded-2xl border border-red-100">
                  <span className="text-sm font-black text-red-700">Total Deducted</span>
                  <span className="text-lg font-black text-red-700">{fmt(totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NET SALARY BLOCK */}
          <div className="bg-slate-900 rounded-[2rem] p-8 flex flex-col sm:flex-row justify-between items-center text-white gap-6 relative overflow-hidden group shadow-2xl shadow-slate-900/40">
             <div className="relative z-10 text-center sm:text-left">
                <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Final Net Salary Payable</p>
                <h4 className="text-5xl font-black tracking-tighter">{fmt(p.netSalary)}</h4>
             </div>
             <div className="relative z-10 flex flex-col items-center sm:items-end gap-2">
                <div className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${
                   p.status === 'Paid' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                }`}>
                   {p.status || 'DRAFT'}
                </div>
                {p.paymentDate && (
                   <p className="text-[10px] font-bold text-slate-500">Paid on {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                )}
             </div>
             {/* Animating glow effect */}
             <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
          </div>

          <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mt-8">
            This is an official system-generated document • Study Palace Hub HRMS
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-slate-50 flex gap-4">
          <button 
            onClick={onDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
          >
            <Download size={18} /> Download Slip (PDF)
          </button>
          <button 
            onClick={onClose}
            className="px-8 bg-white border border-slate-200 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Payroll() {
  const { user } = useContext(AuthContext);
  const isHRAdmin = ['Admin', 'HR'].includes(user?.role);

  const [payrolls, setPayrolls] = useState([]);
  const [mySlips, setMySlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [invoicePayroll, setInvoicePayroll] = useState(null);
  const [adjustmentModal, setAdjustmentModal] = useState({ show: false, payrollId: null, data: { amount: 0, reason: '', type: 'Addition' } });

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (isHRAdmin) {
        const res = await api.post('/payroll/generate', filter);
        setPayrolls(res.data.results || []);
      } else {
        const { data } = await api.get('/payroll/my-slips');
        setMySlips(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async () => {
    try {
      setGenerating(true);
      const { data } = await api.post('/payroll/generate', filter);
      setPayrolls(data.results || []);
    } catch (err) {
      alert('Generation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const addAdjustment = async () => {
    try {
      const res = await api.patch(`/payroll/${adjustmentModal.payrollId}/adjustment`, adjustmentModal.data);
      setAdjustmentModal({ show: false, payrollId: null, data: { amount: 0, reason: '', type: 'Addition' } });
      setPayrolls(prev => prev.map(p => p._id === res.data._id ? res.data : p));
    } catch (err) {
      alert('Adjustment failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePay = async (id) => {
    if (!window.confirm('Mark this payroll as Paid?')) return;
    try {
      const res = await api.patch(`/payroll/${id}/pay`);
      setPayrolls(prev => prev.map(p => p._id === id ? { ...p, status: 'Paid', paymentDate: res.data.paymentDate } : p));
    } catch (err) {
      alert('Payment failed');
    }
  };

  const handleShare = async (id) => {
    try {
      const { data } = await api.post(`/payroll/${id}/share`);
      alert(data.message);
    } catch (err) {
      alert('Sharing failed');
    }
  };

  const downloadPDF = (id) => {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    const url = `http://192.168.1.5:5000/api/payroll/${id}/pdf?token=${token}`;
    window.open(url, '_blank');
  };

  if (loading && payrolls.length === 0 && mySlips.length === 0) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Ledgers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Payroll Manager</h1>
          <p className="text-slate-500 font-medium mt-1">Manage salary disbursements, automated deductions, and bonuses</p>
        </div>
        {isHRAdmin && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
            <select
              className="bg-slate-50 border-none rounded-2xl py-2 px-4 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
              value={filter.month}
              onChange={(e) => setFilter({ ...filter, month: parseInt(e.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{monthName(i + 1)}</option>
              ))}
            </select>
            <select
              className="bg-slate-50 border-none rounded-2xl py-2 px-4 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
              value={filter.year}
              onChange={(e) => setFilter({ ...filter, year: parseInt(e.target.value) })}
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={generatePayroll}
              disabled={generating}
              className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95"
            >
              {generating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <DollarSign size={14} />}
              {generating ? 'Processing...' : 'Generate Payroll'}
            </button>
          </div>
        )}
      </div>

      {isHRAdmin ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-50">
                   <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-700">{monthName(filter.month)} {filter.year} Ledger</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{payrolls.length} active records</p>
                </div>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-50">
                  <th className="px-8 py-6">Employee</th>
                  <th className="px-8 py-6">Status Summary</th>
                  <th className="px-8 py-6">Base + Bonus</th>
                  <th className="px-8 py-6">Deductions</th>
                  <th className="px-8 py-6">Net Salary</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payrolls.map(p => {
                  const grossBase = p.grossBaseSalary || p.baseSalary || 0;
                  const totalEarn = grossBase + (p.totalAllowances || 0) + (p.monthlyBonus || 0) + (p.performanceBonus || 0);
                  const totalDed  = (p.absentDeduction || 0) + (p.halfDayDeduction || 0) + (p.adjustments || []).filter(a => a.type === 'Deduction').reduce((s, a) => s + a.amount, 0);
                  
                  return (
                    <tr key={p._id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-slate-900/10 group-hover:scale-110 transition-transform cursor-default">
                            {p.user?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm leading-tight">{p.user?.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{p.user?.employeeId || 'ID UNKNOWN'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        <div className="flex gap-2">
                           <div className="px-3 py-1 bg-emerald-50 rounded-xl text-[10px] font-black text-emerald-600 border border-emerald-100">{p.presentDays}P</div>
                           {p.absentDays > 0 && <div className="px-3 py-1 bg-red-50 rounded-xl text-[10px] font-black text-red-600 border border-red-100">{p.absentDays}A</div>}
                           {p.halfDays > 0 && <div className="px-3 py-1 bg-amber-50 rounded-xl text-[10px] font-black text-amber-600 border border-amber-100">{p.halfDays}H</div>}
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        <p className="font-black text-slate-800 text-sm">{fmt(totalEarn)}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 whitespace-nowrap">Base: {fmt(grossBase)}</p>
                      </td>

                      <td className="px-8 py-5">
                        <p className={`font-black text-sm ${totalDed > 0 ? 'text-red-500' : 'text-slate-300 italic'}`}>
                           {totalDed > 0 ? `-${fmt(totalDed)}` : 'No deducts'}
                        </p>
                      </td>

                      <td className="px-8 py-5">
                         <div className="flex flex-col">
                            <span className="text-lg font-black text-slate-900 tracking-tighter">{fmt(p.netSalary)}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${p.status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{p.status}</span>
                         </div>
                      </td>

                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => setInvoicePayroll(p)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                              <Eye size={18} />
                           </button>
                           {p.status === 'Draft' ? (
                              <>
                                 <button onClick={() => setAdjustmentModal({ show: true, payrollId: p._id, data: { amount: 0, reason: '', type: 'Addition' } })} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                                    <PlusCircle size={18} />
                                 </button>
                                 <button onClick={() => handlePay(p._id)} className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-900/10">
                                    <CreditCard size={14} /> Pay
                                 </button>
                              </>
                           ) : (
                              <button onClick={() => handleShare(p._id)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                                 <Send size={18} />
                              </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Employee View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {mySlips.map(slip => (
              <div key={slip._id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group">
                 <div className={`h-2 w-full ${slip.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                 <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20 group-hover:rotate-12 transition-transform duration-500">
                          <FileText size={28} />
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-2xl ${slip.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {slip.status}
                       </span>
                    </div>

                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">{monthName(slip.month)} {slip.year}</p>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-6">Salary Payout</h4>

                    <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-50">
                       <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400 uppercase tracking-widest">Base Salary</span>
                          <span className="text-slate-800">{fmt(slip.grossBaseSalary || slip.baseSalary)}</span>
                       </div>
                       <div className="flex justify-between text-xs font-bold">
                          <span className="text-red-400 uppercase tracking-widest">Deductions</span>
                          <span className="text-red-500 font-black">-{fmt((slip.absentDeduction || 0) + (slip.halfDayDeduction || 0))}</span>
                       </div>
                       <div className="h-px bg-slate-200/50" />
                       <div className="flex justify-between items-center pt-2">
                          <span className="font-black text-slate-500 text-xs uppercase tracking-[0.2em]">Net Paid</span>
                          <span className="text-3xl font-black text-slate-900 tracking-tighter">{fmt(slip.netSalary)}</span>
                       </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                       <button onClick={() => setInvoicePayroll(slip)} className="flex-1 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl text-sm font-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                          View Slip
                       </button>
                       <button onClick={() => handleShare(slip._id)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95">
                          <Send size={20} />
                       </button>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* Invoice Modal */}
      {invoicePayroll && (
        <InvoiceModal
          payroll={invoicePayroll}
          onClose={() => setInvoicePayroll(null)}
          onDownload={() => downloadPDF(invoicePayroll._id)}
        />
      )}

      {/* Adjustment Modal */}
      {adjustmentModal.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">Add adjustment</h2>
              <button onClick={() => setAdjustmentModal({ ...adjustmentModal, show: false })} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Addition', 'Deduction'].map(t => (
                    <button key={t}
                      onClick={() => setAdjustmentModal({ ...adjustmentModal, data: { ...adjustmentModal.data, type: t } })}
                      className={`py-3 px-4 rounded-2xl text-xs font-black transition-all border ${
                        adjustmentModal.data.type === t
                          ? t === 'Addition' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Amount (₹)</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                   <input type="number" min="0" className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-10 pr-4 text-sm font-black focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                    value={adjustmentModal.data.amount}
                    onChange={(e) => setAdjustmentModal({ ...adjustmentModal, data: { ...adjustmentModal.data, amount: parseFloat(e.target.value) || 0 } })}
                   />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Reason for {adjustmentModal.data.type}</label>
                <input type="text" placeholder="e.g. Festival Advance, Performance Bonus" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                  value={adjustmentModal.data.reason}
                  onChange={(e) => setAdjustmentModal({ ...adjustmentModal, data: { ...adjustmentModal.data, reason: e.target.value } })}
                />
              </div>
              <button onClick={addAdjustment} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98]">
                Update Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
