import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TenantDashboard from './pages/TenantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VisitorPass from './pages/VisitorPass'; // New Import

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Visitor Link: This is public so the guest can see their QR code */}
        <Route path="/visitor/pass/:token" element={<VisitorPass />} />

        {/* Protected Routes */}
        <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;