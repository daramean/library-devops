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

// Pages — User
import UserLayout       from './components/user/UserLayout';
import UserDashboard    from './pages/user/Dashboard';
import UserBooks        from './pages/user/Books';
import UserBorrows      from './pages/user/MyBorrows';
import UserFines        from './pages/user/MyFines';
import UserProfile      from './pages/user/Profile';

// Auth
import Login            from './pages/auth/Login';
import Register         from './pages/auth/Register';
import ForgotPassword   from './pages/auth/ForgotPassword';
import ResetPassword    from './pages/auth/ResetPassword';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center'}}><div style={{width:'32px',height:'32px',border:'4px solid #3b82f6',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite'}}/></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin' && user.role !== 'librarian') return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login"             element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
      <Route path="/register"          element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/forgot-password"   element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
      <Route path="/reset-password/:token" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index           element={<AdminDashboard />} />
        <Route path="books"    element={<AdminBooks />} />
        <Route path="borrows"  element={<AdminBorrows />} />
        <Route path="users"    element={<AdminUsers />} />
        <Route path="fines"    element={<AdminFines />} />
        <Route path="activity" element={<AdminActivity />} />
      </Route>

      {/* User */}
      <Route path="/dashboard" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route index          element={<UserDashboard />} />
        <Route path="books"   element={<UserBooks />} />
        <Route path="borrows" element={<UserBorrows />} />
        <Route path="fines"   element={<UserFines />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 2000,
              className: 'font-sans text-sm',
              success: { icon: '' },
              error: { icon: '' },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
