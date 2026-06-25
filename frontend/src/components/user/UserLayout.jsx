import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, BookMarked, AlertCircle, User, LogOut, Menu, X, Settings, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

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
  const { notifications, markAllRead } = useNotifications();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const handleLogout = async () => { await logout(); navigate('/login'); };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'fixed inset-0 z-50 flex' : 'hidden lg:flex'} overflow-hidden`}>
      {mobile && <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)}/>}      
      <div className={`${mobile ? 'relative z-10 w-72' : 'w-72'} flex flex-col h-full bg-cream-100 border-r border-cream-200`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-cream-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-brand-600 rounded-[14px] flex items-center justify-center shadow-lg">
              <img src="/images/logo.png" alt="OBITO STORE" className="w-full h-full rounded-[14px] object-cover" />
            </div>
            <div>
              <div className="font-display font-bold text-gray-900 text-base">OBITO</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-[0.15em]">Library</div>
            </div>
          </div>
          {mobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-200 transition">
              <X size={18} className="text-gray-700" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-[11px] uppercase tracking-[0.15em] text-gray-500 font-semibold px-3 mb-2">Menu</div>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              onClick={() => mobile && setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-cream-200 hover:text-gray-900'
                }`
              }>
              <Icon size={18}/>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Settings */}
        <div className="border-t border-cream-200 p-3">
          <NavLink to="/dashboard/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-cream-200'
              }`
            }>
            <Settings size={18}/>
            <span>Settings</span>
          </NavLink>
        </div>

        {/* User Profile */}
        <div className="border-t border-cream-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user?.full_name} className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.[0]
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{user?.full_name || 'Member'}</div>
              <div className="text-xs text-gray-500">Member</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition font-medium">
            <LogOut size={16}/>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100">
      <Sidebar />
      {sidebarOpen && <Sidebar mobile />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 shrink-0 relative z-40">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition">
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Bell size={20} className="text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="fixed right-6 top-20 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[99999] animate-fade-in">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllRead()}
                        className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                            !notif.is_read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user?.full_name} className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.[0]
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
