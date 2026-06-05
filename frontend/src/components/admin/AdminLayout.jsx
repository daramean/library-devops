import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, LayoutDashboard, BookMarked, Users, AlertCircle,
  Activity, LogOut, Menu, X, Moon, Sun, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const NAV = [
  { to: '/admin',          icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/books',    icon: BookOpen,         label: 'Books' },
  { to: '/admin/borrows',  icon: BookMarked,       label: 'Borrows' },
  { to: '/admin/users',    icon: Users,            label: 'Users' },
  { to: '/admin/fines',    icon: AlertCircle,      label: 'Fines' },
  { to: '/admin/activity', icon: Activity,         label: 'Activity' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const toggleDark = () => {
    setDark(d => !d);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'fixed inset-0 z-50 flex' : 'hidden lg:flex'}`}>
      {mobile && <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)}/>}
      <div className={`${mobile ? 'relative z-10 w-64' : 'w-64'} flex flex-col h-full bg-gray-950 text-white`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <BookOpen size={18}/>
            </div>
            <div>
              <div className="font-display font-bold">OBITO STORE</div>
              <div className="text-xs text-gray-400">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                 ${isActive ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
              }>
              <Icon size={18}/>{label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold">
              {user?.full_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.full_name}</div>
              <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full">
            <LogOut size={16}/> Sign out
          </button>
        </div>
      </div>
    </aside>
  );

  const { notifications, markAllRead } = useNotifications();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const unreadCount = notifications.filter((item) => !item.read).length;

  const toggleNotifications = () => {
    setNotificationOpen((open) => !open);
  };

  useEffect(() => {
    if (notificationOpen) {
      markAllRead();
    }
    if (!notificationOpen) return;

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen]);

  return (
    <div className="flex min-h-screen overflow-hidden">
      <Sidebar />
      {sidebarOpen && <Sidebar mobile />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b flex items-center justify-between px-6 shrink-0 relative">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20}/>
          </button>
          <div className="flex-1"/>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              {dark ? <Sun size={16}/> : <Moon size={16}/>} 
            </button>
            <div className="relative" ref={notificationRef}>
              <button onClick={toggleNotifications} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition relative">
                <Bell size={16}/>
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="text-sm font-semibold">Notifications</div>
                    <div className="text-xs text-gray-500">Recent activity</div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No notifications</div>
                    ) : notifications.map((item) => (
                      <div key={item.id} className="px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-800">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.message}</div>
                        <div className="text-[10px] uppercase tracking-[.25em] text-gray-400 mt-2">{new Date(item.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
