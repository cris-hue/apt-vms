import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { UserPlus, ShieldCheck, Lock, Mail, User, Phone, Home, Loader2 } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', unitNumber: '', password: '', confirmPassword: '', role: 'tenant'
  });
  const [fieldErrors, setFieldErrors] = useState({ email: '', phone: '' });
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-sm">
        <ShieldCheck className="text-green-500 mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Sent!</h2>
        <p className="text-slate-500 mb-6">Your registration is successful. An admin must approve your account before you can log in.</p>
        <Link to="/login" className="text-blue-600 font-bold hover:underline">Return to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-600 rounded-lg text-white mb-3">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 text-center">SecureNest</h2>
          <p className="text-slate-500 mt-1 text-sm">Create your resident or guard account</p>
        </div>
        
        {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold mb-4 border-l-4 border-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-400" size={18} />
            <input name="name" type="text" placeholder="Full Name" required className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} />
          </div>

          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input name="email" type="email" placeholder="Email Address" required className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 transition-all ${fieldErrors.email ? 'border-red-300 focus:ring-red-500' : 'focus:ring-blue-500'}`} onChange={handleChange} />
            </div>
            {fieldErrors.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
              <input name="phone" type="tel" placeholder="Phone (e.g. 0711...)" required className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 transition-all ${fieldErrors.phone ? 'border-red-300 focus:ring-red-500' : 'focus:ring-blue-500'}`} onChange={handleChange} />
            </div>
            {fieldErrors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{fieldErrors.phone}</p>}
          </div>
          
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-3 text-slate-400" size={18} />
            <select name="role" className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none" value={formData.role} onChange={handleChange}>
              <option value="tenant">Tenant</option>
              <option value="guard">Security Guard</option>
            </select>
          </div>

          {formData.role === 'tenant' && (
            <div className="relative">
              <Home className="absolute left-3 top-3 text-slate-400" size={18} />
              <select name="unitNumber" required className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none" onChange={handleChange} value={formData.unitNumber}>
                <option value="">Select Unit (A001-A100)</option>
                {unitOptions.map(u => {
                  const taken = takenUnits.includes(u);
                  return (
                    <option key={u} value={u} disabled={taken}>{u}{taken ? ' – taken' : ''}</option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input name="password" type="password" placeholder="Password" required className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input name="confirmPassword" type="password" placeholder="Confirm Password" required className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" onChange={handleChange} />
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 className="animate-spin" size={18} /> Sending...</> : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign In</Link></p>
      </div>
    </div>
  );
};

export default Register;