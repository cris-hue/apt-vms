import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { 
  ShieldCheck, Search, UserCheck, Clock, 
  LogOut, User, X, Info, LayoutDashboard, 
  History, Activity, QrCode, CheckCircle2, Mail
} from 'lucide-react';

const GuardDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [visitors, setVisitors] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Pending');
  const [vmsSearch, setVmsSearch] = useState('');
  const [scannedVisitor, setScannedVisitor] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. AUTO-CLEAR MESSAGE TIMER (Disappears after 5 seconds)
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/visitors/all');
      setVisitors(data.data);
    } catch (err) {
      console.error("Error fetching visitors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // 2. FIXED SEARCH LOGIC (Matches backend GET /scan/:qrCode route)
  const handleVerifySearch = async (e) => {
    e.preventDefault();
    if (!vmsSearch.trim()) return;
    
    setMessage({ type: '', text: '' });
    setScannedVisitor(null);

    try {
      // Changed to GET to match your visitorRoutes.js configuration
      const { data } = await API.get(`/visitors/scan/${vmsSearch.trim()}`);
      
      if (data.success) {
        setScannedVisitor(data.data);
        setMessage({ type: 'success', text: 'Pass Found: Identity Authenticated' });
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Invalid Pass Code or Visitor not found' 
      });
      setScannedVisitor(null);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await API.put(`/visitors/checkin/${id}`);
      setScannedVisitor(null);
      setVmsSearch('');
      setMessage({ type: 'success', text: 'Check-in successful! Entry Authorized.' });
      fetchVisitors();
    } catch (err) {
      alert("Check-in failed");
    }
  };

  const handleCheckOut = async (id) => {
    try {
      await API.put(`/visitors/checkout/${id}`);
      fetchVisitors();
      alert("Visitor Checked Out");
    } catch (err) {
      alert("Check-out failed");
    }
  };

  const filteredList = visitors.filter(v => v.status === activeFilter);
  const formatTime = (time) => time ? new Date(time).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'N/A';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-80 bg-slate-900 text-slate-300 flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-8 flex items-center gap-3 text-white border-b border-slate-800/50">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">
            SecureNest <span className="text-blue-500 not-italic lowercase">guard</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-8 text-left">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Operations Hub</p>
          <SidebarItem active={activeFilter === 'Pending'} onClick={() => setActiveFilter('Pending')} icon={<Clock size={18}/>} label="Expected Today" />
          <SidebarItem active={activeFilter === 'Checked-In'} onClick={() => setActiveFilter('Checked-In')} icon={<UserCheck size={18}/>} label="Currently Inside" />
          <SidebarItem active={activeFilter === 'Checked-Out'} onClick={() => setActiveFilter('Checked-Out')} icon={<History size={18}/>} label="Cleared History" />
        </nav>

        {/* Guard Profile Card - Bottom */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 mb-6 px-2 text-left">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'G'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate uppercase tracking-tight leading-tight">{user?.name || "Security Officer"}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate lowercase flex items-center gap-1 mt-1">
                <Mail size={10} /> {user?.email}
              </p>
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest mt-1 italic">Gate Control • On Duty</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-all font-black text-[11px] uppercase tracking-widest">
            <LogOut size={16} /> End Shift (Logout)
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-10 text-left">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">System Terminal</h2>
            <p className="text-slate-400 font-black mt-1 uppercase text-[10px] tracking-widest italic leading-none">Gate Entry & Exit Authorization</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest">System Live</span>
          </div>
        </header>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
          <StatBox icon={<Clock className="text-orange-500"/>} label="Expected Today" count={visitors.filter(v => v.status === 'Pending').length} color="orange" />
          <StatBox icon={<Activity className="text-blue-500"/>} label="Currently Inside" count={visitors.filter(v => v.status === 'Checked-In').length} color="blue" />
          <StatBox icon={<CheckCircle2 className="text-green-500"/>} label="Total Clearances" count={visitors.filter(v => v.status === 'Checked-Out').length} color="green" />
        </div>

        {/* ACCESS GATEWAY / SCANNER */}
        <section className="mb-10 text-left">
          <div className="bg-blue-600 p-10 rounded-[3rem] shadow-xl shadow-blue-200 relative overflow-hidden text-white">
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-2">
                  <QrCode size={20} className="text-blue-200"/>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">Validation Hub</h2>
               </div>
               <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Enter VMS Pass Code to verify visitor identity</p>
               
               <form onSubmit={handleVerifySearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
                  <input 
                    type="text"
                    placeholder="Enter Code (e.g. VMS-XXXXX)..."
                    className="w-full bg-blue-700/40 border border-blue-400/30 p-5 pl-16 rounded-2xl outline-none focus:bg-blue-700/60 transition-all text-sm font-black uppercase tracking-[0.2em] placeholder:text-blue-300/50"
                    value={vmsSearch}
                    onChange={(e) => setVmsSearch(e.target.value)}
                  />
                </div>
                <button type="submit" className="bg-white text-blue-600 px-12 py-5 rounded-2xl font-black hover:bg-slate-50 transition-all uppercase text-xs tracking-widest shadow-lg">
                  Verify Credentials
                </button>
              </form>
            </div>

            {/* Error/Success Feedback (Timer Linked) */}
            {message.text && (
               <div className={`mt-6 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 ${message.type === 'error' ? 'bg-red-500/30 text-white border border-red-400/30' : 'bg-green-500/30 text-white border border-green-400/30'}`}>
                  {message.type === 'error' ? <X size={14}/> : <CheckCircle2 size={14}/>}
                  {message.text}
               </div>
            )}
          </div>

          {/* Validation Result Card */}
          {scannedVisitor && (
            <div className="mt-8 bg-white border border-blue-100 p-12 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
               <div className="md:col-span-2">
                  <div className="flex items-center gap-8 mb-10">
                     <div className="w-24 h-24 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-xl">
                        {scannedVisitor.name.charAt(0)}
                     </div>
                     <div>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1 block italic text-left">Identity Verified</span>
                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">{scannedVisitor.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">VMS Valid Pass Holder</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 text-left">
                     <ResultField label="ID / Passport" value={scannedVisitor.idNumber} />
                     <ResultField label="Visitor Purpose" value={scannedVisitor.purpose} />
                     <ResultField label="VMS Pass Code" value={scannedVisitor.qrCode} />
                     <ResultField label="Authorization" value="Approved by Resident" />
                  </div>
               </div>

               <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 block text-center">Destination Details</label>
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md text-blue-600 font-black text-xl mb-4 border border-slate-100">
                    {scannedVisitor.tenantId?.unitNumber || "!"}
                  </div>
                  <p className="font-black text-slate-900 text-sm uppercase italic">Unit {scannedVisitor.tenantId?.unitNumber}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Host: {scannedVisitor.tenantId?.name}</p>
                  
                  <div className="mt-auto w-full">
                    {scannedVisitor.status === 'Pending' ? (
                      <button 
                        onClick={() => handleCheckIn(scannedVisitor._id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-black transition-all shadow-xl shadow-green-100 uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={18}/> Authorize Entry
                      </button>
                    ) : (
                      <div className="text-center py-5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                         Pass Session Closed
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </section>

        {/* VISITOR REGISTRY */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden text-left">
          <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Registry • {activeFilter} Sessions</h3>
             <button onClick={fetchVisitors} className="p-3 text-slate-400 hover:text-blue-600 transition-all bg-white rounded-xl shadow-sm"><Activity size={18}/></button>
          </div>
          
          <div className="divide-y divide-slate-50">
            {filteredList.length === 0 ? (
               <div className="py-24 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.4em]">No activity recorded</div>
            ) : (
              filteredList.map(v => (
                <div key={v._id} className="px-10 py-8 flex items-center justify-between group hover:bg-blue-50/20 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${
                      v.status === 'Checked-In' ? 'bg-green-50 text-green-600' : 
                      v.status === 'Checked-Out' ? 'bg-slate-100 text-slate-300' : 'bg-blue-50 text-blue-400'
                    }`}>
                      {v.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase text-sm group-hover:text-blue-600 transition-colors">{v.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Unit {v.tenantId?.unitNumber} • Host: {v.tenantId?.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Check Log</p>
                        <p className="text-[10px] font-bold text-slate-700">{v.status === 'Pending' ? 'Awaiting Arrival' : formatTime(v.checkInTime)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedVisitor(v)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all"><Info size={18} /></button>
                      {v.status === 'Checked-In' && (
                        <button onClick={() => handleCheckOut(v._id)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm">
                          Check-Out
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* DETAILS MODAL */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 text-left animate-in zoom-in-95 duration-200 relative">
            <button onClick={() => setSelectedVisitor(null)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X size={28}/></button>
            <div className="mb-10 text-center">
               <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-xl">{selectedVisitor.name.charAt(0)}</div>
               <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{selectedVisitor.name}</h3>
               <span className="inline-block mt-2 text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">{selectedVisitor.status} LOG</span>
            </div>
            <div className="space-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
              <ModalField label="Identity Ref" value={selectedVisitor.idNumber} />
              <ModalField label="Visit Reason" value={selectedVisitor.purpose} />
              <ModalField label="Host Details" value={`Unit ${selectedVisitor.tenantId?.unitNumber} (${selectedVisitor.tenantId?.name})`} />
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200/50">
                <ModalField label="Entry Time" value={formatTime(selectedVisitor.checkInTime)} />
                <ModalField label="Exit Time" value={formatTime(selectedVisitor.checkOutTime)} />
              </div>
            </div>
            <button onClick={() => setSelectedVisitor(null)} className="w-full mt-10 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl">Dismiss Details</button>
          </div>
        </div>
      )}
    </div>
  );
};

// HELPERS
const SidebarItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-sm transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-2' : 'hover:bg-slate-800/50 hover:text-white'}`}>
    {icon} {label}
  </button>
);

const StatBox = ({ icon, label, count, color }) => (
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
    <div className={`p-5 rounded-2xl bg-${color}-50`}>{icon}</div>
    <div><p className="text-3xl font-black text-slate-900 leading-none">{count}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 italic leading-none">{label}</p></div>
  </div>
);

const ResultField = ({ label, value }) => (
  <div className="text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
    <p className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight">{value}</p>
  </div>
);

const ModalField = ({ label, value }) => (
  <div className="text-left">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none italic">{label}</p>
    <p className="font-bold text-slate-800 text-sm uppercase">{value || 'Not Logged'}</p>
  </div>
);

export default GuardDashboard;