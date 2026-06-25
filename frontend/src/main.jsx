import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages — Admin
import AdminLayout      from './components/admin/AdminLayout';
import AdminDashboard   from './pages/admin/Dashboard';
import AdminBooks       from './pages/admin/Books';
import AdminBorrows     from './pages/admin/Borrows';
import AdminUsers       from './pages/admin/Users';
import AdminFines       from './pages/admin/Fines';
import AdminActivity    from './pages/admin/Activity';
import AdminSettings    from './pages/admin/Settings';

// Pages — User
import UserLayout       from './components/user/UserLayout';
import UserDashboard    from './pages/user/Dashboard';
import UserBooks        from './pages/user/Books';
import UserBorrows      from './pages/user/MyBorrows';
import UserFines        from './pages/user/MyFines';
import UserProfile      from './pages/user/Profile';
import UserSettings     from './pages/user/Settings';

// Auth
import Login            from './pages/auth/Login';
import Register         from './pages/auth/Register';
import ForgotPassword    from './pages/auth/ForgotPassword';
import { ResetPassword }    from './pages/auth/ResetPassword';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin' && user.role !== 'librarian') return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login"    element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <ForgotPassword />} />
      <Route path="/reset-password/:token" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <ResetPassword />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index           element={<AdminDashboard />} />
        <Route path="books"    element={<AdminBooks />} />
        <Route path="borrows"  element={<AdminBorrows />} />
        <Route path="users"    element={<AdminUsers />} />
        <Route path="fines"    element={<AdminFines />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* User */}
      <Route path="/dashboard" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route index          element={<UserDashboard />} />
        <Route path="books"   element={<UserBooks />} />
        <Route path="borrows" element={<UserBorrows />} />
        <Route path="fines"   element={<UserFines />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="settings" element={<UserSettings />} />
      </Route>

      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#ffffff',
                color: '#1f2937',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                border: '1px solid #e5e7eb',
                padding: '16px',
              },
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #86efac',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#f0fdf4',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fef2f2',
                },
              },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
