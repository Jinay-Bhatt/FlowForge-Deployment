'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, AlertCircle, Info, Zap, X, Check, Trash2 } from 'lucide-react';
import { useNotifications, NotificationItem } from '../context/NotificationContext';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 45) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'recently';
  }
}

export default function NotificationBell({ align = 'right' }: { align?: 'left' | 'right' }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isOpen ? 'var(--neu-sunken)' : 'var(--neu-surface)',
          border: '1px solid var(--neu-border)',
          boxShadow: isOpen ? 'var(--neu-pressed-sm)' : 'var(--neu-flat-xs)',
          color: unreadCount > 0 ? '#ffffff' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.color = 'var(--text-secondary)';
          if (!isOpen) e.currentTarget.style.boxShadow = 'var(--neu-flat-sm)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--neu-border)';
          e.currentTarget.style.color = unreadCount > 0 ? '#ffffff' : 'var(--text-muted)';
          e.currentTarget.style.boxShadow = isOpen ? 'var(--neu-pressed-sm)' : 'var(--neu-flat-xs)';
        }}
        aria-label="Notifications"
      >
        <Bell size={13} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 8px #38bdf8',
            }}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            [align]: 0,
            top: 42,
            width: 340,
            maxWidth: 'calc(100vw - 32px)',
            background: 'var(--neu-surface)',
            border: '1px solid var(--neu-border-bevel)',
            borderRadius: 16,
            boxShadow: 'var(--neu-flat-lg)',
            padding: '16px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    padding: '1px 6px',
                    borderRadius: 99,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <Check size={12} /> Mark read
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllNotifications()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  padding: '24px 0',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Bell size={20} style={{ opacity: 0.3 }} />
                <span>No notifications yet</span>
              </div>
            ) : (
              notifications.map((n) => {
                const isSuccess = n.type === 'success';
                const isError = n.type === 'error';
                const isWarning = n.type === 'warning';
                const accentColor = isSuccess ? '#10b981' : isError ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.read) markAsRead(n.id);
                    }}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: n.read ? 'transparent' : 'var(--neu-sunken)',
                      border: `1px solid ${n.read ? 'rgba(255, 255, 255, 0.04)' : 'var(--neu-border)'}`,
                      boxShadow: n.read ? 'none' : 'var(--neu-pressed-sm)',
                      cursor: n.link ? 'pointer' : 'default',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = n.read ? 'transparent' : 'var(--neu-sunken)';
                    }}
                  >
                    <div style={{ color: accentColor, marginTop: 2, flexShrink: 0 }}>
                      {isSuccess && <CheckCircle2 size={14} />}
                      {isError && <AlertCircle size={14} />}
                      {isWarning && <Zap size={14} />}
                      {!isSuccess && !isError && !isWarning && <Info size={14} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: n.read ? '#cbd5e1' : '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>

                      <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {n.message}
                      </p>

                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!n.read) markAsRead(n.id);
                            setIsOpen(false);
                          }}
                          style={{
                            fontSize: 10.5,
                            color: '#38bdf8',
                            textDecoration: 'none',
                            fontWeight: 600,
                            marginTop: 4,
                            display: 'inline-block',
                          }}
                        >
                          View Details
                        </Link>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#475569',
                        cursor: 'pointer',
                        padding: 2,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignSelf: 'flex-start',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                      aria-label="Delete notification"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
