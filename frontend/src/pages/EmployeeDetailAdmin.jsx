import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import {
   ArrowLeft,
   Trash2,
   Mail,
   Phone,
   TrendingUp,
   TrendingDown,
   Activity,
   Calendar as CalIcon,
   ShieldCheck,
   MapPin,
   CreditCard,
   CheckCircle2,
   XCircle,
   Building2,
   Download
} from 'lucide-react';

export default function EmployeeDetailAdmin() {
   const { id } = useParams();
   const { user: currentUser } = useContext(AuthContext);
   const navigate = useNavigate();
   const [employee, setEmployee] = useState(null);
   const [history, setHistory] = useState([]);
   const [date, setDate] = useState(new Date());

   // Edit State
   const [editMode, setEditMode] = useState(false);
   const [editRole, setEditRole] = useState('');
   const [editDept, setEditDept] = useState('');
   const [editDesignation, setEditDesignation] = useState('');
   const [editSalary, setEditSalary] = useState(0);

   // Form State
   const [points, setPoints] = useState('');
   const [reason, setReason] = useState('');
   const [loading, setLoading] = useState(false);
   const [actionLoading, setActionLoading] = useState(false);

   const targetId = id || currentUser?._id;

   const fetchData = async () => {
      try {
         const res = await api.get(`/employees/${targetId}`);
         setEmployee(res.data.employee);
         setEditRole(res.data.employee.role);
         setEditDept(res.data.employee.department || '');
         setEditDesignation(res.data.employee.designation || '');
         setEditSalary(res.data.employee.salaryStructure?.baseSalary || 0);

         const kpiRes = await api.get(`/kpi/history/${targetId}`);
         setHistory(kpiRes.data || []);
      } catch (error) {
         console.error(error);
      }
   };

   useEffect(() => {
      if (targetId) fetchData()
   }, [targetId]);

   const submitKpi = async (pointValue) => {
      if (!pointValue || !reason) return alert('Points and reason required');
      setLoading(true);
      try {
         await api.post('/kpi/manage', {
            employeeId: id,
            date: date.toISOString(),
            points: Number(pointValue),
            reason
         });
         setPoints(''); setReason('');
         fetchData();
      } catch (error) {
         alert(error.response?.data?.message || 'Error updating KPI');
      } finally {
         setLoading(false);
      }
   };

   const handleKycReview = async (status) => {
      setActionLoading(true);
      try {
         await api.patch(`/employees/${targetId}/kyc-review`, { status });
         alert(`Employee KYC ${status} successfully!`);
         if (status === 'Approved') navigate('/admin/employees');
         else fetchData();
      } catch (error) {
         alert(error.response?.data?.message || 'Error reviewing KYC');
      } finally {
         setActionLoading(false);
      }
   };

   const handleUpdateProfile = async () => {
      setActionLoading(true);
      try {
         await api.patch(`/employees/${targetId}`, {
            role: editRole,
            department: editDept,
            designation: editDesignation,
            salaryStructure: {
               ...employee.salaryStructure,
               baseSalary: Number(editSalary)
            }
         });
         alert('Profile updated successfully!');
         setEditMode(false);
         fetchData();
      } catch (error) {
         alert(error.response?.data?.message || 'Error updating profile');
      } finally {
         setActionLoading(false);
      }
   };

   if (!employee) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
         <div className="flex flex-col items-center gap-4">
            <Activity className="text-blue-500 animate-pulse" size={40} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Personnel File...</p>
         </div>
      </div>
   );

   const baseUrl = api.defaults.baseURL.replace(/\/api$/, '');

   return (
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
         {/* Top Navigation Bar */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <button
                  onClick={() => navigate('/admin/employees')}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
               >
                  <ArrowLeft size={20} />
               </button>
               <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">{employee.name} {employee.employeeId ? <span className="text-slate-300 font-light ml-2">({employee.employeeId})</span> : ''}</h1>
                  <div className="flex items-center gap-3 mt-1">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{id ? 'Employee File' : 'My Personal Profile'} • {employee.employeeId || 'ID PENDING'}</span>
                     <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${employee.kycStatus === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                        employee.kycStatus === 'Pending' ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-red-50 text-red-600'
                        }`}>
                        {employee.kycStatus}
                     </span>
                  </div>
               </div>
            </div>

            <div className="flex gap-3">
               {employee.kycStatus === 'Pending' && (
                  <div className="flex gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                     <button
                        disabled={actionLoading}
                        onClick={() => handleKycReview('Approved')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition"
                     >
                        <CheckCircle2 size={16} /> Approve Access
                     </button>
                     <button
                        disabled={actionLoading}
                        onClick={() => handleKycReview('Rejected')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-100 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition"
                     >
                        <XCircle size={16} /> Reject
                     </button>
                  </div>
               )}

               {['Admin', 'HR'].includes(currentUser?.role) && (
                  <>
                     {!editMode ? (
                        <button
                           onClick={() => setEditMode(true)}
                           className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition shadow-sm"
                        >
                           Edit Profile
                        </button>
                     ) : (
                        <div className="flex gap-3">
                           <button
                              onClick={() => setEditMode(false)}
                              className="px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
                           >
                              Cancel
                           </button>
                           <button
                              onClick={handleUpdateProfile}
                              disabled={actionLoading}
                              className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-100"
                           >
                              {actionLoading ? 'Saving...' : 'Save Changes'}
                           </button>
                        </div>
                     )}
                     <button className="flex items-center gap-2 px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-600 hover:text-white transition shadow-sm border border-red-100">
                        <Trash2 size={18} />
                     </button>
                  </>
               )}
            </div>
         </div>

         {/* Hero Profile & Stats Section */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200/60 flex flex-col md:flex-row items-center gap-10">
               <div className="relative group">
                  {employee.employeePhoto || employee.profilePic ? (
                     <img
                        src={`${baseUrl}${employee.employeePhoto || employee.profilePic}`}
                        alt={employee.name}
                        className="w-40 h-40 rounded-[2.5rem] object-cover border-4 border-slate-50 shadow-xl"
                     />
                  ) : (
                     <div className="w-40 h-40 rounded-[2.5rem] bg-slate-100 flex items-center justify-center text-5xl font-black text-slate-300">
                        {employee.name.charAt(0)}
                     </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-lg border-4 border-white">
                     <ShieldCheck size={20} />
                  </div>
               </div>

               <div className="flex-1 space-y-6 text-center md:text-left">
                  <div className="space-y-4">
                     {editMode ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Designation</label>
                              <input
                                 value={editDesignation}
                                 onChange={(e) => setEditDesignation(e.target.value)}
                                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-blue-500"
                              />
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Department</label>
                              <input
                                 value={editDept}
                                 onChange={(e) => setEditDept(e.target.value)}
                                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-blue-500"
                              />
                           </div>
                           {currentUser?.role === 'Admin' || (currentUser?.role === 'HR' && employee.role !== 'Admin') ? (
                              <div className="md:col-span-2">
                                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">System Role</label>
                                 <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-blue-500"
                                 >
                                    <option value="Employee">Employee</option>
                                    <option value="Manager">Manager</option>
                                    <option value="HR">HR</option>
                                    <option value="Admin">Admin</option>
                                    <option value="AGM">AGM</option>
                                 </select>
                              </div>
                           ) : null}
                           {['Admin', 'HR'].includes(currentUser?.role) && (
                              <div className="md:col-span-2">
                                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Monthly Base Salary (₹)</label>
                                 <input
                                    type="number"
                                    value={editSalary}
                                    onChange={(e) => setEditSalary(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-blue-500"
                                 />
                              </div>
                           )}
                        </div>
                     ) : (
                        <>
                           <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-bold text-slate-900">{employee.name}</h2>
                              <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded tracking-tighter uppercase">
                                 {employee.role}
                              </span>
                           </div>
                           <p className="text-slate-400 font-medium text-sm mt-1">
                              {employee.designation || 'Position Not Set'} • {employee.department || 'Department Not Set'}
                           </p>
                        </>
                     )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                        <div className="p-2.5 bg-white rounded-xl text-blue-500 shadow-sm"><Mail size={16} /></div>
                        <span className="text-xs font-bold text-slate-600 truncate">{employee.email}</span>
                     </div>
                     <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                        <div className="p-2.5 bg-white rounded-xl text-emerald-500 shadow-sm"><Phone size={16} /></div>
                        <span className="text-xs font-bold text-slate-600 truncate">{employee.phoneNumber || 'No Phone Registered'}</span>
                     </div>
                     <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2 group hover:border-blue-200 transition-colors">
                        <div className="p-2.5 bg-white rounded-xl text-slate-400 shadow-sm"><MapPin size={16} /></div>
                        <span className="text-xs font-bold text-slate-500 italic">{employee.address || 'Address information pending KYC'}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
               <div className="relative z-10 space-y-8">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-500">
                     <span>Performance Index</span>
                     <Activity size={18} className="text-blue-500" />
                  </div>

                  <div className="space-y-1">
                     <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black">{employee.totalKpi || 0}</span>
                        <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">Points</span>
                     </div>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Net Lifetime Standing</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                     <div className="space-y-1">
                        <p className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase"><TrendingUp size={14} /> Rewards</p>
                        <p className="text-xl font-bold">+{employee.totalAdded || 0}</p>
                     </div>
                     <div className="space-y-1 font-bold">
                        <p className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase"><TrendingDown size={14} /> Deductions</p>
                        <p className="text-xl font-bold">{employee.totalDeducted || 0}</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Documents & Finance Section */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 p-10 space-y-8">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><CreditCard size={20} /></div>
                  KYC Verification Vault
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DocPreview label="PAN Card" src={employee.panCardImage} baseUrl={baseUrl} />
                  <DocPreview label="Aadhaar Front" src={employee.aadhaarFrontImage} baseUrl={baseUrl} />
                  <DocPreview label="Aadhaar Back" src={employee.aadhaarBackImage} baseUrl={baseUrl} />
               </div>

               {(!employee.panCardImage && !employee.aadhaarFrontImage) && (
                  <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                     <ShieldCheck size={32} className="mx-auto text-slate-300 mb-2" />
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Documents Uploaded Yet</p>
                  </div>
               )}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 p-10 space-y-8">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Building2 size={20} /></div>
                  Financial Registry
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DataBox label="Account Holder" value={employee.bankDetails?.accountHolder || 'Not Set'} />
                  <DataBox label="Account Number" value={employee.bankDetails?.accountNumber || 'Not Set'} />
                  <DataBox label="IFSC Code" value={employee.bankDetails?.ifsc || 'Not Set'} />
                  <DataBox label="Bank & Branch" value={employee.bankDetails?.bankName || 'Not Set'} />
               </div>

               <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payroll Baseline</p>
                     <p className="text-xl font-black text-slate-900 mt-1">₹{employee.salaryStructure?.baseSalary || 0} <span className="text-slate-400 text-xs font-bold">/ Month</span></p>
                  </div>
                  <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-blue-600 transition shadow-sm border border-slate-100">
                     <Download size={20} />
                  </button>
               </div>
            </div>
         </div>

         {/* KPI Management & History (Bottom Section) */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
               <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60">
                  <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                     <CalIcon size={18} className="text-blue-600" /> KPI Calendar
                  </h4>
                  <Calendar
                     onChange={setDate}
                     value={date}
                     className="w-full border-0 !font-bold text-sm !bg-transparent rounded-2xl"
                  />
               </div>

               {['Admin', 'HR', 'AGM'].includes(currentUser?.role) && (
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60 space-y-6">
                     <h4 className="font-black text-slate-800">Assign/Deduct Points</h4>
                     <div className="space-y-4">
                        <input
                           type="number"
                           placeholder="Points Value"
                           value={points}
                           onChange={e => setPoints(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold outline-none focus:ring-2 ring-blue-500 transition-all"
                        />
                        <select
                           value={reason}
                           onChange={e => setReason(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold outline-none focus:ring-2 ring-blue-500 transition-all"
                        >
                           <option value="" disabled>Select Reason Category</option>
                           <option value="Communication/Behaviour">Communication/Behaviour</option>
                           <option value="Work Quality">Work Quality</option>
                           <option value="Attendance/Punctuality">Attendance/Punctuality</option>
                           <option value="Task Completion">Task Completion</option>
                           <option value="Professional Development">Professional Development</option>
                        </select>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                           <button
                              onClick={() => submitKpi(Number(points))}
                              disabled={loading}
                              className="py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition shadow-xl shadow-emerald-100"
                           >
                              Add Points
                           </button>
                           <button
                              onClick={() => submitKpi(-Number(points))}
                              disabled={loading}
                              className="py-4 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition shadow-xl shadow-red-100"
                           >
                              Deduct
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200/60">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-900">Performance Timeline</h3>
                  <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-400 tracking-widest">{history.length} Entries Record</div>
               </div>

               {history.length > 0 ? (
                  <div className="space-y-4">
                     {history.map((record, idx) => {
                        const isPositive = record.points > 0;
                        const recordDate = new Date(record.date || record.createdAt);

                        return (
                           <div key={idx} className="flex items-center gap-6 p-5 bg-slate-50 rounded-[1.5rem] border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                              <div className="text-center min-w-[60px]">
                                 <p className="text-xs font-black text-slate-800">{recordDate.toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{recordDate.getFullYear()}</p>
                              </div>
                              <div className="h-10 w-px bg-slate-200" />
                              <div className="flex-1">
                                 <p className="text-sm font-bold text-slate-700">{record.reason}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Assigned by Management</p>
                              </div>
                              <div className={`text-xl font-black ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                 {isPositive ? '+' : ''}{record.points}
                              </div>
                           </div>
                        )
                     })}
                  </div>
               ) : (
                  <div className="text-center py-32 space-y-4">
                     <Activity size={48} className="mx-auto text-slate-200 opacity-50" />
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No KPI data logged</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

function DocPreview({ label, src, baseUrl }) {
   if (!src) return (
      <div className="aspect-[4/3] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4">
         <ShieldCheck size={20} className="text-slate-300 mb-1" />
         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{label} Missing</span>
      </div>
   );

   return (
      <div className="space-y-3">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</p>
         <div className="group relative aspect-[4/3] rounded-3xl overflow-hidden shadow-sm border border-slate-100 bg-slate-50">
            <img
               src={`${baseUrl}${src}`}
               alt={label}
               className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-zoom-in"
            />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <a href={`${baseUrl}${src}`} target="_blank" rel="noreferrer" className="bg-white text-slate-900 p-3 rounded-2xl shadow-xl">
                  <Download size={18} />
               </a>
            </div>
         </div>
      </div>
   );
}

function DataBox({ label, value }) {
   return (
      <div className="space-y-1.5">
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
         <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">{value}</p>
      </div>
   );
}