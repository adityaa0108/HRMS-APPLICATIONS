import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function Attendance() {
  const { user } = useContext(AuthContext);
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Location States
  const [officeSettings, setOfficeSettings] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isWithinRadius, setIsWithinRadius] = useState(null);
  const [verifyingLocation, setVerifyingLocation] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyRes, todayRes, settingsRes] = await Promise.all([
        api.get('/attendance/my-history'),
        api.get('/attendance/today'),
        api.get('/settings').catch(() => null)
      ]);
      if (historyRes && historyRes.data) setHistory(historyRes.data);
      if (todayRes && todayRes.data && todayRes.data.length > 0) {
        setTodayRecord(todayRes.data[0]);
      } else if (todayRes && todayRes.data) {
        setTodayRecord(null);
      }

      if (settingsRes && settingsRes.data && settingsRes.data.officeLocation) {
        setOfficeSettings(settingsRes.data.officeLocation);
      }

      if (['Admin', 'HR'].includes(user.role)) {
        const allRes = await api.get(`/attendance/all?date=${new Date().toISOString().split('T')[0]}`);
        setAllAttendance(allRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const { data } = await api.post('/attendance/check-in');
      setTodayRecord(data);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; 
  };

  const verifyLocationAndCheckIn = () => {
    if (!officeSettings || !officeSettings.radius) {
      // Location check disabled
      handleCheckIn();
      return;
    }

    setLocationError('');
    setVerifyingLocation(true);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setVerifyingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(
          latitude, longitude, 
          officeSettings.latitude, officeSettings.longitude
        );

        if (distance <= officeSettings.radius) {
          setIsWithinRadius(true);
          handleCheckIn();
        } else {
          setIsWithinRadius(false);
          setLocationError(`You are ${Math.round(distance)}m away from the office. Check-in not allowed.`);
        }
        setVerifyingLocation(false);
      },
      (error) => {
        setLocationError('Unable to retrieve your location. Please ensure location permissions are enabled.');
        setVerifyingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckOut = async () => {
    try {
      const { data } = await api.post('/attendance/check-out');
      setTodayRecord(data);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  if (loading) return <div className="p-8">Loading attendance data...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Attendance Management</h1>
        <div className="text-slate-500 flex items-center gap-2">
          <CalendarIcon size={20} />
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Check In/Out Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-full bg-blue-50 text-blue-600">
            <Clock size={32} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Daily Attendance</h2>
            <p className="text-slate-500">Record your working hours for today</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {!todayRecord || !todayRecord.checkIn ? (
            <div className="flex flex-col items-end gap-2">
               <button 
                 onClick={verifyLocationAndCheckIn}
                 disabled={verifyingLocation}
                 className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px] flex justify-center items-center"
               >
                 {verifyingLocation ? <span className="animate-pulse">Locating...</span> : 'Check In'}
               </button>
               {locationError && (
                 <p className="text-xs font-bold text-red-500 max-w-sm text-right flex items-start gap-1">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    {locationError}
                 </p>
               )}
            </div>
          ) : !todayRecord.checkOut ? (
            <button 
              onClick={handleCheckOut}
              className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200"
            >
              Check Out
            </button>
          ) : (
            <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-6 py-3 rounded-xl border border-green-100">
              <CheckCircle size={20} />
              Completed for Today
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Simple Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold mb-4 uppercase text-xs text-slate-400 tracking-wider">Log Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Check In</span>
                <span className="font-mono font-bold">{todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString() : '--:--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Check Out</span>
                <span className="font-mono font-bold">{todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString() : '--:--'}</span>
              </div>
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  todayRecord?.status === 'Late' ? 'bg-amber-100 text-amber-600' : 
                  todayRecord?.status === 'Present' ? 'bg-green-100 text-green-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {todayRecord?.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold">Recent History</h3>
            <button className="text-blue-600 text-sm font-semibold">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">In / Out</th>
                  <th className="px-6 py-4">Hours</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.slice(0, 5).map(record => (
                  <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{record.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{record.totalHours}h</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        record.status === 'Late' ? 'bg-amber-100 text-amber-600' : 
                        record.status === 'Present' ? 'bg-green-100 text-green-600' :
                        record.status === 'Half-day' ? 'bg-red-100 text-red-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {['Admin', 'HR'].includes(user.role) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-50">
            <h3 className="font-bold">Today's Team Attendance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Check In</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allAttendance.map(record => (
                  <tr key={record._id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                        <div>
                          <p className="font-bold text-sm">{record.user?.name}</p>
                          <p className="text-xs text-slate-400">{record.user?.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(record.checkIn).toLocaleTimeString()}</td>
                    <td className="px-6 py-4">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        record.status === 'Late' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                       }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {allAttendance.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-slate-400">No records found for today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
