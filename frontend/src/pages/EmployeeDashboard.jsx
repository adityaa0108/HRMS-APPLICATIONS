import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { Clock, Calendar as CalendarIcon, CheckCircle, Award, Cake, ListTodo, FileText, LogOut } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [personalStats, setPersonalStats] = useState({ presentDays: 0, totalHours: 0 });
  const [tasks, setTasks] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

   const fetchDashboardData = async () => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();

      // Parallel fetch for common data
      const [attRes, taskRes, todayRes] = await Promise.all([
        api.get(`/attendance/monthly/${year}/${month}`).catch(() => ({ data: [] })),
        api.get('/tasks').catch(() => ({ data: [] })),
        api.get('/attendance/today').catch(() => ({ data: [] }))
      ]);

      setTasks(taskRes.data);
      
      // Update attendance state ONLY if the request succeeded
      if (todayRes && todayRes.data && todayRes.data.length > 0) {
        setTodayAttendance(todayRes.data[0]);
      } else if (todayRes && todayRes.data) {
        setTodayAttendance(null); // Explicitly no record found
      }
      // If todayRes was an error (caught by .catch), we keep previous state or do nothing

      const monthlyAtt = attRes.data;
      const hours = monthlyAtt.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
      setPersonalStats({
         presentDays: monthlyAtt.length,
         totalHours: parseFloat(hours.toFixed(1))
      });

      // Conditional fetch for admin-only stats
      if (['Admin', 'HR'].includes(user.role)) {
         try {
            const statsRes = await api.get('/employees/stats');
            setUpcomingBirthdays(statsRes.data.upcomingBirthdays || []);
         } catch (e) {
            console.error("Stats fetch failed:", e);
         }
      }
    } catch (err) {
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/check-in');
      alert('Checked in successfully!');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/check-out');
      alert('Checked out successfully!');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
       {/* Top Premium Navbar */}
       <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
                <Clock size={24} />
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-900 leading-none">Employee Portal</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Study Palace Hub HRMS</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{user?.role} • {user?.employeeId}</p>
             </div>
             <button onClick={logout} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <LogOut size={20} />
             </button>
          </div>
       </div>

       <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* Welcome & Quick Action */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-white to-slate-50">
             <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-800">Hello, {user?.name.split(' ')[0]}! 👋</h2>
                <p className="text-slate-500 max-w-md">You've worked <span className="text-blue-600 font-bold">{personalStats.totalHours} hours</span> this month. Keep up the great work!</p>
             </div>
             <div className="flex gap-4">
                {!todayAttendance?.checkIn ? (
                   <button 
                     onClick={handleCheckIn}
                     className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-100"
                   >
                     Check In Now
                   </button>
                ) : !todayAttendance?.checkOut ? (
                   <button 
                     onClick={handleCheckOut}
                     className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-xl shadow-slate-200"
                   >
                     Check Out
                   </button>
                ) : (
                   <div className="px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold border border-emerald-100 flex items-center gap-2">
                      <CheckCircle size={20} /> Today's Shift Complete
                   </div>
                )}

                {todayAttendance?.checkIn && (
                   <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${todayAttendance?.checkIn ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Since</span>
                         <span className="text-xs font-bold text-slate-700">
                            {new Date(todayAttendance.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </span>
                      </div>
                   </div>
                )}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Stats Column */}
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-4"><CheckCircle size={20} /></div>
                      <p className="text-2xl font-bold text-slate-800">{personalStats.presentDays}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Present</p>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit mb-4"><Award size={20} /></div>
                      <p className="text-2xl font-bold text-slate-800">{user?.totalKpi || 0}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KPI Points</p>
                   </div>
                </div>

                {/* Calendar Preview Mini Widget */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <CalendarIcon size={18} className="text-blue-600" />
                      Attendance History
                   </h3>
                   <div className="space-y-4">
                      {/* Placeholder for a mini-list or graphic */}
                      <p className="text-xs text-slate-500 leading-relaxed">View your full attendance calendar and export reports in the attendance module.</p>
                      <button 
                        onClick={() => navigate('/admin/attendance')}
                        className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                         Open Calendar
                      </button>
                   </div>
                </div>

                {/* Celebrations */}
                <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
                   <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Cake size={18} className="text-amber-400" />
                      Company Birthdays
                   </h3>
                   <div className="space-y-4">
                      {upcomingBirthdays.slice(0, 2).map(b => (
                        <div key={b.name} className="flex justify-between items-center bg-white/10 p-3 rounded-2xl">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">{b.name.charAt(0)}</div>
                              <span className="text-xs font-medium">{b.name}</span>
                           </div>
                           <span className="text-[10px] font-bold text-indigo-200">{new Date(b.birthDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Tasks Column */}
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                   <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                         <ListTodo size={20} className="text-blue-600" />
                         My Tasks
                      </h3>
                      <button onClick={() => navigate('/admin/tasks')} className="text-xs font-bold text-blue-600">View All</button>
                   </div>
                   <div className="p-4 space-y-3">
                      {tasks.filter(t => t.status !== 'Completed').slice(0, 5).map(task => (
                        <div key={task._id} className="p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all group">
                           <div className="flex justify-between items-start">
                              <div>
                                 <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{task.title}</h4>
                                 <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <Clock size={12} /> Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                                 </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                 task.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                              }`}>{task.priority}</span>
                           </div>
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <div className="py-20 text-center text-slate-300">
                           <ListTodo size={48} className="mx-auto mb-4 opacity-20" />
                           <p>No active tasks assigned to you</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Salary Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => navigate('/admin/payroll')}>
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><FileText size={20} /></div>
                         <div>
                            <p className="font-bold text-slate-800">Salary Slips</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Download Monthly</p>
                         </div>
                      </div>
                      <div className="text-slate-300 group-hover:text-slate-600 transition-all">→</div>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => navigate('/')}>
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all"><Award size={20} /></div>
                         <div>
                            <p className="font-bold text-slate-800">Leaderboard</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">View Rankings</p>
                         </div>
                      </div>
                      <div className="text-slate-300 group-hover:text-slate-600 transition-all">→</div>
                   </div>
                </div>
             </div>
          </div>
       </div>

       {/* Footer */}
       <footer className="py-12 text-center border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Powered by Study Palace Hub Advanced HRMS 2.0</p>
       </footer>
    </div>
  )
}
