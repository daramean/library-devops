import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, BookMarked, AlertCircle, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/books',   icon: BookOpen,        label: 'Browse Books' },
  { to: '/dashboard/borrows', icon: BookMarked,      label: 'My Borrows' },
  { to: '/dashboard/fines',   icon: AlertCircle,     label: 'My Fines' },
  { to: '/dashboard/profile', icon: User,            label: 'Profile' },
];

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'fixed inset-0 z-50 flex' : 'hidden lg:flex'} overflow-hidden`}>
      {mobile && <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)}/>}      
      <div className={`${mobile ? 'relative z-10 w-72' : 'w-60'} flex flex-col h-full bg-white dark:bg-gray-900 border-r`}>
        <div className="p-5 border-b flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white"/>
            </div>
            <span className="font-display font-bold">OBITO STORE</span>
          </div>
          {mobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <X size={18} className="text-gray-700 dark:text-gray-200" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                 ${isActive ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`
              }>
              <Icon size={17}/>{label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 font-bold text-sm">
              {user?.full_name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user?.full_name}</div>
              <div className="text-xs text-gray-400">Member</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-white transition">
            <LogOut size={15}/> Sign out
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      {sidebarOpen && <Sidebar mobile />}

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b bg-white dark:bg-gray-900">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <Menu size={20} />
          </button>
          <span className="font-display font-bold">OBITO STORE</span>
          <div className="w-10" />
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
