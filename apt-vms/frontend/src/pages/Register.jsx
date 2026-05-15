import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { UserPlus, ShieldCheck, Lock, Mail, User, Phone, Home, Loader2, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', unitNumber: '', password: '', confirmPassword: '', role: 'tenant'
  });
  const [fieldErrors, setFieldErrors] = useState({ email: '', phone: '' });
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [takenUnits, setTakenUnits] = useState([]);
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

  const unitOptions = Array.from({ length: 100 }, (_, i) => `A${(i + 1).toString().padStart(3, '0')}`);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time validation
    if (name === 'email') {
      if (/[A-Z]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, email: 'Email cannot contain capital letters.' }));
      } else {
        setFieldErrors(prev => ({ ...prev, email: '' }));
      }
    } else if (name === 'phone') {
      if (/[^\d]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, phone: 'Phone number can only contain digits.' }));
      } else if (value.length > 0 && value.length !== 10) {
        setFieldErrors(prev => ({ ...prev, phone: 'Phone number must be exactly 10 digits.' }));
      } else {
        setFieldErrors(prev => ({ ...prev, phone: '' }));
      }
    }
  };

  useEffect(() => {
    const fetchTakenUnits = async () => {
      try {
        const { data } = await API.get('/auth/taken-units');
        setTakenUnits(data.units || []);
      } catch {
        setTakenUnits([]);
      }
    };
    fetchTakenUnits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (fieldErrors.email || fieldErrors.phone) {
      return setError("Please fix the real-time validation errors.");
    }
    if (/[A-Z]/.test(formData.email)) {
      return setError("Email cannot contain capital letters.");
    }
    if (/[^\d]/.test(formData.phone) || formData.phone.length !== 10) {
      return setError("Phone number must be exactly 10 digits and contain no letters.");
    }
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (formData.role === 'tenant' && !formData.unitNumber) {
      return setError('Please select an apartment unit.');
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      await API.post('/auth/register', submitData);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-[#F8FAFC] px-4 py-20 md:py-12 relative overflow-hidden font-sans">
      {/* Background Building Picture with Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.06]">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070" 
            alt="Modern Architecture" 
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/15 via-transparent to-indigo-600/5" />
      </div>
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all group italic z-30"
      >
        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 group-hover:shadow-md group-active:scale-95 transition-all">
          <Home size={18} />
        </div>
        Back to Home
      </Link>

      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-200 text-center max-w-md relative z-10">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-green-100 shadow-lg shadow-green-50">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-slate-900 mb-2">
          Request <span className="text-blue-600">Sent</span>
        </h2>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-10 italic leading-relaxed px-4">
          Your registration is successful. An admin must approve your account before you can log in.
        </p>
        <Link 
          to="/login" 
          className="w-full inline-flex items-center justify-center py-4 px-6 rounded-2xl bg-blue-600 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-[#F8FAFC] px-4 py-20 md:py-12 relative overflow-hidden font-sans">
      {/* Background Building Picture with Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.06]">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070" 
            alt="Modern Architecture" 
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/15 via-transparent to-indigo-600/5" />
      </div>

      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all group italic z-30"
      >
        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 group-hover:shadow-md group-active:scale-95 transition-all">
          <Home size={18} />
        </div>
        Back to Home
      </Link>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-200 p-6 md:p-10 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-blue-600 rounded-2xl text-white mb-4 shadow-xl shadow-blue-100">
            <UserPlus size={36} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-slate-900">
            SecureNest <span className="text-blue-600 not-italic lowercase">system</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 italic">Create Resident or Guard ID</p>
        </div>
        
        {error && <p className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-6 border-l-4 border-red-500 italic leading-tight">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group text-left">
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 italic">Full Identity</label>
            <User className="absolute left-4 top-9.5 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input name="name" type="text" placeholder="Enter Full Name" required className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold tracking-widest outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm" onChange={handleChange} />
          </div>

          <div className="group text-left">
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 italic">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={16} />
              <input name="email" type="email" placeholder="name@securenest.com" required className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-[11px] font-bold tracking-widest outline-none focus:ring-2 transition-all shadow-sm ${fieldErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:bg-white'}`} onChange={handleChange} />
            </div>
            {fieldErrors.email && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-1.5 ml-1 italic">{fieldErrors.email}</p>}
          </div>

          <div className="group text-left">
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 italic">Contact Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={16} />
              <input name="phone" type="tel" placeholder="07XXXXXXXX" required className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-2 transition-all shadow-sm ${fieldErrors.phone ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:bg-white'}`} onChange={handleChange} />
            </div>
            {fieldErrors.phone && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-1.5 ml-1 italic">{fieldErrors.phone}</p>}
          </div>
          
          <div className="relative text-left">
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 italic">System Role</label>
            <ShieldCheck className="absolute left-4 top-9.5 text-slate-400" size={16} />
            <select name="role" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" value={formData.role} onChange={handleChange}>
              <option value="tenant">Tenant</option>
              <option value="guard">Security Guard</option>
            </select>
          </div>

          {formData.role === 'tenant' && (
            <div className="relative text-left">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 italic">Assigned Unit</label>
              <Home className="absolute left-4 top-9.5 text-slate-400" size={16} />
              <select name="unitNumber" required className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" onChange={handleChange} value={formData.unitNumber}>
                <option value="">Select Unit (A001-A100)</option>
                {unitOptions.map(u => {
                  const taken = takenUnits.includes(u);
                  return (
                    <option key={u} value={u} disabled={taken}>{u}{taken ? ' – OCCUPIED' : ''}</option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="relative text-left">
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 italic">Access Password</label>
            <Lock className="absolute left-4 top-9.5 text-slate-300" size={16} />
            <input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm" onChange={handleChange} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-9.5 text-slate-300 hover:text-blue-600 transition-colors">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative text-left">
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 italic">Verify Password</label>
            <Lock className="absolute left-4 top-9.5 text-slate-300" size={16} />
            <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" required className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm" onChange={handleChange} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-9.5 text-slate-300 hover:text-blue-600 transition-colors">
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-3 mt-4">
            {isLoading ? <><Loader2 className="animate-spin" size={18} /> Initializing...</> : 'Register ID'}
          </button>
        </form>
        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          Already verified? <Link to="/login" className="text-blue-600 hover:underline ml-1">Login System</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;