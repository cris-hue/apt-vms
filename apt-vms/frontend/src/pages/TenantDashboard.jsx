import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { io } from 'socket.io-client';
import { 
  ShieldCheck, History, User, LogOut, LayoutDashboard, 
  Settings, Activity, Plus, Save, Mail, CheckCircle2, 
  Clock, Trash2, Edit3, X, Eye, Phone, Share2, Menu, Download
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react'; 
import InviteModal from '../components/InviteModal';

const TenantDashboard = () => {
  const { user, logout, setUser } = useContext(AuthContext); // setUser now works!
  const [activeView, setActiveView] = useState('dashboard'); 
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [viewingPass, setViewingPass] = useState(null); 
  const [editingPass, setEditingPass] = useState(null);
  const [profileForm, setProfileForm] = useState({ phone: '' });
  const qrCanvasRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      setNotifications((prev) => [{ id: Date.now(), ...payload }, ...prev].slice(0, 3));
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
    try {
      const { data } = await API.put('/auth/update-me', { phone: profileForm.phone });
      // Now that setUser is in Context, this won't crash!
      setUser(data.data);
      localStorage.setItem('user', JSON.stringify(data.data));
      alert("Profile updated successfully!");
      setActiveView('dashboard');
    } catch (err) { 
      alert("Update failed: " + (err.response?.data?.message || err.message)); 
    }
  };

  const handleUpdateVisitor = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/visitors/${editingPass._id}`, editingPass);
      alert("Visitor updated!");
      setEditingPass(null);
      fetchHistory();
    } catch (err) { alert("Update failed"); }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Revoke this pass?")) return;
    try {
      const res = await API.delete(`/visitors/${id}`);
      if (res.data.success) {
        setHistory(prev => prev.filter(v => v._id !== id));
        alert("Pass Revoked");
      }
    } catch (err) { alert("Revoke failed"); }
  };

  const shareToWhatsApp = (v) => {
    const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const passUrl = `${baseUrl}/visitor/pass/${v.qrCode}`;
    const msg = `*SecureNest Entry Pass*
Hello ${v.name}, your entry code for Unit ${user.unitNumber} is: *${v.qrCode}*

Use this link: ${passUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const downloadQrCode = () => {
    const canvas = qrCanvasRef.current || document.getElementById('tenant-qr-canvas');
    if (!canvas) return alert('QR code not ready yet.');
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${viewingPass?.name || 'visitor'}-securepass.png`;
    link.click();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
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
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black">{user?.name?.charAt(0).toUpperCase()}</div>
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

      <main className="flex-1 p-6 md:p-12 h-[100dvh] flex flex-col overflow-hidden w-full">
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-center mb-10 text-left gap-4 pr-16 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"><Menu size={20} /></button>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{activeView.replace('dashboard', 'Overview').replace('active', 'Active Passes').replace('history', 'Pass History').replace('profile', 'My Profile')}</h2>
              <p className="text-slate-400 font-black mt-1 uppercase text-[10px] tracking-widest italic leading-none text-left">Residential Access Management</p>
            </div>
          </div>
          <div className="absolute right-0 top-0 flex items-center gap-4">
            <button onClick={() => setIsInviteOpen(true)} className="hidden sm:inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200"><Plus size={18} /> Invite Visitor</button>
            <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black uppercase shadow-lg">{user?.name?.charAt(0) || 'T'}</div>
          </div>
        </header>

        {notifications.length > 0 && (
          <div className="space-y-3 mb-6">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-4xl border border-slate-200 bg-slate-950/95 text-white p-4 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Real-time alert</p>
                    <p className="font-black text-sm uppercase tracking-tight text-white">{notification.visitor.name} has {notification.type === 'checkin' ? 'checked in' : 'checked out'}.</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(notification.type === 'checkin' ? notification.visitor.checkInTime : notification.visitor.checkOutTime).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== notification.id))}
                    className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
                    aria-label="Dismiss notification"
                  ><X size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'dashboard' && (
          <div className="animate-in fade-in duration-500 flex flex-col flex-1 min-h-0 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left flex-shrink-0">
              <StatBox icon={<Activity className="text-blue-500"/>} label="Visits this Month" count={history.filter(v => v.status !== 'Pending').length} color="blue" />
              <StatBox icon={<CheckCircle2 className="text-green-500"/>} label="Currently Inside" count={history.filter(v => v.status === 'Checked-In').length} color="green" />
              <StatBox icon={<Clock className="text-orange-500"/>} label="Pending Invites" count={history.filter(v => v.status === 'Pending').length} color="orange" />
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden text-left">
               <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center flex-shrink-0">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Recent Activity</h3>
                  <button onClick={() => setActiveView('active')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Manage All</button>
               </div>
               <div className="divide-y divide-slate-50 flex-1 overflow-y-auto min-h-0">
                  {history.map(v => <VisitorRow key={v._id} visitor={v} />)}
               </div>
            </div>
          </div>
        )}

        {activeView === 'profile' && (
          <div className="max-w-5xl animate-in slide-in-from-bottom-4 duration-300 text-left flex-1 overflow-y-auto min-h-0 pr-2 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 text-center shadow-sm">
                  <div className="w-24 h-24 rounded-3xl bg-blue-600 mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black">{user?.name?.charAt(0).toUpperCase()}</div>
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
                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 mt-4"><Save size={18} /> Update My Profile</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {(activeView === 'active' || activeView === 'history') && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 text-left">
            <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-left flex-shrink-0">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 italic">
                 {activeView === 'active' ? 'Pending Invitations' : 'Complete Visitor Registry'}
               </h3>
            </div>
            <div className="divide-y divide-slate-50 flex-1 overflow-y-auto min-h-0">
              {history.filter(v => activeView === 'active' ? v.status === 'Pending' : v.status !== 'Pending').map(v => (
                <div key={v._id} className="px-10 py-7 flex items-center justify-between group hover:bg-blue-50/20 transition-all text-left">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${v.status === 'Checked-In' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>{v.name[0]}</div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase text-sm group-hover:text-blue-600">{v.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">{v.purpose} • {new Date(v.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {v.status === 'Pending' ? (
                    <div className="flex items-center gap-3">
                      <button onClick={() => setViewingPass(v)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"><Eye size={18}/></button>
                      <button onClick={() => setEditingPass(v)} className="p-3 bg-slate-50 text-slate-400 hover:text-green-600 rounded-xl transition-all shadow-sm"><Edit3 size={18}/></button>
                      <button onClick={() => handleRevoke(v._id)} className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                    </div>
                  ) : (
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${v.status === 'Checked-In' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>{v.status}</span>
                  )}
                </div>
              ))}
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
              <button onClick={downloadQrCode} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-100"><Download size={18} /> Download QR</button>
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
                <EditInput label="Full Name" value={editingPass.name} onChange={e => setEditingPass({...editingPass, name: e.target.value})} />
                <EditInput label="ID Number" value={editingPass.idNumber} onChange={e => setEditingPass({...editingPass, idNumber: e.target.value})} />
                <EditInput label="Phone" value={editingPass.phone} onChange={e => setEditingPass({...editingPass, phone: e.target.value})} />
                <EditInput label="Purpose" value={editingPass.purpose} onChange={e => setEditingPass({...editingPass, purpose: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest mt-6 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"><Save size={18} className="inline mr-2" /> Save Corrections</button>
            </form>
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

const EditInput = ({ label, value, onChange }) => (
  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-blue-100 transition-all" value={value} onChange={onChange} /></div>
);

const StatBox = ({ icon, label, count, color }) => (
  <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
    <div className={`p-5 rounded-2xl bg-${color}-50`}>{icon}</div>
    <div><p className="text-3xl font-black text-slate-900 leading-none">{count}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 italic">{label}</p></div>
  </div>
);

const VisitorRow = ({ visitor }) => (
  <div className="px-10 py-7 flex items-center justify-between group hover:bg-blue-50/20 transition-all text-left">
    <div className="flex items-center gap-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${visitor.status === 'Checked-In' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-300'}`}>{visitor.name.charAt(0)}</div>
      <div><h4 className="font-black text-slate-800 uppercase text-sm group-hover:text-blue-600 transition-colors">{visitor.name}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">{visitor.purpose} • {new Date(visitor.createdAt).toLocaleDateString()}</p></div>
    </div>
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${visitor.status === 'Checked-In' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-300 border-slate-200'}`}>{visitor.status}</span>
  </div>
);

export default TenantDashboard;