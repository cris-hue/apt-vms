import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { io } from 'socket.io-client';
import { 
  ShieldCheck, History, User, LogOut, LayoutDashboard, 
  Settings, Activity, Plus, Save, Mail, CheckCircle2, 
  Clock, Trash2, Edit3, X, Eye, Phone, Share2, Menu, Download, Bell, Search,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { ShieldAlert } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react'; 
import InviteModal from '../components/InviteModal';
import { Toaster, toast } from 'react-hot-toast';

const TenantDashboard = () => {
  const { user, logout, setUser } = useContext(AuthContext); // setUser now works!
  const [activeView, setActiveView] = useState('dashboard'); 
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [viewingPass, setViewingPass] = useState(null); 
  const [editingPass, setEditingPass] = useState(null);
  const [profileForm, setProfileForm] = useState({ phone: '' });
  const qrCanvasRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingVisitor, setIsUpdatingVisitor] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState(null);
  const [editFieldErrors, setEditFieldErrors] = useState({ name: '', phone: '', idNumber: '' });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, logFilter, searchQuery, sortOrder]);

  useEffect(() => {
    if (user) {
      setProfileForm({ phone: user.phone || '' });
      fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const socketServer = API.defaults.baseURL.replace(/\/api\/?$/, '');
    const socket = io(socketServer, { transports: ['websocket'] });

    socket.on('connect', () => {
      console.log('Tenant socket connected:', socket.id);
      socket.emit('joinTenantRoom', user._id);
    });

    socket.on('visitor-status-updated', (payload) => {
      setNotifications((prev) => [{ id: Date.now(), ...payload }, ...prev].slice(0, 20));
      fetchHistory();
    });

    socket.on('global-update', () => {
      fetchHistory();
    });

    socket.on('connect_error', (err) => {
      console.error('Tenant socket connect error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data } = await API.get('/visitors/my-visitors');
      setHistory(data.data);
    } catch (err) { console.error(err); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const { data } = await API.put('/auth/update-me', { phone: profileForm.phone });
      // Now that setUser is in Context, this won't crash!
      setUser(data.data);
      localStorage.setItem('user', JSON.stringify(data.data));
      toast.success("Profile updated successfully!");
      setActiveView('dashboard');
    } catch (err) { 
      toast.error("Update failed: " + (err.response?.data?.message || err.message)); 
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleEditChange = (name, value) => {
    setEditingPass(prev => ({ ...prev, [name]: value }));

    // Real-time validation
    if (name === 'name') {
      const words = value.trim().split(/\s+/);
      if (words.length !== 2 || !words.every(w => /^[A-Z]/.test(w))) {
        setEditFieldErrors(prev => ({ ...prev, name: 'Must provide exactly two names, starting with capitals.' }));
      } else {
        setEditFieldErrors(prev => ({ ...prev, name: '' }));
      }
    } else if (name === 'phone') {
      if (/[^\d]/.test(value)) {
        setEditFieldErrors(prev => ({ ...prev, phone: 'Phone number can only contain digits.' }));
      } else if (value.length > 0 && value.length !== 10) {
        setEditFieldErrors(prev => ({ ...prev, phone: 'Phone number must be exactly 10 digits.' }));
      } else {
        setEditFieldErrors(prev => ({ ...prev, phone: '' }));
      }
    } else if (name === 'idNumber') {
      if (/[^\d]/.test(value)) {
        setEditFieldErrors(prev => ({ ...prev, idNumber: 'ID number can only contain digits.' }));
      } else if (value.length > 0 && (value.length < 6 || value.length > 8)) {
        setEditFieldErrors(prev => ({ ...prev, idNumber: 'ID number must be between 6 and 8 digits.' }));
      } else {
        setEditFieldErrors(prev => ({ ...prev, idNumber: '' }));
      }
    }
  };

  const handleUpdateVisitor = async (e) => {
    e.preventDefault();
    
    if (editFieldErrors.name || editFieldErrors.phone || editFieldErrors.idNumber) {
      return toast.error("Please fix the real-time validation errors.");
    }
    const nameWords = editingPass.name.trim().split(/\s+/);
    if (nameWords.length !== 2 || !nameWords.every(w => /^[A-Z]/.test(w))) {
      return toast.error("Must provide exactly two names, starting with capitals.");
    }
    if (!/^\d{10}$/.test(editingPass.phone)) return toast.error("Phone number must be exactly 10 digits.");
    if (!/^\d{6,8}$/.test(editingPass.idNumber)) return toast.error("ID number must be between 6 and 8 digits.");

    setIsUpdatingVisitor(true);

    try {
      await API.put(`/visitors/${editingPass._id}`, editingPass);
      toast.success("Visitor updated!");
      setEditingPass(null);
      fetchHistory();
    } catch (err) {
      toast.error("Update failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsUpdatingVisitor(false);
    }
  };

  const handleRevoke = async (id) => {
    setRevokingId(id);
    try {
      const res = await API.delete(`/visitors/${id}`);
      if (res.data.success) {
        setHistory(prev => prev.filter(v => v._id !== id));
        toast.success("Pass Revoked");
        fetchHistory();
        setConfirmRevokeId(null);
      }
    } catch (err) {
      toast.error("Revoke failed: " + (err.response?.data?.message || err.message));
    } finally {
      setRevokingId(null);
    }
  };

  const shareToWhatsApp = (v) => {
    const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const passUrl = `${baseUrl}/visitor/pass/${v.qrCode}`;
    const msg = `*SecureNest Entry Pass*
Hello ${v.name}, your entry code for Unit ${user.unitNumber} is: *${v.qrCode}*

Use this link: ${passUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyLink = (v) => {
    const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const passUrl = `${baseUrl}/visitor/pass/${v.qrCode}`;
    navigator.clipboard.writeText(passUrl);
    toast.success("Link copied!");
  };

  const downloadQrCode = async () => {
    setIsDownloading(true);
    try {
      // Brief artificial delay to show the loading animation
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = qrCanvasRef.current || document.getElementById('tenant-qr-canvas');
      if (!canvas) return toast.error('QR code not ready yet.');
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${viewingPass?.name || 'visitor'}-securepass.png`;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const isOverdue = (v) => v.status === 'Checked-In' && v.checkInTime && (Date.now() - new Date(v.checkInTime).getTime() > 6 * 60 * 60 * 1000);

  const filteredHistory = history.filter(v => {
    if (activeView === 'active' && v.status !== 'Pending') return false;
    if (activeView === 'history' && logFilter !== 'all' && v.status !== logFilter) return false;
    if (searchQuery.trim() !== '') {
      const nameStr = v.name ? String(v.name).toLowerCase() : '';
      if (!nameStr.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const currentHistoryData = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Derived state to check if visitor fields or profile fields have actually been changed
  const originalPass = editingPass ? history.find(v => v._id === editingPass._id) : null;
  const hasVisitorChanges = editingPass && originalPass ? (
    editingPass.name !== originalPass.name ||
    editingPass.idNumber !== originalPass.idNumber ||
    editingPass.phone !== originalPass.phone ||
    editingPass.purpose !== originalPass.purpose
  ) : false;
  
  const hasProfileChanges = profileForm.phone !== (user?.phone || '');

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <Toaster position="top-center" reverseOrder={false} />
      <aside className={`w-full md:w-80 bg-slate-900 text-slate-300 flex flex-col ${sidebarOpen ? 'fixed inset-0 z-100 md:sticky md:inset-auto md:z-0' : 'hidden md:flex'} md:top-0 md:h-screen shadow-2xl transition-all`}>
        <div className="p-8 flex items-center justify-between gap-3 text-white border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg"><ShieldCheck size={24} /></div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">SecureNest <span className="text-blue-500 not-italic lowercase">tenant</span></h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-800 rounded-lg"><X size={20} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-8">
          <SidebarItem active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }} icon={<LayoutDashboard size={18}/>} label="Overview" />
          <SidebarItem active={activeView === 'active'} onClick={() => { setActiveView('active'); setSidebarOpen(false); }} icon={<Clock size={18}/>} label="Active Passes" />
          <SidebarItem active={activeView === 'history'} onClick={() => { setActiveView('history'); setSidebarOpen(false); }} icon={<History size={18}/>} label="Pass History" />
          <SidebarItem active={activeView === 'profile'} onClick={() => { setActiveView('profile'); setSidebarOpen(false); }} icon={<Settings size={18}/>} label="My Profile" />
        </nav>
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black">{user?.name?.charAt(0)?.toUpperCase() || 'T'}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate uppercase">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate lowercase flex items-center gap-1"><Mail size={10} /> {user?.email}</p>
              <p className="text-[9px] text-blue-500 font-black uppercase mt-1">Unit: {user?.unitNumber}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-all font-black text-[11px] uppercase tracking-widest">
            <LogOut size={16} /> Logout System
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 h-dvh flex flex-col overflow-hidden w-full">
        <header className="flex justify-between items-center gap-4 mb-8 md:mb-10 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"><Menu size={24} /></button>
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{activeView.replace('dashboard', 'Overview').replace('active', 'Active Passes').replace('history', 'Pass History').replace('profile', 'My Profile')}</h2>
              <p className="text-slate-400 font-black mt-1.5 uppercase text-[10px] tracking-widest italic leading-none text-left">Residential Access Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setIsInviteOpen(true)} className="flex items-center gap-1 md:gap-2 bg-blue-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl shadow-blue-200">
              <Plus size={16} className="md:hidden" />
              <Plus size={18} className="hidden md:block" />
              <span className="hidden sm:inline">Invite Visitor</span>
              <span className="sm:hidden">Invite</span>
            </button>

            <div className="relative">
              <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-2 md:p-3 bg-white text-slate-400 hover:text-slate-900 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95">
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute top-full -right-11 md:right-0 mt-2 w-[85vw] sm:w-80 max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-left animate-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Notifications</h4>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">Clear All</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">No new alerts</div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <p className="font-bold text-xs text-slate-800 uppercase tracking-tight leading-snug">{notification.visitor.name} has {notification.type === 'checkin' ? 'checked in' : 'checked out'}.</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{new Date(notification.type === 'checkin' ? notification.visitor.checkInTime : notification.visitor.checkOutTime).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs md:text-sm font-black uppercase shadow-lg">{user?.name?.charAt(0) || 'T'}</div>
          </div>
        </header>

        {activeView === 'dashboard' && (
          <div className="animate-in fade-in duration-500 flex flex-col flex-1 min-h-0 pb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 text-left shrink-0">
              <StatBox icon={<Activity className="text-blue-500"/>} label="Completed Visits" count={history.filter(v => v.status === 'Checked-Out').length} color="blue" />
              <StatBox icon={<CheckCircle2 className="text-green-500"/>} label="Currently Inside" count={history.filter(v => v.status === 'Checked-In').length} color="green" />
              <StatBox icon={<Clock className="text-orange-500"/>} label="Pending Invites" count={history.filter(v => v.status === 'Pending').length} color="orange" />
              <StatBox icon={<ShieldAlert className="text-red-500"/>} label="Expired Passes" count={history.filter(v => v.status === 'Expired').length} color="red" />
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden text-left">
               <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center shrink-0">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Recent Activity</h3>
                  <button onClick={() => setActiveView('active')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Manage All</button>
               </div>
               <div className="divide-y divide-slate-50 flex-1 overflow-y-auto min-h-0">
                  {history.slice(0, 5).map(v => <VisitorRow key={v._id} visitor={v} />)}
               </div>
            </div>
          </div>
        )}

        {activeView === 'profile' && (
          <div className="max-w-5xl animate-in slide-in-from-bottom-4 duration-300 text-left flex-1 overflow-y-auto min-h-0 pr-2 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 text-center shadow-sm">
                  <div className="w-24 h-24 rounded-3xl bg-blue-600 mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black">{user?.name?.charAt(0)?.toUpperCase() || 'T'}</div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{user?.name}</h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 italic">Resident Tenant</p>
                  <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col gap-3">
                     <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Unit Status</span><span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black uppercase rounded-full">Active</span></div>
                     <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Residence</span><span className="text-[10px] font-black text-slate-700">UNIT {user?.unitNumber}</span></div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <form onSubmit={handleUpdateProfile} className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-4"><div className="w-1 h-5 bg-blue-600 rounded-full"></div><h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Account Settings</h4></div>
                  <ProfileField label="Full Name (Locked)" value={user?.name} icon={<User size={18}/>} isLocked />
                  <ProfileField label="Email Address (Locked)" value={user?.email} icon={<Mail size={18}/>} isLocked />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number (Editable)</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors"><Phone size={18}/></div>
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 p-5 pl-14 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-blue-50 focus:bg-white transition-all" value={profileForm.phone} onChange={e => setProfileForm({phone: e.target.value})} />
                    </div>
                  </div>
                <button type="submit" disabled={isUpdatingProfile || !hasProfileChanges} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 mt-4 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed">
                  {isUpdatingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                  {isUpdatingProfile ? 'Updating...' : 'Update My Profile'}
                </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {(activeView === 'active' || activeView === 'history') && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 text-left">
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-50 bg-slate-50/50 flex flex-col text-left shrink-0 gap-4 md:gap-5">
               <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 italic whitespace-nowrap">
                   {activeView === 'active' ? 'Pending Invitations' : 'Complete Visitor Registry'}
                 </h3>
                 {activeView === 'history' && (
                   <div className="flex flex-wrap gap-2">
                      <button onClick={() => setLogFilter('all')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${logFilter === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
                      <button onClick={() => setLogFilter('Pending')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${logFilter === 'Pending' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Expected</button>
                      <button onClick={() => setLogFilter('Checked-In')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${logFilter === 'Checked-In' ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Inside</button>
                      <button onClick={() => setLogFilter('Checked-Out')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${logFilter === 'Checked-Out' ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Checked Out</button>
                      <button onClick={() => setLogFilter('Expired')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${logFilter === 'Expired' ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Expired</button>
                   </div>
                 )}
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
                 {activeView === 'history' && (
                   <select
                     value={sortOrder}
                     onChange={(e) => setSortOrder(e.target.value)}
                     className="bg-white border border-slate-200 py-2.5 px-3 md:px-4 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest outline-none focus:border-blue-600 transition-colors shadow-sm text-slate-500 cursor-pointer appearance-none text-center"
                   >
                     <option value="newest">Newest First</option>
                     <option value="oldest">Oldest First</option>
                   </select>
                 )}
               </div>
            </div>
            <div className="divide-y divide-slate-50 flex-1 overflow-y-auto min-h-0">
              {currentHistoryData.length === 0 ? (
                <div className="p-12 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">No records found</div>
              ) : (
                currentHistoryData.map(v => (
                <div key={v._id} className="px-6 md:px-8 py-4 md:py-5 flex items-center justify-between group hover:bg-blue-50/20 transition-all text-left">
                  <div className="flex items-center gap-4 md:gap-6 min-w-0 pr-2">
                    <div className={`w-12 md:w-14 h-12 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${v.status === 'Checked-In' ? (isOverdue(v) ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600') : v.status === 'Expired' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'} shrink-0`}>{v.name ? String(v.name).charAt(0).toUpperCase() : 'V'}</div>
                    <div className="min-w-0 truncate">
                      <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm group-hover:text-blue-600 transition-colors truncate">{v.name || 'Unknown'}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic truncate">{v.purpose || 'N/A'} • {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  {v.status === 'Pending' ? (
                    <div className="flex items-center gap-3">
                      <button onClick={() => setViewingPass(v)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"><Eye size={18}/></button>
                      <button onClick={() => { setEditingPass(v); setEditFieldErrors({name: '', phone: '', idNumber: ''}); }} className="p-3 bg-slate-50 text-slate-400 hover:text-green-600 rounded-xl transition-all shadow-sm"><Edit3 size={18}/></button>
                    <button onClick={() => setConfirmRevokeId(v._id)} disabled={revokingId === v._id} className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                      {revokingId === v._id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18}/>}
                    </button>
                    </div>
                  ) : (
                    <span className={`px-3 md:px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap border ${v.status === 'Checked-In' ? (isOverdue(v) ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100') : v.status === 'Expired' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>{v.status}</span>
                  )}
                </div>
                ))
              )}
            </div>
            {/* Pagination Controls */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                Showing {filteredHistory.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} entries
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
      </main>

      {/* MODALS (QR View & Visitor Edit) - SAME AS PREVIOUSLY WORKING */}
      {viewingPass && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 relative text-center shadow-2xl">
            <button onClick={() => setViewingPass(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X size={24}/></button>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">{viewingPass.name}</h3>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-8 italic">Secure Entry Pass</p>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex justify-center mb-8 shadow-inner"><QRCodeCanvas ref={qrCanvasRef} id="tenant-qr-canvas" value={viewingPass.qrCode} size={180} level="H" includeMargin={true} /></div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Code: {viewingPass.qrCode}</div>
            <div className="grid gap-3">
              <button onClick={downloadQrCode} disabled={isDownloading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-70 disabled:cursor-not-allowed">
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
                {isDownloading ? 'Downloading...' : 'Download QR'}
              </button>
              <button onClick={() => copyLink(viewingPass)} className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all border border-slate-200">Copy Link</button>
              <button onClick={() => shareToWhatsApp(viewingPass)} className="w-full bg-green-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-100"><Share2 size={18} /> WhatsApp Pass</button>
            </div>
          </div>
        </div>
      )}

      {editingPass && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in zoom-in-95 duration-200 text-left">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 relative shadow-2xl">
            <button onClick={() => setEditingPass(null)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X size={28}/></button>
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 italic">Correct Invite</h3>
            <form onSubmit={handleUpdateVisitor} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <EditInput label="Full Name" value={editingPass.name} error={editFieldErrors.name} onChange={e => handleEditChange('name', e.target.value)} />
                <EditInput label="ID Number" value={editingPass.idNumber} error={editFieldErrors.idNumber} onChange={e => handleEditChange('idNumber', e.target.value)} />
                <EditInput label="Phone" value={editingPass.phone} error={editFieldErrors.phone} onChange={e => handleEditChange('phone', e.target.value)} />
                <EditInput label="Purpose" value={editingPass.purpose} onChange={e => handleEditChange('purpose', e.target.value)} />
              </div>
              <button type="submit" disabled={isUpdatingVisitor || !hasVisitorChanges} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest mt-6 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isUpdatingVisitor ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                {isUpdatingVisitor ? 'Saving...' : 'Save Corrections'}
              </button>
            </form>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Quick Share Updated Pass</p>
              <div className="flex gap-3">
                <button onClick={() => copyLink(editingPass)} type="button" className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all border border-slate-200">Copy Link</button>
                <button onClick={() => shareToWhatsApp(editingPass)} type="button" className="flex-1 bg-green-500 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-md shadow-green-100"><Share2 size={16} /> WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmRevokeId && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Revoke Pass?</h3>
            <p className="text-xs text-slate-500 mt-2 font-bold max-w-50 mx-auto">This action cannot be undone. The visitor will be denied entry.</p>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setConfirmRevokeId(null)} 
                disabled={revokingId === confirmRevokeId}
                className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleRevoke(confirmRevokeId)} 
                disabled={revokingId === confirmRevokeId}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-xl shadow-red-200 flex items-center justify-center gap-2 disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {revokingId === confirmRevokeId ? <Loader2 size={16} className="animate-spin" /> : null}
                {revokingId === confirmRevokeId ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      <InviteModal isOpen={isInviteOpen} onClose={() => { setIsInviteOpen(false); fetchHistory(); }} user={user} />
    </div>
  );
};

// HELPERS
const SidebarItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-2' : 'hover:bg-slate-800/50 hover:text-white'}`}>
    <span className={active ? 'text-white' : 'text-slate-500'}>{icon}</span>{label}
  </button>
);

const ProfileField = ({ label, value, icon, isLocked }) => (
  <div className="space-y-2 text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors">{icon}</div>
      <input readOnly className="w-full bg-slate-100 border border-slate-200 p-5 pl-14 rounded-2xl font-bold text-sm text-slate-400 cursor-not-allowed" value={value} />
      {isLocked && <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-slate-300 italic tracking-tighter">System Locked</span>}
    </div>
  </div>
);

const EditInput = ({ label, value, onChange, error }) => (
  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
  <input className={`w-full bg-slate-50 border p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-100 ring-blue-100'}`} value={value} onChange={onChange} />
  {error && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 leading-tight">{error}</p>}</div>
);

const StatBox = ({ icon, label, count, color }) => (
  <div className={`bg-white p-4 md:p-5 rounded-3xl border flex items-center gap-3 md:gap-4 min-w-0 transition-all ${color === 'red' && count > 0 ? 'border-red-300 shadow-lg shadow-red-200 animate-pulse' : 'border-slate-200 shadow-sm'}`}>
    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-${color}-50 shrink-0`}>{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-xl md:text-2xl font-black text-slate-900 leading-none truncate">{count}</p>
      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 md:mt-1.5 italic leading-tight wrap-break-word">{label}</p>
    </div>
  </div>
);

const VisitorRow = ({ visitor }) => {
  const isOverdue = visitor.status === 'Checked-In' && visitor.checkInTime && (Date.now() - new Date(visitor.checkInTime).getTime() > 6 * 60 * 60 * 1000);
  return (
    <div className="px-6 md:px-8 py-4 md:py-5 flex items-center justify-between group hover:bg-blue-50/20 transition-all text-left">
      <div className="flex items-center gap-4 md:gap-6 min-w-0 pr-2">
        <div className={`w-12 md:w-14 h-12 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${visitor.status === 'Checked-In' ? (isOverdue ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600') : visitor.status === 'Expired' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'} shrink-0`}>{visitor.name ? String(visitor.name).charAt(0).toUpperCase() : 'V'}</div>
        <div className="min-w-0 truncate">
          <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm group-hover:text-blue-600 transition-colors truncate">{visitor.name || 'Unknown'}</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic truncate">{visitor.purpose || 'N/A'} • {visitor.createdAt ? new Date(visitor.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
      <span className={`px-3 md:px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap border ${visitor.status === 'Checked-In' ? (isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100') : visitor.status === 'Expired' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-300 border-slate-200'}`}>{visitor.status}</span>
    </div>
  );
};

export default TenantDashboard;