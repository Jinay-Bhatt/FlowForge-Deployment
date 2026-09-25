'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, BASE_URL_DIRECT } from '../services/api';
import { CheckCircle2, AlertCircle, Info, Zap, X } from 'lucide-react';
import Link from 'next/link';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string | null;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { ...t, id };
    setToasts(prev => [newToast, ...prev].slice(0, 4));

    // Auto-dismiss toast after 4.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(item => item.id !== id));
  }, []);

  const refreshNotifications = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ff_token') : null;
    if (!token) return;

    try {
      setLoading(true);
      const res = await api.notifications.list();
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();

    const token = typeof window !== 'undefined' ? localStorage.getItem('ff_token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('ff_user') : null;
    let userId: string | null = null;
    if (userStr) {
      try {
        userId = JSON.parse(userStr).id;
      } catch {}
    }

    if (!token || !userId) return;

    // Initialize real-time Socket.IO connection
    const socket = io(BASE_URL_DIRECT, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-user', userId);
    });

    socket.on('notification', (newNotif: NotificationItem) => {
      setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
      setUnreadCount(prev => prev + 1);

      // Trigger floating interactive toast
      addToast({
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type || 'info',
        link: newNotif.link,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [addToast, refreshNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.notifications.delete(id);
      const target = notifications.find(n => n.id === id);
      if (target && !target.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const clearAllNotifications = async () => {
    try {
      await api.notifications.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        refreshNotifications,
        addToast,
      }}
    >
      {children}

      {/* Floating Interactive Real-Time Toasts */}
      {toasts.length > 0 && (
        <aside
          aria-label="Real-time Notifications"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxWidth: 360,
            width: 'calc(100vw - 48px)',
            pointerEvents: 'none',
          }}
        >
          {toasts.map(t => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';
            const accentColor = isSuccess ? '#10b981' : isError ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';

            const ToastContent = (
              <div
                style={{
                  pointerEvents: 'auto',
                  background: '#09090b',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderLeft: `3px solid ${accentColor}`,
                  borderRadius: 10,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: t.link ? 'pointer' : 'default',
                }}
              >
                <div style={{ color: accentColor, marginTop: 1, flexShrink: 0 }}>
                  {isSuccess && <CheckCircle2 size={16} />}
                  {isError && <AlertCircle size={16} />}
                  {isWarning && <Zap size={16} />}
                  {!isSuccess && !isError && !isWarning && <Info size={16} />}
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 3, letterSpacing: '-0.2px' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.45, wordBreak: 'break-word' }}>
                    {t.message}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    removeToast(t.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                  }}
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
            );

            return t.link ? (
              <Link key={t.id} href={t.link} onClick={() => removeToast(t.id)} style={{ textDecoration: 'none' }}>
                {ToastContent}
              </Link>
            ) : (
              <div key={t.id}>{ToastContent}</div>
            );
          })}
        </aside>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
