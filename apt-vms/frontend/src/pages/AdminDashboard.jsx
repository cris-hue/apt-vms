import { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { 
  Users, AlertCircle, RefreshCw, LogOut, ShieldCheck, ChevronLeft,
  ClipboardList, UserPlus, Building2, ChevronRight, X, Info, Mail, Trash2, Clock, CheckCircle2, Menu, Download
} from 'lucide-react';
import { Search } from 'lucide-react';
import { ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('pending'); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ pending: 0, tenants: 0, guards: 0, inside: 0, expired: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  
  const [selectedLog, setSelectedLog] = useState(null); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [logFilter, setLogFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const [approvedRes, pendingRes, visitorsRes] = await Promise.all([
        API.get('/auth/approved'),
        API.get('/auth/pending'),
        API.get('/visitors/all')
      ]);
      const approved = approvedRes.data.data || [];
      const visitors = visitorsRes.data.data || [];
      setStats({
        pending: (pendingRes.data.data || []).length,
        tenants: approved.filter(u => u.role === 'tenant').length,
        guards: approved.filter(u => u.role === 'guard').length,
        inside: visitors.filter(v => v.status === 'Checked-In').length,
        expired: visitors.filter(v => v.status === 'Expired').length
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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, logFilter, searchQuery]);

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

  const handleDownloadReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      alert("Please select both start and end dates.");
      return;
    }
    
    try {
      const res = await API.get('/visitors/all');
      const allVisitors = res.data?.data || [];
      
      const start = new Date(reportStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(reportEndDate);
      end.setHours(23, 59, 59, 999);
      
      const filtered = allVisitors.filter(v => {
        const d = new Date(v.createdAt || v.checkInTime || Date.now());
        return d >= start && d <= end;
      });

      if (filtered.length === 0) {
        alert("No records found in this date range.");
        return;
      }

      const headers = ['Name', 'Phone/Email', 'ID Number', 'Purpose', 'Status', 'Host Unit', 'Host Name', 'Check In', 'Check Out', 'Checked In By', 'Checked Out By'];
      const csvRows = [headers.join(',')];
      
      filtered.forEach(v => {
        const row = [
          `"${v.name || ''}"`,
          `"${v.phone || v.email || ''}"`,
          `"${v.idNumber || ''}"`,
          `"${v.purpose || ''}"`,
          `"${v.status || ''}"`,
          `"${v.tenantId?.unitNumber || ''}"`,
          `"${v.tenantId?.name || ''}"`,
          `"${v.checkInTime ? new Date(v.checkInTime).toLocaleString() : ''}"`,
          `"${v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : ''}"`,
          `"${v.checkedInBy?.name || ''}"`,
          `"${v.checkedOutBy?.name || ''}"`
        ];
        csvRows.push(row.join(','));
      });
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `Visitor_Report_${reportStartDate}_to_${reportEndDate}.csv`);
      a.click();
      
      setShowReportModal(false);
    } catch (err) {
      console.error("Error generating report", err);
      alert("Failed to generate report.");
    }
  };

  const handleAdminCheckOut = async (id) => {
    if (!window.confirm("Manual Override: Are you sure you want to force check-out this visitor?")) return;
    try {
      await API.put(`/visitors/checkout/${id}`);
      alert("Visitor checked out via override.");
      setSelectedLog(null);
      fetchData();
    } catch (err) { alert("Check-out failed: " + (err.response?.data?.message || err.message)); }
  };

  const isOverdue = (v) => v.status === 'Checked-In' && v.checkInTime && (Date.now() - new Date(v.checkInTime).getTime() > 6 * 60 * 60 * 1000);

  const filteredData = activeTab === 'logs'
    ? data.filter(item => {
        if (logFilter !== 'all' && item.status !== logFilter) return false;
        if (searchQuery.trim() !== '') {
          return item.name?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
    : data;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'A'}
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

      <main className="flex-1 p-4 sm:p-6 md:p-8 h-[100dvh] flex flex-col overflow-hidden w-full">
        <header className="flex justify-between items-center gap-2 md:gap-4 mb-6 md:mb-8 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-900 rounded-xl hover:bg-slate-200 transition-all flex-shrink-0"><Menu size={24} /></button>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none truncate">{activeTab.replace('pending', 'Authorization').replace('tenants', 'Residents').replace('guards', 'Security')}</h2>
              <p className="hidden sm:block text-slate-400 font-black mt-1 uppercase text-[10px] tracking-widest text-left truncate">SecureNest Management Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button onClick={() => setShowReportModal(true)} className="px-3 py-2 md:p-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl hover:shadow-xl transition-all text-slate-600 active:scale-95 flex items-center gap-1.5 md:gap-2" title="Download Report">
              <Download size={16} className="md:w-5 md:h-5" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Report</span>
            </button>
            <button onClick={fetchData} className="hidden md:flex p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-xl transition-all text-slate-600 active:scale-95 items-center justify-center" title="Refresh Data">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs md:text-sm font-black uppercase shadow-lg flex-shrink-0">{currentUser?.name?.charAt(0) || 'A'}</div>
          </div>
        </header>

        {/* Tailwind Safelist: bg-indigo-50 text-indigo-500 bg-red-50 text-red-500 */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8 text-left flex-shrink-0">
          <StatBox icon={<Clock className="text-orange-500"/>} label="Pending" count={stats.pending} color="orange" />
          <StatBox icon={<Building2 className="text-blue-500"/>} label="Residents" count={stats.tenants} color="blue" />
          <StatBox icon={<Users className="text-green-500"/>} label="Security" count={stats.guards} color="green" />
          <StatBox icon={<CheckCircle2 className="text-indigo-500"/>} label="Currently Inside" count={stats.inside} color="indigo" />
          <StatBox icon={<ShieldAlert className="text-red-500"/>} label="Expired" count={stats.expired} color="red" />
        </div>

        <div className="bg-white rounded-[4xl] md:rounded-[3rem] shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0 relative text-left overflow-hidden">
          {activeTab === 'logs' && !loading && !error && (
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-50 bg-slate-50/30 flex flex-col text-left flex-shrink-0 gap-4 md:gap-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic whitespace-nowrap">Filter Logs:</p>
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
                  <button
                    onClick={() => setLogFilter('Expired')}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      logFilter === 'Expired'
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Expired
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row w-full gap-2 md:gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="SEARCH NAME..." 
                    className="w-full bg-white border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:border-blue-600 transition-colors shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
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
            <div className="flex flex-col flex-1 min-h-0">
             <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 relative">
              <table className="w-full text-left min-w-max md:min-w-full">
                <thead className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 md:px-8 py-3 md:py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identification</th>
                    <th className="px-6 md:px-8 py-3 md:py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status / Role</th>
                    <th className="px-6 md:px-8 py-3 md:py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentData.length === 0 ? (
                    <tr><td colSpan="3" className="py-20 md:py-32 px-6 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">No records found</td></tr>
                  ) : (
                    currentData.map((item) => (
                      <tr key={item._id} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="px-6 md:px-8 py-4 md:py-5">
                          <p className="font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors text-sm">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5 italic">{item.email || item.phone}</p>
                        </td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-center">
                          <span className={`px-3 md:px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic whitespace-nowrap border ${item.status === 'Expired' ? 'bg-red-50 text-red-600 border-red-100' : item.status === 'Checked-In' ? (isOverdue(item) ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100') : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {item.role} {item.unitNumber ? `• Unit ${item.unitNumber}` : ''} {item.status ? `• ${item.status}` : ''}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-right">
                          {activeTab === 'pending' ? (
                            <button onClick={() => handleApprove(item._id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">Approve Access</button>
                          ) : (
                            <button onClick={() => activeTab === 'logs' ? setSelectedLog(item) : setSelectedUser(item)} className="p-2 bg-slate-50 text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all">
                              {activeTab === 'logs' ? <Info size={18} /> : <ChevronRight size={18}/>}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
             </div>
             {/* Pagination Controls */}
             <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 gap-4">
               <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                 Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
               </span>
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   disabled={currentPage === 1}
                   className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                 ><ChevronLeft size={16} /></button>
                 <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-600 px-2">Page {currentPage} of {totalPages}</span>
                 <button 
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   disabled={currentPage === totalPages}
                   className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                 ><ChevronRight size={16} /></button>
               </div>
             </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[4xl] md:rounded-[3rem] p-8 md:p-12 relative shadow-2xl text-left animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 md:top-10 right-6 md:right-10 text-slate-300 hover:text-slate-600 transition-colors"><X size={28}/></button>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">{selectedUser.name}</h3>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 md:mb-8 italic">Account Management</p>
            <div className="space-y-4 mb-8 md:mb-10 bg-slate-50 p-6 md:p-8 rounded-[4xl] md:rounded-[2.5rem] border border-slate-100">
               <DetailField label="Registered Identity" value={selectedUser.email || selectedUser.phone} />
               <DetailField label="Assigned Role" value={selectedUser.role} />
            </div>
            <button onClick={() => handleRevoke(selectedUser._id, selectedUser.name)} className="w-full bg-red-50 text-red-600 py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">Revoke System Access</button>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[4xl] md:rounded-[3rem] shadow-2xl p-8 md:p-12 text-left animate-in zoom-in-95 duration-200 relative">
            <button onClick={() => setSelectedLog(null)} className="absolute top-6 md:top-10 right-6 md:right-10 text-slate-300 hover:text-slate-900"><X size={28}/></button>
            <div className="mb-8 md:mb-10 text-center">
               <div className="w-16 md:w-20 h-16 md:h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-2xl md:text-3xl font-black mx-auto mb-4 md:mb-6 shadow-xl">{selectedLog.name.charAt(0)}</div>
               <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">{selectedLog.name}</h3>
               <span className="inline-block mt-2 text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">{selectedLog.status} LOG</span>
            </div>
            <div className="space-y-4 md:space-y-6 bg-slate-50 p-6 md:p-8 rounded-[4xl] md:rounded-[2.5rem] border border-slate-100">
              <DetailField label="Identity Ref" value={selectedLog.idNumber} />
              <DetailField label="Host Tenant" value={`Unit ${selectedLog.tenantId?.unitNumber} (${selectedLog.tenantId?.name})`} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 md:pt-6 border-t border-slate-200/50">
                <DetailField label="Check-In" value={selectedLog.checkInTime ? new Date(selectedLog.checkInTime).toLocaleString() : 'N/A'} />
                <DetailField label="Checked In By" value={selectedLog.checkedInBy?.name || 'N/A'} />
                <DetailField label="Check-Out" value={selectedLog.checkOutTime ? new Date(selectedLog.checkOutTime).toLocaleString() : 'Active'} />
                <DetailField label="Checked Out By" value={selectedLog.checkedOutBy?.name ? `${selectedLog.checkedOutBy.name}${selectedLog.checkedOutBy.role === 'admin' ? ' (Admin Override)' : ''}` : 'N/A'} />
              </div>
            </div>
            {selectedLog.status === 'Checked-In' && (
              <button onClick={() => handleAdminCheckOut(selectedLog._id)} className="w-full mt-6 bg-red-50 text-red-600 py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100">Manual Override Check-Out</button>
            )}
            <button onClick={() => setSelectedLog(null)} className={`w-full ${selectedLog.status === 'Checked-In' ? 'mt-3' : 'mt-8 md:mt-10'} bg-slate-900 text-white py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl`}>Dismiss Log</button>
          </div>
        </div>
      )}

      {/* DOWNLOAD REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[4xl] md:rounded-[3rem] p-8 md:p-12 relative shadow-2xl text-left animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowReportModal(false)} className="absolute top-6 md:top-10 right-6 md:right-10 text-slate-300 hover:text-slate-600 transition-colors"><X size={28}/></button>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Download Report</h3>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 md:mb-8 italic">Export Visitor Logs to CSV</p>
            
            <div className="space-y-4 mb-8 md:mb-10 bg-slate-50 p-6 md:p-8 rounded-[4xl] md:rounded-[2.5rem] border border-slate-100">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Start Date</label>
                <input 
                  type="date" 
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">End Date</label>
                <input 
                  type="date" 
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button onClick={handleDownloadReport} className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-xl">Generate & Download CSV</button>
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
  <div className={`bg-white p-4 md:p-5 rounded-3xl border flex items-center gap-3 md:gap-4 min-w-0 transition-all ${color === 'red' && count > 0 ? 'border-red-300 shadow-lg shadow-red-200 animate-pulse' : 'border-slate-200 shadow-sm'}`}>
    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-${color}-50 shrink-0`}>{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-xl md:text-2xl font-black text-slate-900 leading-none truncate">{count}</p>
      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 md:mt-1.5 italic leading-tight break-words">{label}</p>
    </div>
  </div>
);

const DetailField = ({ label, value }) => (
  <div className="text-left">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none italic">{label}</p>
    <p className="font-bold text-slate-800 text-sm uppercase">{value || 'N/A'}</p>
  </div>
);

export default AdminDashboard;