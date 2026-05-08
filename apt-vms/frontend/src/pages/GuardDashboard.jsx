import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { 
  ShieldCheck, Search, UserCheck, Clock, 
  LogOut, X, Info, History, Activity, QrCode, 
  CheckCircle2, Mail, Camera, CameraOff, CalendarDays
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
  
  // Scanner Management
  const [isScanning, setIsScanning] = useState(false);
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

  // 2. CENTRALIZED VERIFICATION LOGIC
  const processVerification = async (codeToVerify) => {
    const code = codeToVerify || vmsSearch;
    if (!code || !code.trim()) return;

    setMessage({ type: '', text: '' });
    
    try {
      const { data } = await API.get(`/visitors/scan/${code.trim()}`);
      if (data.success) {
        setScannedVisitor(data.data);
        setMessage({ type: 'success', text: 'Pass Identity Authenticated' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Invalid Pass or Unknown Visitor' });
      setScannedVisitor(null);
    }
  };

  // 3. HARDWARE CONTROL (Prevents White Screen Crash)
  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) { console.error("Scanner Stop Failed:", err); }
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    setIsScanning(true);
    setScannedVisitor(null);
    
    // Timeout ensures React draws the #reader div before the library looks for it
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" }, 
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setVmsSearch(decodedText);
            stopScanner(); // STOP camera immediately on success to prevent DOM race condition
            processVerification(decodedText);
          },
          () => {} // Silent ignore scanner noise
        );
      } catch (err) {
        console.error("Camera Hardware Error:", err);
        setIsScanning(false);
      }
    }, 200);
  };

  // Cleanup on Tab Change or Logout
  useEffect(() => {
    return () => { if (scannerRef.current) stopScanner(); };
  }, []);

  const handleCheckIn = async (id) => {
    try {
      await API.put(`/visitors/checkin/${id}`);
      setScannedVisitor(null);
      setVmsSearch('');
      setMessage({ type: 'success', text: 'Entry Authorized Successfully' });
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
  
  // DATE FORMATTER (Handles overnight stays)
  const formatDateTime = (t) => {
    if(!t) return '---';
    return new Date(t).toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900 text-left">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-80 bg-slate-900 text-slate-300 flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-8 flex items-center gap-3 text-white border-b border-slate-800/50">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg"><ShieldCheck size={24} /></div>
          <h1 className="text-xl font-extrabold tracking-tight uppercase italic leading-none">
            SecureNest <span className="text-blue-500 not-italic lowercase">guard</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-8">
          <SidebarItem active={activeFilter === 'Pending'} onClick={() => setActiveFilter('Pending')} icon={<Clock size={18}/>} label="Expected Today" />
          <SidebarItem active={activeFilter === 'Checked-In'} onClick={() => setActiveFilter('Checked-In')} icon={<UserCheck size={18}/>} label="Currently Inside" />
          <SidebarItem active={activeFilter === 'Checked-Out'} onClick={() => setActiveFilter('Checked-Out')} icon={<History size={18}/>} label="Cleared History" />
        </nav>
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 mb-6 px-2 text-left">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg">{user?.name?.charAt(0) || 'G'}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate uppercase leading-none">{user?.name || "Officer"}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-1.5">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold text-[11px] uppercase tracking-widest"><LogOut size={16} /> End Shift</button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-10 text-left">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase italic leading-none">System Terminal</h2>
            <p className="text-slate-400 font-semibold mt-2 uppercase text-[10px] tracking-widest italic">Verification Portal</p>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
          <StatBox icon={<Clock className="text-orange-500"/>} label="Expected" count={visitors.filter(v => v.status === 'Pending').length} color="orange" />
          <StatBox icon={<Activity className="text-blue-500"/>} label="Inside" count={visitors.filter(v => v.status === 'Checked-In').length} color="blue" />
          <StatBox icon={<CheckCircle2 className="text-green-500"/>} label="Cleared" count={visitors.filter(v => v.status === 'Checked-Out').length} color="green" />
        </div>

        {/* VALIDATION ZONE */}
        <section className="mb-10 text-left">
          <div className="bg-blue-600 p-10 rounded-[3rem] shadow-xl shadow-blue-200 relative overflow-hidden text-white">
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2"><QrCode size={20} className="text-blue-200"/><h2 className="text-2xl font-bold uppercase tracking-tight italic">Validation Hub</h2></div>
                    <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Scan QR Pass or enter identity code</p>
                  </div>
                  <button onClick={isScanning ? stopScanner : startScanner} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg ${isScanning ? 'bg-red-500 text-white' : 'bg-white text-blue-600'}`}>
                    {isScanning ? <><CameraOff size={16}/> Close Camera</> : <><Camera size={16}/> Use Camera</>}
                  </button>
               </div>

               {isScanning && (
                 <div className="mb-8 overflow-hidden rounded-[2.5rem] border-4 border-white/20 bg-black aspect-video max-w-xl mx-auto shadow-2xl relative">
                    <div id="reader" className="w-full"></div>
                    <div className="absolute inset-0 border-2 border-blue-400/40 pointer-events-none animate-pulse"></div>
                 </div>
               )}
               
               <form onSubmit={(e) => { e.preventDefault(); processVerification(); }} className="flex flex-col md:flex-row gap-4">
                <input type="text" placeholder="Enter VMS Code..." className="flex-1 bg-blue-700/40 border border-blue-400/30 p-5 rounded-2xl outline-none text-sm font-bold uppercase tracking-widest placeholder:text-blue-300/50" value={vmsSearch} onChange={(e) => setVmsSearch(e.target.value)} />
                <button type="submit" className="bg-white text-blue-600 px-12 py-5 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Verify</button>
              </form>
            </div>
            {message.text && (
               <div className={`mt-6 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${message.type === 'error' ? 'bg-red-500/30 text-white' : 'bg-green-500/30 text-white'}`}>
                  {message.text}
               </div>
            )}
          </div>

          {/* VERIFICATION CARD - UPDATED WITH DISMISS & DATE */}
          {scannedVisitor && (
            <div className="mt-8 bg-white border border-blue-100 p-12 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 grid grid-cols-1 md:grid-cols-3 gap-12 text-left relative">
               <button 
                onClick={() => { setScannedVisitor(null); setVmsSearch(''); }}
                className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-600 transition-colors"
               >
                 <X size={24} />
               </button>

               <div className="md:col-span-2">
                  <div className="flex items-center gap-8 mb-10">
                     <div className="w-24 h-24 rounded-[4xl] bg-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">{scannedVisitor.name?.charAt(0)}</div>
                     <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest italic mb-1 block">Identity Verified</span>
                        <h3 className="text-4xl font-extrabold text-slate-900 uppercase tracking-tight">{scannedVisitor.name}</h3>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                     <DetailField label="ID Reference" value={scannedVisitor.idNumber} />
                     <DetailField label="Purpose" value={scannedVisitor.purpose} />
                     <DetailField label="VMS Pass" value={scannedVisitor.qrCode} />
                     <DetailField label="Entry Logic" value={scannedVisitor.checkInTime ? formatDateTime(scannedVisitor.checkInTime) : "Awaiting Check-in"} />
                  </div>
               </div>
               <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Unit Destination</label>
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md text-blue-600 font-bold text-xl mb-4 border border-slate-100">
                    {scannedVisitor.tenantId?.unitNumber || "!"}
                  </div>
                  <p className="font-extrabold text-slate-900 text-sm uppercase italic leading-none">Unit {scannedVisitor.tenantId?.unitNumber}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 italic">Host: {scannedVisitor.tenantId?.name}</p>
                  <div className="mt-8 w-full pt-4">
                    {scannedVisitor.status === 'Pending' ? (
                      <button onClick={() => handleCheckIn(scannedVisitor._id)} className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all"><CheckCircle2 size={18}/> Authorize Entry</button>
                    ) : (
                      <div className="text-center py-5 bg-white border border-slate-200 rounded-2xl text-[10px] font-extrabold text-slate-400 uppercase tracking-widest italic">Pass Session Closed</div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </section>

        {/* LOG REGISTRY */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden text-left">
          <div className="divide-y divide-slate-50">
            {filteredList.map(v => (
              <div key={v._id} className="px-10 py-8 flex items-center justify-between group hover:bg-blue-50/20 transition-all">
                <div className="flex items-center gap-6 text-left">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg ${v.status === 'Checked-In' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-300'}`}>{v.name?.charAt(0)}</div>
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-sm group-hover:text-blue-600 transition-colors">{v.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Unit {v.tenantId?.unitNumber} • Host: {v.tenantId?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Last Check</p>
                     <p className="text-[10px] font-bold text-slate-800">{v.status === 'Pending' ? '---' : formatDateTime(v.checkInTime)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedVisitor(v)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"><Info size={18} /></button>
                    {v.status === 'Checked-In' && (<button onClick={() => handleCheckOut(v._id)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase shadow-sm transition-all">Check-Out</button>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODAL WITH DATES */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 text-left animate-in zoom-in-95 relative">
            <button onClick={() => setSelectedVisitor(null)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><X size={28}/></button>
            <div className="mb-10 text-center">
               <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-xl">{selectedVisitor.name?.charAt(0)}</div>
               <h3 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">{selectedVisitor.name}</h3>
               <span className="inline-block mt-2 text-[9px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">{selectedVisitor.status} LOG</span>
            </div>
            <div className="space-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
              <DetailField label="ID Reference" value={selectedVisitor.idNumber} />
              <DetailField label="Host Details" value={`Unit ${selectedVisitor.tenantId?.unitNumber} (${selectedVisitor.tenantId?.name})`} />
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Check-In: <span className="text-slate-800 font-bold block mt-1 normal-case">{formatDateTime(selectedVisitor.checkInTime)}</span></div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Check-Out: <span className="text-slate-800 font-bold block mt-1 normal-case">{formatDateTime(selectedVisitor.checkOutTime)}</span></div>
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
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
    <div className={`p-5 rounded-2xl bg-${color}-50`}>{icon}</div>
    <div className="text-left"><p className="text-3xl font-extrabold text-slate-900 leading-none">{count}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 leading-none italic">{label}</p></div>
  </div>
);

const DetailField = ({ label, value }) => (
  <div className="text-left">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none italic">{label}</p>
    <p className="font-bold text-slate-800 text-sm uppercase">{value || 'N/A'}</p>
  </div>
);

export default GuardDashboard;