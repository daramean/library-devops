import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from backend on mount
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [
      { id: Date.now(), is_read: false, created_at: new Date().toISOString(), ...notification },
      ...prev,
    ]);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    
    try {
      await api.put('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  }, [api]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
