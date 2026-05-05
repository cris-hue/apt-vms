import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { 
  UserCheck, Users, AlertCircle, RefreshCw, 
  LogOut, User, ShieldCheck 
} from 'lucide-react';

// Pass the 'user' prop from App.jsx to show your profile info
const AdminDashboard = ({ user }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 1. Fetch Pending Requests
  const fetchPending = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/auth/pending');
      setPendingUsers(data.data); 
      setLoading(false);
    } catch (err) {
      setError('Failed to load pending requests');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // 2. Approve User Function
  const handleApprove = async (id) => {
    try {
      await API.put(`/auth/approve/${id}`);
      setPendingUsers(pendingUsers.filter(user => user._id !== id));
    } catch (err) {
      alert("Error approving user");
    }
  };

  // 3. Logout Function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- PROFESSIONAL HEADER --- */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-blue-600">
          <ShieldCheck size={28} />
          <h1 className="text-xl font-black tracking-tighter uppercase italic">
            SecureNest <span className="text-slate-400 font-medium lowercase">admin</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {/* Profile Display */}
          <div className="flex items-center gap-3 border-r pr-6 border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-none">
                {user?.name || "System Admin"}
              </p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                Root Controller
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black">
              {user?.name?.charAt(0).toUpperCase() || <User size={20} />}
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold transition-colors text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 mt-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Access Control</h1>
            <p className="text-slate-500">Welcome back, {user?.name || 'Cris'}. Manage SecureNest access requests.</p>
          </div>
          <button 
            onClick={fetchPending}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all text-slate-600"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>

        {/* Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-blue-200 transition-colors">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">{pendingUsers.length}</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">Pending Approvals</p>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Name & Role</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Unit</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-300">
                        <AlertCircle size={48} />
                        <p className="font-bold text-slate-400">All requests are settled</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map((req) => (
                    <tr key={req._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{req.name}</p>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase font-black">
                          {req.role}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        <p className="font-medium">{req.email}</p>
                        <p className="text-xs text-slate-400">{req.phone}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-mono text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black">
                          {req.unitNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => handleApprove(req._id)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-xl shadow-sm hover:shadow-green-200 transition-all uppercase"
                        >
                          <UserCheck size={14} /> Approve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;