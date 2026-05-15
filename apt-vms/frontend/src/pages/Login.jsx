import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogIn, ShieldCheck, Home, Eye, EyeOff } from 'lucide-react'; // Added Eye icons
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Track password visibility
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 relative overflow-hidden font-sans">
      {/* Huge Background Building Picture with Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.06]">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070" 
            alt="Modern Architecture" 
            className="w-full h-full object-cover grayscale"
          />
        </div>
        {/* Subtle Blue Gradient Overlay to make the background pop */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/15 via-transparent to-indigo-600/5" />
      </div>

      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all group italic z-10"
      >
        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 group-hover:shadow-md group-active:scale-95 transition-all">
          <Home size={18} />
        </div>
        Back to Home
      </Link>

      {/* Existing Login Card Content */}
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-200 p-10 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-blue-600 rounded-2xl text-white mb-4 shadow-xl shadow-blue-100">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-slate-900">
            SecureNest <span className="text-blue-600 not-italic lowercase">system</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 italic">Management Terminal</p>
        </div>

        {error && <p className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-6 border-l-4 border-red-500 italic leading-tight">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-left">
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 italic">
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="admin@securenest.com"
              className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              required
            />
          </div>

          <div className="text-left relative">
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 italic">
              Access Password
            </label>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••"
              className="block w-full px-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-9.5 text-slate-300 hover:text-blue-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 py-4 px-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl transition-all ${
              loading 
                ? 'bg-blue-400 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 active:scale-95'
            }`}
          >
            <LogIn size={18} />
            {loading ? 'Authenticating...' : 'Login System'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Need an account? <Link to="/register" className="text-blue-600 hover:underline ml-1">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;