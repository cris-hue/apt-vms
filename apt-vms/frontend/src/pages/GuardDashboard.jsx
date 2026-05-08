import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { 
  ShieldCheck, Search, UserCheck, Clock, 
  LogOut, X, Info, History, Activity, QrCode, 
  CheckCircle2, Camera, CameraOff, ShieldAlert
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode'; 

const GuardDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [visitors, setVisitors] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Pending');
  const [vmsSearch, setVmsSearch] = useState('');
  const [scannedVisitor, setScannedVisitor] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null); 
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Hub & Scanner State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scannerRef = useRef(null);

  // 1. AUTO-CLEAR FEEDBACK
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchVisitors = async () => {
    try {
      const { data } = await API.get('/visitors/all');
      setVisitors(data.data || []);
    } catch (err) { console.error("Sync Error:", err); }
  };

  useEffect(() => { fetchVisitors(); }, []);

  // 2. VERIFICATION LOGIC
  const processVerification = async (codeToVerify) => {
    const code = codeToVerify || vmsSearch;
    if (!code || !code.trim()) return;
    setMessage({ type: '', text: '' });
    try {
      const { data } = await API.get(`/visitors/scan/${code.trim()}`);
      if (data.success) {
        setScannedVisitor(data.data);
        setMessage({ type: 'success', text: 'Identity Authenticated' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Invalid Pass or Unknown Visitor' });
      setScannedVisitor(null);
    }
  };

  // 3. HARDWARE CONTROL
  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) { console.error(err); }
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    setIsScanning(true);
    setScannedVisitor(null);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" }, 
          { fps: 15, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setVmsSearch(decodedText);
            stopScanner();
            processVerification(decodedText);
          },
          () => {} 
        );
      } catch (err) {
        setIsScanning(false);
      }
    }, 150);
  };

  const handleCheckIn = async (id) => {
    try {
      await API.put(`/visitors/checkin/${id}`);
      setScannedVisitor(null);
      setVmsSearch('');
      setShowVerifyModal(false); 
      fetchVisitors();
    } catch (err) { alert("Check-in failed"); }
  };

  const handleCheckOut = async (id) => {
    try {
      await API.put(`/visitors/checkout/${id}`);
      fetchVisitors();
      alert("Visitor Cleared for Exit");
    } catch (err) { alert("Check-out failed"); }
  };

  const filteredList = visitors.filter(v => v.status === activeFilter);
  const formatDateTime = (t) => t ? new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---';

  return (
    /* RESPONSIVE LAYOUT: Sidebar hidden on mobile, shown on desktop */
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900 text-left">
      
      {/* --- SIDEBAR (Permanent on Desktop, Overlay on Mobile) --- */}
      <aside className={`w-full md:w-80 bg-slate-900 text-slate-300 flex flex-col ${sidebarOpen ? 'fixed inset-0 z-100 md:sticky md:inset-auto md:z-0' : 'hidden md:flex'} md:top-0 md:h-screen shadow-2xl transition-all`}>
        <div className="p-8 flex items-center justify-between gap-3 text-white border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg"><ShieldCheck size={24} /></div>
            <h1 className="text-xl font-extrabold tracking-tight uppercase italic leading-none">
              SecureNest <span className="text-blue-500 not-italic lowercase">guard</span>
            </h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-800 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-4 md:p-4 mt-4">
            <button 
                onClick={() => setShowVerifyModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 md:p-4 rounded-2xl font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
            >
                <QrCode size={18} /> Verify New Visitor
            </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4 text-left">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Operations Hub</p>
          <SidebarItem active={activeFilter === 'Pending'} onClick={() => { setActiveFilter('Pending'); setSidebarOpen(false); }} icon={<Clock size={18}/>} label="Expected Today" />
          <SidebarItem active={activeFilter === 'Checked-In'} onClick={() => { setActiveFilter('Checked-In'); setSidebarOpen(false); }} icon={<UserCheck size={18}/>} label="Currently Inside" />
          <SidebarItem active={activeFilter === 'Checked-Out'} onClick={() => { setActiveFilter('Checked-Out'); setSidebarOpen(false); }} icon={<History size={18}/>} label="Cleared History" />
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg">{user?.name?.charAt(0) || 'G'}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate uppercase leading-none">{user?.name || "Officer"}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-1.5">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold text-[11px] uppercase tracking-widest"><LogOut size={16} /> End Shift</button>
        </div>
      </aside>

      {/* --- MAIN CONTENT (Responsive) --- */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
        <header className="flex justify-between items-center mb-8 md:mb-10 text-left">
          <div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight uppercase italic leading-none">Security Deck</h2>
            <p className="text-slate-400 font-semibold mt-2 uppercase text-[10px] tracking-widest italic leading-none">Live Premise Activity</p>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><ShieldCheck size={24} /></button>
        </header>

        {/* STATS (Responsive Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10 text-left">
          <StatBox icon={<Clock className="text-orange-500"/>} label="Expected" count={visitors.filter(v => v.status === 'Pending').length} color="orange" />
          <StatBox icon={<Activity className="text-blue-500"/>} label="Inside" count={visitors.filter(v => v.status === 'Checked-In').length} color="blue" />
          <StatBox icon={<CheckCircle2 className="text-green-500"/>} label="Total Cleared" count={visitors.filter(v => v.status === 'Checked-Out').length} color="green" />
        </div>

        {/* REGISTRY LOGS */}
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden text-left">
          <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 italic">Registry Logs • {activeFilter}</h3>
             <button onClick={fetchVisitors} className="p-2 md:p-3 text-slate-400 hover:text-blue-600 transition-all bg-white rounded-xl shadow-sm"><Activity size={18}/></button>
          </div>
          <div className="divide-y divide-slate-50">
            {filteredList.map(v => (
              <div key={v._id} className="px-6 md:px-10 py-6 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 group hover:bg-blue-50/20 transition-all">
                <div className="flex items-center gap-4 md:gap-6 text-left">
                  <div className={`w-12 md:w-14 h-12 md:h-14 rounded-2xl flex items-center justify-center font-bold text-lg ${v.status === 'Checked-In' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-300'}`}>{v.name?.charAt(0)}</div>
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-sm group-hover:text-blue-600 transition-colors">{v.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Unit {v.tenantId?.unitNumber} • Host: {v.tenantId?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
                  <div className="text-right flex-1 md:flex-initial">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none mb-1">Check Log</p>
                    <p className="text-[10px] font-bold text-slate-800">{v.status === 'Pending' ? '---' : formatDateTime(v.checkInTime)}</p>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={() => setSelectedVisitor(v)} className="p-2 md:p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"><Info size={18} /></button>
                    {v.status === 'Checked-In' && (<button onClick={() => handleCheckOut(v._id)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 md:px-6 py-2 md:py-3 rounded-xl text-[10px] font-bold uppercase shadow-sm transition-all whitespace-nowrap">Check-Out</button>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* --- VERIFICATION MODAL HUB (Responsive) --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 md:p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full md:w-auto md:max-w-4xl rounded-[2rem] md:rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col md:flex-row text-left h-screen md:h-auto md:max-h-[90vh]">
                <button 
                    onClick={() => { stopScanner(); setShowVerifyModal(false); setScannedVisitor(null); setVmsSearch(''); }}
                    className="absolute top-4 md:top-10 right-4 md:right-10 z-210 p-3 bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-all"
                >
                    <X size={24} />
                </button>

                {/* Left Column */}
                <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col overflow-y-auto md:overflow-visible">
                    <div className="flex items-center gap-3 mb-8 md:mb-10">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg"><QrCode size={24}/></div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight uppercase italic leading-none">Access Hub</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 italic">Identity Verification</p>
                        </div>
                    </div>

                    <div className={`flex-1 flex flex-col space-y-4 md:space-y-6 ${isScanning ? 'justify-between' : ''}`}>
                        <div className="space-y-4 md:space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={22} />
                                <input 
                                    type="text" 
                                    placeholder="ENTER PASS CODE..." 
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 md:p-6 pl-12 md:pl-16 rounded-[2.5rem] outline-none focus:bg-white focus:border-blue-600/20 transition-all text-sm font-bold uppercase tracking-widest placeholder:text-slate-300"
                                    value={vmsSearch}
                                    onChange={(e) => setVmsSearch(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                                <button 
                                    onClick={isScanning ? stopScanner : startScanner}
                                    className={`flex-1 flex items-center justify-center gap-3 p-4 md:p-6 rounded-[4xl] font-bold uppercase text-[10px] tracking-widest shadow-lg transition-all ${isScanning ? 'bg-red-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                                >
                                    {isScanning ? <><CameraOff size={20}/> Stop Camera</> : <><Camera size={20}/> Launch Scanner</>}
                                </button>
                                <button onClick={() => processVerification()} className="bg-blue-600 text-white px-6 md:px-10 py-4 md:py-6 rounded-[4xl] font-bold uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-lg active:scale-95 transition-all whitespace-nowrap">Verify Manual</button>
                            </div>
                        </div>

                        {isScanning && (
                            <div className="flex-1 min-h-[300px] md:min-h-auto overflow-hidden rounded-[2rem] border-4 md:border-8 border-slate-50 bg-black shadow-2xl relative">
                                <div id="reader" className="w-full h-full"></div>
                                <div className="absolute inset-0 border-2 border-blue-400/20 pointer-events-none">
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="w-full md:w-[400px] bg-slate-50 p-8 md:p-12 flex flex-col justify-center">
                    {scannedVisitor ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center mb-8 md:mb-10">
                                <div className="w-20 md:w-24 h-20 md:h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl text-blue-600 text-3xl md:text-4xl font-extrabold mb-4 md:mb-6 border border-white">
                                    {scannedVisitor.name?.charAt(0)}
                                </div>
                                <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">{scannedVisitor.name}</h3>
                                <span className="inline-block mt-2 px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-bold uppercase tracking-widest italic">Authorized</span>
                            </div>
                            <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
                                <DetailField label="ID Reference" value={scannedVisitor.idNumber} />
                                <DetailField label="Host Unit" value={`Unit ${scannedVisitor.tenantId?.unitNumber}`} />
                                <DetailField label="Resident Name" value={scannedVisitor.tenantId?.name} />
                            </div>
                            {scannedVisitor.status === 'Pending' ? (
                                <button onClick={() => handleCheckIn(scannedVisitor._id)} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 md:py-6 rounded-[4xl] font-bold uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all"><CheckCircle2 size={20}/> Authorize Entry</button>
                            ) : (
                                <div className="p-4 md:p-6 bg-white border border-slate-200 rounded-[4xl] text-center">
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] italic">Session Completed</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center opacity-30">
                            <ShieldCheck size={80} className="mx-auto text-slate-300 mb-6" strokeWidth={1}/>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Waiting for Auth</p>
                        </div>
                    )}
                </div>
           </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2rem] md:rounded-[4rem] shadow-2xl p-8 md:p-12 text-left animate-in zoom-in-95 relative">
            <button onClick={() => setSelectedVisitor(null)} className="absolute top-6 md:top-10 right-6 md:right-10 text-slate-300 hover:text-slate-900"><X size={28}/></button>
            <div className="mb-8 md:mb-10 text-center">
               <div className="w-16 md:w-20 h-16 md:h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-2xl md:text-3xl font-bold mx-auto mb-4 md:mb-6 shadow-xl">{selectedVisitor.name?.charAt(0)}</div>
               <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 uppercase tracking-tight">{selectedVisitor.name}</h3>
               <span className="inline-block mt-2 text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">{selectedVisitor.status} LOG</span>
            </div>
            <div className="space-y-4 md:space-y-6 bg-slate-50 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100">
              <DetailField label="ID Number" value={selectedVisitor.idNumber} />
              <DetailField label="Apartment" value={`Unit ${selectedVisitor.tenantId?.unitNumber} (${selectedVisitor.tenantId?.name})`} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 md:pt-6 border-t border-slate-200">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none text-left">Arrival: <span className="text-slate-800 font-bold block mt-1.5 normal-case">{formatDateTime(selectedVisitor.checkInTime)}</span></div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none text-left">Exit: <span className="text-slate-800 font-bold block mt-1.5 normal-case">{formatDateTime(selectedVisitor.checkOutTime)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// HELPERS
const SidebarItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-sm transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-2' : 'hover:bg-slate-800/50 hover:text-white'}`}>{icon} {label}</button>
);

const StatBox = ({ icon, label, count, color }) => (
  <div className="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6">
    <div className={`p-5 rounded-2xl bg-${color}-50`}>{icon}</div>
    <div className="text-left"><p className="text-3xl font-extrabold text-slate-900 leading-none">{count}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 leading-none italic">{label}</p></div>
  </div>
);

const DetailField = ({ label, value }) => (
  <div className="text-left">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none italic">{label}</p>
    <p className="font-bold text-slate-800 text-sm uppercase">{value || 'N/A'}</p>
  </div>
);

export default GuardDashboard;