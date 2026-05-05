import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, PlusCircle, History, ShieldCheck } from 'lucide-react';
import InviteModal from '../components/InviteModal';

const TenantDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- Header --- */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-blue-600">
          <ShieldCheck size={28} />
          <h1 className="text-xl font-black tracking-tighter uppercase italic">
            SecureNest <span className="text-slate-400 font-medium lowercase italic">tenant</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 border-r pr-6 border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-none">{user?.name || "Tenant"}</p>
              <p className="text-[10px] font-medium text-blue-600 uppercase tracking-widest mt-1">
                Unit: {user?.unitNumber || 'N/A'}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black">
              {user?.name?.charAt(0).toUpperCase() || <User size={20} />}
            </div>
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold transition-colors text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <header className="mb-10">
          {/* Main Title Change */}
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tenant Dashboard</h2>
          <p className="text-slate-500 font-medium">Generate and manage secure visitor entry passes.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div 
            onClick={() => setIsInviteOpen(true)} 
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
               <PlusCircle size={32} />
            </div>
            <h3 className="font-bold text-xl text-slate-800 mb-2">Invite Visitor</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Instantly create a secure QR pass for your guests.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
               <History size={32} />
            </div>
            <h3 className="font-bold text-xl text-slate-800 mb-2">Pass History</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Review your previous visitor activity and logs.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
               <User size={32} />
            </div>
            <h3 className="font-bold text-xl text-slate-800 mb-2">My Profile</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Update your account and contact information.</p>
          </div>
        </div>
      </main>

      <InviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        user={user} 
      />
    </div>
  );
};

export default TenantDashboard;