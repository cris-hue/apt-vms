import { useState, useEffect } from 'react'; // Added useEffect
import API from '../api/axios';
import { X, Send, User, Phone, ClipboardCheck, Shield } from 'lucide-react';

const InviteModal = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: '', idNumber: '', gender: 'Male', phone: '', purpose: ''
  });
  const [loading, setLoading] = useState(false);
  const [passUrl, setPassUrl] = useState('');

  // RESET LOGIC: Clears the state whenever the modal is closed
  const handleClose = () => {
    setPassUrl('');
    setFormData({ name: '', idNumber: '', gender: 'Male', phone: '', purpose: '' });
    onClose();
  };

  // Ensure it resets if isOpen changes to false
  useEffect(() => {
    if (!isOpen) {
      setPassUrl('');
      setFormData({ name: '', idNumber: '', gender: 'Male', phone: '', purpose: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(formData.phone)) {
      return alert("Phone number must be exactly 10 digits.");
    }
    if (!/^\d+$/.test(formData.idNumber)) {
      return alert("ID field cannot contain letters, only numbers are allowed.");
    }
    if (!/^[A-Z]/.test(formData.name)) {
      return alert("Name must start with a capital letter.");
    }

    setLoading(true);
    try {
      const { data } = await API.post('/visitors/register', formData);
      if (data.success) {
        const token = data.visitor.qrCode;
        const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
        setPassUrl(`${baseUrl}/visitor/pass/${token}`);
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Failed to generate pass"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield size={20} />
            <h3 className="font-bold">Register New Visitor</h3>
          </div>
          {/* UPDATED: Uses handleClose */}
          <button onClick={handleClose} className="hover:bg-blue-500 p-1 rounded-lg transition-colors">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!passUrl ? (
            <>
              {/* Form fields remain the same */}
              <div className="grid grid-cols-2 gap-4">
                <input name="name" placeholder="Full Name" required className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleChange} />
                <input name="idNumber" placeholder="ID Number" required className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select name="gender" className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <input name="phone" type="tel" placeholder="Phone Number" required className="w-full px-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleChange} />
              </div>
              <textarea name="purpose" placeholder="Purpose of visit" required className="w-full px-4 py-2 bg-slate-50 border rounded-lg h-24 outline-none focus:ring-2 focus:ring-blue-500" onChange={handleChange} />
              <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:bg-slate-300">
                {loading ? "Generating..." : "Generate Pass"}
              </button>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <ClipboardCheck size={32} />
              </div>
              <h4 className="font-bold text-slate-800 text-lg">Pass Created Successfully!</h4>
              <p className="text-sm text-slate-500 px-6">Share this link with your visitor.</p>
              
              <div className="bg-slate-50 p-3 border rounded-lg break-all text-[10px] text-blue-600 font-mono">
                {passUrl}
              </div>

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(passUrl);
                    alert("Link copied!");
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                >
                  Copy Link
                </button>
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hi ${formData.name}, here is your entry pass: ${passUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} /> WhatsApp
                </a>
              </div>
              {/* UPDATED: Uses handleClose to reset everything */}
              <button 
                type="button"
                onClick={handleClose} 
                className="text-slate-400 text-xs hover:underline pt-2 block mx-auto"
              >
                Back to Dashboard / New Invite
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default InviteModal;