import { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { 
  Users, AlertCircle, RefreshCw, LogOut, ShieldCheck, 
  ClipboardList, UserPlus, Building2, ChevronRight, X, Info, Mail, Trash2, Clock, CheckCircle2
} from 'lucide-react';

const AdminDashboard = () => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('pending'); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ pending: 0, tenants: 0, guards: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [selectedLog, setSelectedLog] = useState(null); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [logFilter, setLogFilter] = useState('all');
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const [approvedRes, pendingRes] = await Promise.all([
        API.get('/auth/approved'),
        API.get('/auth/pending')
      ]);
      const approved = approvedRes.data.data || [];
      setStats({
        pending: (pendingRes.data.data || []).length,
        tenants: approved.filter(u => u.role === 'tenant').length,
        guards: approved.filter(u => u.role === 'guard').length
      });
    } catch (err) { console.error("Stats Error:", err); }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '';
      if (activeTab === 'pending') endpoint = '/auth/pending';
      else if (activeTab === 'tenants' || activeTab === 'guards') endpoint = '/auth/approved';
      else if (activeTab === 'logs') endpoint = '/visitors/all';

      const res = await API.get(endpoint);
      const result = res.data?.data || [];

      if (activeTab === 'tenants') {
        setData(result.filter(u => u.role === 'tenant'));
      } else if (activeTab === 'guards') {
        setData(result.filter(u => u.role === 'guard'));
      } else {
        setData(result);
      }
      
      fetchStats();
    } catch (err) { 
      console.error("Fetch Error:", err);
      setError(err.response?.data?.message || "Server did not respond correctly.");
    } finally { 
      setLoading(false); 
    }
  }, [activeTab]);

  useEffect(() => { 
    if (currentUser) fetchData(); 
  }, [fetchData, currentUser]);

  const handleApprove = async (id) => {
    try {
      const res = await API.put(`/auth/approve/${id}`);
      if (res.data.success) {
        alert("Access Authorized");
        fetchData();
      }
    } catch (err) { alert("Approval failed"); }
  };

  const handleRevoke = async (id, name) => {
    if (!window.confirm(`Revoke all access for ${name}?`)) return;
    try {
      await API.delete(`/auth/delete/${id}`);
      setSelectedUser(null);
      fetchData();
    } catch (err) { alert("Revoke failed"); }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC] font-sans text-slate-900 text-left">
      
      <aside className={`w-full md:w-80 bg-slate-900 text-slate-300 flex flex-col ${sidebarOpen ? 'fixed inset-0 z-100 md:sticky md:inset-auto md:z-0' : 'hidden md:flex'} md:top-0 md:h-screen shadow-2xl transition-all`}>
        <div className="p-8 flex items-center justify-between gap-3 text-white border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg"><ShieldCheck size={24} /></div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">
              SecureNest <span className="text-blue-500 not-italic lowercase">admin</span>
            </h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-800 rounded-lg"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-6">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 mt-4">Management</p>
          <NavItem active={activeTab === 'pending'} onClick={() => { setActiveTab('pending'); setSidebarOpen(false); }} icon={<UserPlus size={18}/>} label="Requests" />
          <NavItem active={activeTab === 'tenants'} onClick={() => { setActiveTab('tenants'); setSidebarOpen(false); }} icon={<Building2 size={18}/>} label="Tenants" />
          <NavItem active={activeTab === 'guards'} onClick={() => { setActiveTab('guards'); setSidebarOpen(false); }} icon={<Users size={18}/>} label="Guard Team" />
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mt-8 mb-4">Monitoring</p>
          <NavItem active={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); setSidebarOpen(false); }} icon={<ClipboardList size={18}/>} label="System Logs" />
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg">
              {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate uppercase">{currentUser?.name || "Administrator"}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate lowercase flex items-center gap-1"><Mail size={10} /> {currentUser?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-all font-black text-[11px] uppercase tracking-widest">
            <LogOut size={16} /> Logout System
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
        <header className="flex justify-between items-center gap-4 mb-8 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{activeTab.replace('pending', 'Authorization').replace('tenants', 'Residents').replace('guards', 'Security')}</h2>
            <p className="text-slate-400 font-black mt-1 uppercase text-[10px] tracking-widest text-left">SecureNest Management Terminal</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><ShieldCheck size={24} /></button>
            <button onClick={fetchData} className="p-3 md:p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-xl transition-all text-slate-600 active:scale-95">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10 text-left">
          <StatBox icon={<Clock className="text-orange-500"/>} label="Pending" count={stats.pending} color="orange" />
          <StatBox icon={<Building2 className="text-blue-500"/>} label="Residents" count={stats.tenants} color="blue" />
          <StatBox icon={<Users className="text-green-500"/>} label="Security" count={stats.guards} color="green" />
        </div>

        <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-200 overflow-x-auto md:overflow-visible overflow-hidden min-h-[400px] relative text-left">
          {activeTab === 'logs' && !loading && !error && (
            <div className="px-6 md:px-10 py-4 md:py-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50/30">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Filter Logs:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLogFilter('all')}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    logFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setLogFilter('Pending')}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    logFilter === 'Pending'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Expected
                </button>
                <button
                  onClick={() => setLogFilter('Checked-In')}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    logFilter === 'Checked-In'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Inside
                </button>
                <button
                  onClick={() => setLogFilter('Checked-Out')}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    logFilter === 'Checked-Out'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Checked Out
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-20">
               <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Synchronizing Logs...</p>
            </div>
          ) : error ? (
            <div className="py-20 md:py-32 px-6 text-center flex flex-col items-center gap-4">
               <AlertCircle size={40} className="text-red-400" />
               <h4 className="text-lg md:text-xl font-black uppercase text-slate-800 tracking-tight">Access Interrupted</h4>
               <p className="text-slate-400 font-bold text-sm max-w-md">{error}</p>
               <button onClick={fetchData} className="mt-4 bg-slate-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Retry Sync</button>
            </div>
          ) : (
            <table className="w-full text-left min-w-max md:min-w-full">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 md:px-10 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identification</th>
                  <th className="px-6 md:px-10 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status / Role</th>
                  <th className="px-6 md:px-10 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.length === 0 ? (
                  <tr><td colSpan="3" className="py-20 md:py-32 px-6 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">No records found</td></tr>
                ) : (
                  (activeTab === 'logs' && logFilter !== 'all'
                    ? data.filter(item => item.status === logFilter)
                    : data
                  ).map((item) => (
                    <tr key={item._id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <p className="font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors text-sm md:text-base">{item.name}</p>
                        <p className="text-[10px] md:text-[11px] text-slate-400 font-bold mt-0.5 italic">{item.email || item.phone}</p>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 text-center">
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic whitespace-nowrap">
                          {item.role} {item.unitNumber ? `• Unit ${item.unitNumber}` : ''} {item.status ? `• ${item.status}` : ''}
                        </span>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                        {activeTab === 'pending' ? (
                          <button onClick={() => handleApprove(item._id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">Approve Access</button>
                        ) : (
                          <button onClick={() => activeTab === 'logs' ? setSelectedLog(item) : setSelectedUser(item)} className="p-2 md:p-3 bg-slate-50 text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all">
                            {activeTab === 'logs' ? <Info size={18} /> : <ChevronRight size={18}/>}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 relative shadow-2xl text-left animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 md:top-10 right-6 md:right-10 text-slate-300 hover:text-slate-600 transition-colors"><X size={28}/></button>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">{selectedUser.name}</h3>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 md:mb-8 italic">Account Management</p>
            <div className="space-y-4 mb-8 md:mb-10 bg-slate-50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100">
               <DetailField label="Registered Identity" value={selectedUser.email || selectedUser.phone} />
               <DetailField label="Assigned Role" value={selectedUser.role} />
            </div>
            <button onClick={() => handleRevoke(selectedUser._id, selectedUser.name)} className="w-full bg-red-50 text-red-600 py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">Revoke System Access</button>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2rem] md:rounded-[3rem] shadow-2xl p-8 md:p-12 text-left animate-in zoom-in-95 duration-200 relative">
            <button onClick={() => setSelectedLog(null)} className="absolute top-6 md:top-10 right-6 md:right-10 text-slate-300 hover:text-slate-900"><X size={28}/></button>
            <div className="mb-8 md:mb-10 text-center">
               <div className="w-16 md:w-20 h-16 md:h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-2xl md:text-3xl font-black mx-auto mb-4 md:mb-6 shadow-xl">{selectedLog.name.charAt(0)}</div>
               <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">{selectedLog.name}</h3>
               <span className="inline-block mt-2 text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">{selectedLog.status} LOG</span>
            </div>
            <div className="space-y-4 md:space-y-6 bg-slate-50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100">
              <DetailField label="Identity Ref" value={selectedLog.idNumber} />
              <DetailField label="Host Tenant" value={`Unit ${selectedLog.tenantId?.unitNumber} (${selectedLog.tenantId?.name})`} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 md:pt-6 border-t border-slate-200/50">
                <DetailField label="Check-In" value={selectedLog.checkInTime ? new Date(selectedLog.checkInTime).toLocaleTimeString() : 'N/A'} />
                <DetailField label="Check-Out" value={selectedLog.checkOutTime ? new Date(selectedLog.checkOutTime).toLocaleTimeString() : 'Active'} />
              </div>
            </div>
            <button onClick={() => setSelectedLog(null)} className="w-full mt-8 md:mt-10 bg-slate-900 text-white py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl">Dismiss Log</button>
          </div>
        </div>
      )}
    </div>
  );
};

// HELPERS
const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-2' : 'hover:bg-slate-800/50 hover:text-white'}`}>
    <span className={active ? 'text-white' : 'text-slate-500'}>{icon}</span> {label}
  </button>
);

const StatBox = ({ icon, label, count, color }) => (
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
    <div className={`p-5 rounded-2xl bg-${color}-50`}>{icon}</div>
    <div><p className="text-3xl font-black text-slate-900 leading-none">{count}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 italic leading-none">{label}</p></div>
  </div>
);

const DetailField = ({ label, value }) => (
  <div className="text-left">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none italic">{label}</p>
    <p className="font-bold text-slate-800 text-sm uppercase">{value || 'N/A'}</p>
  </div>
);

export default AdminDashboard;