import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; 
import API from '../api/axios';
import { ShieldCheck, MapPin, Calendar, Clock } from 'lucide-react';

const VisitorPass = () => {
  const { token } = useParams();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPassData = async () => {
      try {
        // UPDATED: Calling the new public endpoint
        // This bypasses the 'protect' middleware so the guest can see their pass
        const { data } = await API.get(`/visitors/public/pass/${token}`);
        setVisitor(data.data);
      } catch (err) {
        console.error("Pass verification failed. It may not exist in the database.");
      } finally {
        setLoading(false);
      }
    };
    fetchPassData();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold tracking-tight">Verifying Pass...</div>;

  if (!visitor) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm border border-slate-100">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800">Invalid Pass</h2>
        <p className="text-slate-500 mt-2 text-sm">This pass does not exist or has expired. Please contact the resident who invited you.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center p-6 sm:p-12">
      <div className="flex items-center gap-2 text-white mb-8">
        <ShieldCheck size={32} />
        <h1 className="text-2xl font-black tracking-tighter uppercase italic">SecureNest</h1>
      </div>

      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        {/* Pass Header */}
        <div className="bg-slate-800 p-6 text-center text-white">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Visitor Entry Pass</h2>
          <p className="text-2xl font-black tracking-tight">{visitor.name}</p>
        </div>

        {/* QR Code Container */}
        <div className="p-8 flex flex-col items-center bg-white border-b-2 border-dashed border-slate-200 relative">
          {visitor.status === 'Expired' ? (
            <div className="p-8 bg-red-50 border-4 border-red-200 rounded-2xl shadow-inner flex flex-col items-center justify-center w-[240px] h-[240px]">
              <span className="text-5xl mb-4">🚫</span>
              <span className="font-black text-red-600 uppercase tracking-widest text-xl">Expired</span>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-2 text-center">Pass Invalid</span>
            </div>
          ) : (
            <div className="p-4 bg-white border-4 border-slate-800 rounded-2xl shadow-inner flex items-center justify-center">
              <QRCodeCanvas value={visitor.qrCode} size={200} />
            </div>
          )}
          {/* Decorative punch holes for the "ticket" look */}
          <div className="absolute -left-4 -bottom-4 w-8 h-8 bg-blue-600 rounded-full shadow-inner"></div>
          <div className="absolute -right-4 -bottom-4 w-8 h-8 bg-blue-600 rounded-full shadow-inner"></div>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-4 bg-white">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600 border border-slate-100"><MapPin size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destination</p>
              <p className="text-sm font-bold text-slate-800">Unit {visitor.tenantId?.unitNumber || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600 border border-slate-100"><Calendar size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                <p className="text-sm font-bold text-slate-800">{new Date(visitor.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600 border border-slate-100"><Clock size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <p className={`text-sm font-bold ${visitor.status === 'Expired' ? 'text-red-600' : 'text-green-600'}`}>{visitor.status}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 italic font-medium px-4 leading-relaxed">
            Please present this secure code to the security guard at the main gate for verification.
          </p>
        </div>
      </div>
      
      <p className="mt-8 text-blue-200 text-[10px] font-bold uppercase tracking-widest opacity-80">
        © 2026 SecureNest Digital Systems
      </p>
    </div>
  );
};

export default VisitorPass;