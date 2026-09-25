'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { Zap, Radio, ChartColumn, Shield, Link2, Settings, Package } from 'lucide-react';
import NotificationBell from '../../../components/NotificationBell';
import { api } from '../../../services/api';

const NAV_ITEMS = [
  { href: 'builder',   icon: Zap, label: 'Builder',   color: '#818cf8' },
  { href: 'monitor',   icon: Radio, label: 'Monitor',   color: '#34d399' },
  { href: 'analytics', icon: ChartColumn, label: 'Analytics', color: '#38bdf8' },
  { href: 'gateway',   icon: Shield, label: 'Gateway',   color: '#f97316' },
  { href: 'services',  icon: Link2, label: 'Services',  color: '#a78bfa' },
  { href: 'export',     icon: Package, label: 'Export',     color: '#ec4899' },
];

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const projectId = params?.id as string;
  const [project, setProject] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('ff_token');
    const u = localStorage.getItem('ff_user');
    if (!token) { router.replace('/login'); return; }
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setUser(parsed);
        if (parsed.avatar) setAvatar(parsed.avatar);
      } catch {}
    }
    api.auth.me().then(res => {
      if (res?.user) {
        setUser(res.user);
        if (res.user.avatar) {
          setAvatar(res.user.avatar);
          localStorage.setItem('ff_avatar', res.user.avatar);
        }
      }
    }).catch(() => {});
    if (projectId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => setProject(d)).catch(() => {});
    }
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [projectId]);

  useEffect(() => {
    const syncAvatar = () => {
      setAvatar(localStorage.getItem('ff_avatar'));
    };
    window.addEventListener('storage', syncAvatar);
    syncAvatar();
    return () => window.removeEventListener('storage', syncAvatar);
  }, []);

  const activeTab = NAV_ITEMS.find(n => pathname?.includes(`/${n.href}`))?.href || 'builder';
  const activeItem = NAV_ITEMS.find(n => n.href === activeTab);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* ── TOP NAV ─────────────────────────────────── */}
      <nav style={{
        background: 'rgba(2, 2, 2, 0.85)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(24px) saturate(180%)',
        position: 'sticky', top: 0, zIndex: 100,
        transition: 'background 0.3s',
      }}>
        {/* Breadcrumb row */}
        <div style={{ padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', padding: '4px 8px', borderRadius: 7, transition: 'background 0.15s', color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as any).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as any).style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { (e.currentTarget as any).style.background = 'transparent'; (e.currentTarget as any).style.color = 'var(--text-muted)'; }}>
            <img src="/logo.jpg" alt="JBSnap Logo" width="28" height="28" style={{ objectFit: 'cover', borderRadius: '50%' }} />
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
              JB<span style={{ background: 'linear-gradient(135deg,#ffffff,#a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Snap</span>
            </span>
          </Link>
          <span style={{ color: 'var(--text-faint)', fontSize: 16 }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project?.name || <span style={{ color: 'var(--text-faint)' }}>Loading...</span>}
          </span>
          {activeItem && (
            <>
              <span style={{ color: 'var(--text-faint)', fontSize: 16 }}>/</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 5 }}>
                <activeItem.icon size={13} /> {activeItem.label}
              </span>
            </>
          )}

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationBell />
            <Link href="/settings" style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}
              onMouseEnter={e => { (e.currentTarget as any).style.borderColor = 'var(--border-strong)'; (e.currentTarget as any).style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as any).style.borderColor = 'var(--border)'; (e.currentTarget as any).style.color = 'var(--text-muted)'; }}>
              <Settings size={12} /> Settings
            </Link>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#000', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => router.replace('/settings')}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              {avatar ? (
                <img src={avatar} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000' }}>
                  {user?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab row */}
        <div style={{ padding: '0 20px', display: 'flex', gap: 4, borderTop: '1px solid rgba(255,255,255,0.03)', background: 'rgba(2,2,2,0.9)', paddingBlock: '8px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.href;
            return (
              <Link key={item.href} href={`/projects/${projectId}/${item.href}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px',
                  textDecoration: 'none',
                  fontSize: 12, fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  border: '1px solid transparent',
                  borderColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--mono)',
                  letterSpacing: '0.04em',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as any).style.color = '#ffffff';
                    (e.currentTarget as any).style.background = 'rgba(255,255,255,0.02)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as any).style.color = 'var(--text-muted)';
                    (e.currentTarget as any).style.background = 'transparent';
                  }
                }}
              >
                <item.icon size={13} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Page content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
