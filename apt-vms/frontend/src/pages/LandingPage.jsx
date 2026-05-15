import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Building2, ShieldCheck, Users, CheckCircle2, ArrowRight, Shield } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        const user = JSON.parse(userStr);
        if (user && Object.keys(user).length > 0) {
          if (user.role === 'admin') navigate('/admin');
          else if (user.role === 'guard') navigate('/guard-dashboard');
          else navigate('/tenant-dashboard');
        }
      }
    } catch (error) {
      localStorage.removeItem('user');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans relative overflow-hidden">
      {/* Huge Background Building Picture */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.06]">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070" 
            alt="Modern Architecture" 
            className="w-full h-full object-cover grayscale"
          />
        </div>
        {/* Subtle Blue Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/8 via-transparent to-indigo-600/3" />
      </div>

      {/* Header */}
      <header className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg shadow-lg text-white shrink-0">
            <ShieldCheck size={24} className="md:w-7 md:h-7" />
          </div>
          <div className="truncate">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic leading-none truncate">
              SecureNest <span className="hidden sm:inline text-blue-600 not-italic lowercase">system</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Management Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <Link
            to="/login"
            className="rounded-xl border border-slate-200 bg-white px-4 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm transition hover:shadow-md active:scale-95"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-blue-600 px-4 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
          >
            Register
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10 relative z-10">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 md:px-4 py-1.5 md:py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-600 italic border border-blue-100">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" /> Live apartment visitor tracking
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-[0.9] sm:text-7xl text-slate-900">
                Your Property <br />
                <span className="text-blue-600">Securely</span> Managed
              </h2>
              <p className="max-w-xl text-sm font-bold leading-relaxed text-slate-500 uppercase tracking-tight">
                Manage visitor access, approve guests instantly, and keep your apartment community secure with the modern visitor management tool built for admins, tenants, and guards.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition hover:bg-slate-800 active:scale-95"
              >
                Get Started <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm transition hover:shadow-md active:scale-95"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 bg-white p-6 md:p-10 shadow-xl shadow-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 text-slate-900">
              <Building2 size={200} />
            </div>
            <div className="space-y-6">
              <div className="rounded-4xl bg-slate-50 p-8 border border-slate-100">
                <p className="text-[10px] uppercase tracking-widest font-black text-blue-600 italic">Visitor Portal</p>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-tighter text-slate-900 italic">Fast approval flow</h3>
                <p className="mt-3 text-xs font-bold text-slate-500 leading-relaxed uppercase">
                  Approve or reject visitor requests in seconds. Generate secure guest passes and let your guard team verify visitor details instantly.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-4xl bg-white p-6 border border-slate-100 shadow-sm">
                  <CheckCircle2 className="text-green-500 mb-3" size={24} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Smart tracking</p>
                  <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase leading-tight">Know who enters and exits your building at a glance.</p>
                </div>
                <div className="rounded-4xl bg-white p-6 border border-slate-100 shadow-sm">
                  <Shield className="text-blue-500 mb-3" size={24} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Multi-role</p>
                  <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase leading-tight">Separate dashboards for admins, tenants, and guards.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2.5rem] bg-white p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
            <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center text-slate-900 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 italic">Admin Control</h3>
            <p className="mt-3 text-xs font-bold text-slate-400 uppercase leading-relaxed">
              Configure community access, review visitor reports, and keep visitor history organized in one place.
            </p>
          </div>
          <div className="rounded-[2.5rem] bg-white p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
            <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center text-slate-900 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 italic">Tenant Convenience</h3>
            <p className="mt-3 text-xs font-bold text-slate-400 uppercase leading-relaxed">
              Invite guests, manage visitor requests, and monitor arrival status from your dashboard.
            </p>
          </div>
          <div className="rounded-[2.5rem] bg-white p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
            <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center text-slate-900 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 italic">Guard Verification</h3>
            <p className="mt-3 text-xs font-bold text-slate-400 uppercase leading-relaxed">
              Validate visitor passes quickly and ensure only authorized guests enter your property.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
