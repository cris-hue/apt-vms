import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react'; // Added to manage user state
import Login from './pages/Login';
import Register from './pages/Register';
import TenantDashboard from './pages/TenantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GuardDashboard from './pages/GuardDashboard'; // 1. Added Missing Import
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
        
        {/* 3. Added the Missing Guard Route */}
        <Route path="/guard-dashboard" element={<GuardDashboard user={user} />} />
        
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* 4. Added a "404" catch-all to prevent future blank screens */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;