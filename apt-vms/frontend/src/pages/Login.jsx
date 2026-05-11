import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogIn, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-600 rounded-lg text-white mb-3">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800">SecureNest</h2>
          <p className="text-slate-500 mt-2 text-center text-sm">
            Apartment Visitor Management System
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="name@example.com"
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-slate-700">
                Password
              </label>
            </div>
            <input 
              type="password" 
              placeholder="••••••••"
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-white transition-all ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            <LogIn size={20} />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            {/* Changed span to Link below */}
            Need an account? <Link to="/register" className="text-blue-600 font-semibold cursor-pointer hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;