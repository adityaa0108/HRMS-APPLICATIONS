import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  LogOut, 
  Clock, 
  ListTodo, 
  FileText, 
  Award, 
  Calendar,
  Cake,
  Settings,
  ShieldCheck
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [birthdays, setBirthdays] = useState([]);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      const { data } = await api.get('/employees/stats');
      setBirthdays(data.upcomingBirthdays || []);
    } catch (err) {
      console.error('Failed to fetch birthdays for sidebar');
    }
  };

  const menuGroups = [
    {
      label: 'Personal Space',
      items: [
        { name: 'Dashboard', path: user?.role === 'Employee' ? '/employee' : '/admin', icon: <LayoutDashboard size={18} />, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { name: 'My Profile', path: '/admin/profile', icon: <Users size={18} />, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { name: 'Attendance History', path: '/admin/attendance', icon: <Clock size={18} />, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { name: 'My Tasks', path: '/admin/tasks', icon: <ListTodo size={18} />, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { name: 'Salary Slips', path: '/admin/payroll', icon: <FileText size={18} />, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
        { name: 'KPI Leaderboard', path: '/admin/leaderboard', icon: <Award size={18} />, roles: ['Admin', 'HR', 'Manager', 'Employee', 'AGM'] },
      ]
    },

    {
      label: 'Management',
      roles: ['Admin', 'HR', 'Manager'],
      items: [
        { name: 'Task Management', path: '/admin/tasks', icon: <ListTodo size={18} />, roles: ['Admin', 'HR', 'Manager'] },
        { name: 'Employee Directory', path: '/admin/employees', icon: <Users size={18} />, roles: ['Admin', 'HR'] },
        { name: 'Team Attendance', path: '/admin/manage-attendance', icon: <Clock size={18} />, roles: ['Admin', 'HR', 'AGM'] },
        { name: 'Payroll Records', path: '/admin/payroll', icon: <FileText size={18} />, roles: ['Admin', 'HR'] },
        { name: 'Holiday Calendar', path: '/admin/holidays', icon: <Calendar size={18} />, roles: ['Admin', 'HR'] },
        { name: 'Onboard Staff', path: '/admin/add-employee', icon: <UserPlus size={18} />, roles: ['Admin', 'HR'] },
      ]
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-[280px] bg-slate-900 text-slate-400 p-6 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-2xl z-40">
        
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer" onClick={() => navigate('/admin')}>
          <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
             <ShieldCheck size={22} />
          </div>
          <div>
             <h2 className="text-white font-black text-lg leading-none tracking-tight">Study Palace</h2>
             <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1">Advanced HRMS</p>
          </div>
        </div>
        
        {/* User Profile Summary */}
        <div className="bg-slate-800/40 rounded-[1.5rem] p-4 mb-8 border border-white/5 backdrop-blur-sm">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                 {user?.name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                 <p className="text-white font-bold text-sm truncate">{user?.name}</p>
                 <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400/80">{user?.role}</p>
                    {user?.employeeId && (
                       <>
                          <span className="text-slate-600 text-[8px]">•</span>
                          <span className="text-[9px] font-bold text-slate-500 tracking-tighter">{user.employeeId}</span>
                       </>
                    )}
                 </div>
              </div>

           </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-8 overflow-y-auto no-scrollbar pr-1">
          {menuGroups.map((group, idx) => {
            const hasAccess = !group.roles || group.roles.includes(user?.role);
            if (!hasAccess) return null;

            return (
              <div key={idx} className="space-y-3">
                <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item, i) => {
                    if (!item.roles.includes(user?.role)) return null;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <button
                        key={i}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'hover:bg-white/5 hover:text-slate-200'
                        }`}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Birthday Mini-Widget */}
          <div className="pt-4">
             <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                      <Cake size={14} /> Celebrations
                   </p>
                   {birthdays.length > 0 && <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />}
                </div>
                <div className="space-y-3">
                   {birthdays.length > 0 ? birthdays.slice(0, 2).map((b, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                         <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-300">
                            {b.name.charAt(0)}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-slate-300 truncate">{b.name}</p>
                            <p className="text-[9px] text-indigo-400/80 font-bold uppercase">{new Date(b.birthDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}</p>
                         </div>
                      </div>
                   )) : (
                     <p className="text-[10px] text-slate-500 font-medium italic">No upcoming birthdays</p>
                   )}
                </div>
             </div>
          </div>
        </nav>
        
        {/* Footer Actions */}
        <div className="pt-6 mt-6 border-t border-slate-800 space-y-1">
           <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-white/5 transition-all text-sm font-bold">
              <Settings size={18} /> Settings
           </button>
           <button onClick={logout} className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-bold">
              <LogOut size={18} /> Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content Areas */}
      <main className="flex-1 max-h-screen overflow-y-auto no-scrollbar flex flex-col pt-4 px-4 pb-4">
         <div className="bg-white rounded-[2.5rem] flex-1 p-8 shadow-sm border border-slate-200/50 overflow-x-hidden">
            <Outlet />
         </div>
      </main>
    </div>
  )
}

