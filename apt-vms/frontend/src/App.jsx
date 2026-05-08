import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react'; // Added to manage user state
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import TenantDashboard from './pages/TenantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GuardDashboard from './pages/GuardDashboard';
import VisitorPass from './pages/VisitorPass';

function App() {
  // 2. Retrieve user data from localStorage to pass to dashboards
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  // Listen for changes in localStorage (login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('user')));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/visitor/pass/:token" element={<VisitorPass />} />

        {/* Protected Routes - Passing 'user' prop so names/roles show up */}
        <Route path="/tenant-dashboard" element={<TenantDashboard user={user} />} />
        <Route path="/admin" element={<AdminDashboard user={user} />} />
        <Route path="/guard-dashboard" element={<GuardDashboard user={user} />} />

        {/* Public and landing routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;