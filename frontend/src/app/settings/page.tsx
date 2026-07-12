'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../services/api';
import { Zap, Package, GitBranch, GitFork, User, Settings, Shield, Terminal, Key, Database, Cpu, Layers, Lightbulb, Image as ImageIcon, Trash2 } from 'lucide-react';

function IntegrationPipeline({ provider, repositoryName }: { provider: string; repositoryName?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '32px 20px', background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: 24, overflow: 'hidden', position: 'relative' }}>
      {/* Node 1: Local Workspace */}
      <div style={{ width: 44, height: 44, borderRadius: '8px', border: '1px solid var(--border)', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        <Zap size={16} style={{ color: '#ffffff' }} />
      </div>
      
      {/* Connector 1 */}
      <div style={{ flex: 1, height: 1, background: 'var(--border)', minWidth: 40 }} />

      {/* Node 2: Compile Engine */}
      <div style={{ width: 44, height: 44, borderRadius: '8px', border: '1px solid var(--border)', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        <Package size={16} style={{ color: '#ffffff' }} />
      </div>
      
      {/* Connector 2 */}
      <div style={{ flex: 1, height: 1, background: 'var(--border)', minWidth: 40 }} />

      {/* Node 3: Git Repo */}
      <div style={{ width: 44, height: 44, borderRadius: '8px', border: '1px solid var(--border)', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        {provider === 'GITLAB' ? <GitFork size={16} style={{ color: '#ffffff' }} /> : <GitBranch size={16} style={{ color: '#ffffff' }} />}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [gitConfig, setGitConfig] = useState<any>(null);
  const [gitForm, setGitForm] = useState({ repositoryName: '', accessToken: '', provider: 'GITHUB' });
  const [savingGit, setSavingGit] = useState(false);
  const [gitSaved, setGitSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'git' | 'profile' | 'export'>('profile');
  const [avatar, setAvatar] = useState<string | null>(null);
  
  // Profile form state and notifications
  const [profileForm, setProfileForm] = useState({ username: '', email: '', oldPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('ff_token');
    const u = localStorage.getItem('ff_user');
    if (!token) { router.replace('/login'); return; }
    if (u) {
      const parsed = JSON.parse(u);
      setUser(parsed);
      setProfileForm({
        username: parsed.username || '',
        email: parsed.email || '',
        oldPassword: '',
        newPassword: '',
      });
    }
    
    // Fetch fresh user details to populate createdAt and other missing attributes
    api.auth.me()
      .then((res) => {
        if (res.user) {
          setUser(res.user);
          localStorage.setItem('ff_user', JSON.stringify(res.user));
          setProfileForm(f => ({
            ...f,
            username: res.user.username || '',
            email: res.user.email || '',
          }));
        }
      })
      .catch(() => {});

    loadGitConfig();
  }, []);

  useEffect(() => {
    const syncAvatar = () => {
      setAvatar(localStorage.getItem('ff_avatar'));
    };
    window.addEventListener('storage', syncAvatar);
    syncAvatar();
    return () => window.removeEventListener('storage', syncAvatar);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.username.trim() || !profileForm.email.trim()) return;
    setSavingProfile(true);
    setProfileError('');
    try {
      const updatePayload: any = {
        username: profileForm.username,
      };
      
      if (profileForm.newPassword.trim()) {
        if (!profileForm.oldPassword.trim()) {
          throw new Error('Current password is required to change to a new password.');
        }
        updatePayload.oldPassword = profileForm.oldPassword;
        updatePayload.newPassword = profileForm.newPassword;
      } else if (profileForm.oldPassword.trim()) {
        throw new Error('New password is required when supplying your current password.');
      }

      const res = await api.auth.update(updatePayload);
      setUser(res.user);
      localStorage.setItem('ff_user', JSON.stringify(res.user));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      setProfileForm(f => ({ ...f, oldPassword: '', newPassword: '' }));
      window.dispatchEvent(new Event('storage')); // Notify layouts
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const loadGitConfig = async () => {
    try {
      const res = await api.git.getConfig();
      if (res.config) {
        setGitConfig(res.config);
        setGitForm(f => ({ ...f, repositoryName: res.config.repositoryName }));
      }
    } catch {}
  };

  const handleSaveGit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitForm.repositoryName.trim() || !gitForm.accessToken.trim()) return;
    setSavingGit(true);
    try {
      await api.git.saveConfig(gitForm);
      await loadGitConfig();
      setGitSaved(true);
      setTimeout(() => setGitSaved(false), 2500);
      setGitForm(f => ({ ...f, accessToken: '' }));
    } catch (err: any) { alert(err.message); }
    finally { setSavingGit(false); }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      localStorage.setItem('ff_avatar', base64);
      setAvatar(base64);
      window.dispatchEvent(new Event('storage'));
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAvatar = () => {
    const url = '/default_avatar.png';
    localStorage.setItem('ff_avatar', url);
    setAvatar(url);
    window.dispatchEvent(new Event('storage'));
  };

  const handleRemoveAvatar = () => {
    localStorage.removeItem('ff_avatar');
    setAvatar(null);
    window.dispatchEvent(new Event('storage'));
  };

  const logout = () => { localStorage.clear(); router.replace('/login'); };

  const TABS = [
    { key: 'profile', icon: User, label: 'Profile Settings' },
    { key: 'git', icon: GitBranch, label: 'GitHub / GitLab' },
    { key: 'export', icon: Package, label: 'API Keys & Codebase' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Nav */}
      <nav style={{ background: '#09090b', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text-secondary)' }}>
            <img src="/FlowForge.png" alt="FlowForge Logo" width="28" height="28" style={{ objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#ffffff' }}>
              Flow<span style={{ background: 'linear-gradient(135deg,#ffffff,#a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forge</span>
            </span>
          </Link>
          <span style={{ color: 'var(--text-faint)' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Settings</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Link href="/dashboard" style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>← Dashboard</Link>
            <button onClick={logout} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#fca5a5', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Sign out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 10, color: '#ffffff' }}>
          <Settings size={22} /> Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>Configure external repositories, profile preferences, and key exports.</p>

        {/* Flat Zinc Tab nav */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                border: t.key === activeTab ? 'none' : '1px solid var(--border)',
                borderRadius: '6px',
                background: t.key === activeTab ? '#ffffff' : 'transparent',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: t.key === activeTab ? '#000000' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { if (t.key !== activeTab) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#ffffff'; } }}
              onMouseLeave={e => { if (t.key !== activeTab) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 28, background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px' }}>
              {/* Profile Photo Uploader section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '1px solid var(--border)', background: '#121214', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  {avatar ? (
                    <img src={avatar} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff' }}>
                      {user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>Profile Picture</div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>PNG, JPG or GIF. Maximum size 2MB.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label style={{ padding: '6px 12px', background: '#ffffff', color: '#000000', borderRadius: '6px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      Upload Photo
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </label>
                    <button onClick={handleGenerateAvatar} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', color: '#ffffff', borderRadius: '6px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ImageIcon size={12} /> Generate AI Avatar
                    </button>
                    {avatar && (
                      <button onClick={handleRemoveAvatar} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '6px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {profileError && (
                  <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: 12.5 }}>
                    {profileError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
                  <input
                    required
                    value={profileForm.username}
                    onChange={e => setProfileForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="Username"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                  <input
                    disabled
                    type="email"
                    value={profileForm.email}
                    placeholder="email@example.com"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border)',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                      outline: 'none',
                      cursor: 'not-allowed',
                    }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Email address cannot be changed.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Password</label>
                  <input
                    type="password"
                    value={profileForm.oldPassword}
                    onChange={e => setProfileForm(f => ({ ...f, oldPassword: e.target.value }))}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Required if you want to change your password.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
                  <input
                    type="password"
                    value={profileForm.newPassword}
                    onChange={e => setProfileForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Leave blank to keep current password.</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: 8 }}>
                  <span style={{ width: 180, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Created</span>
                  <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}
                  </span>
                </div>

                <button type="submit" disabled={savingProfile}
                  style={{
                    padding: '14px',
                    background: savingProfile ? 'transparent' : profileSaved ? 'rgba(16,185,129,0.1)' : '#ffffff',
                    color: savingProfile ? 'var(--text-muted)' : profileSaved ? '#10b981' : '#000000',
                    border: `1.5px solid ${profileSaved ? '#10b981' : 'transparent'}`,
                    borderRadius: '6px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: savingProfile ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!savingProfile && !profileSaved) e.currentTarget.style.background = '#cbd5e1'; }}
                  onMouseLeave={e => { if (!savingProfile && !profileSaved) e.currentTarget.style.background = '#ffffff'; }}
                >
                  {savingProfile ? 'Saving Profile...' : profileSaved ? 'Profile Saved Successfully' : 'Save Profile Details'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── GIT TAB ── */}
        {activeTab === 'git' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <IntegrationPipeline provider={gitForm.provider} repositoryName={gitConfig?.repositoryName} />
            
            {gitConfig && (
              <div style={{ padding: '16px 20px', background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', color: '#10b981' }}>
                  {gitConfig.provider === 'GITHUB' ? <GitBranch size={24} /> : <GitFork size={24} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Sync Active — Connected to {gitConfig.provider}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--mono)' }}>{gitConfig.repositoryName} → {gitConfig.repositoryUrl}</div>
                </div>
              </div>
            )}

            <div style={{ padding: 28, background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#ffffff' }}>Repository Synchronization</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Link a repository to automatically commit and push compiles directly to Git.</div>

              <form onSubmit={handleSaveGit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label className="label" style={{ color: '#ffffff' }}>Git Provider</label>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    {['GITHUB', 'GITLAB'].map(p => (
                      <button key={p} type="button" onClick={() => setGitForm(f => ({ ...f, provider: p }))}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: gitForm.provider === p ? 'none' : '1px solid var(--border)',
                          borderRadius: '6px',
                          background: gitForm.provider === p ? '#ffffff' : 'transparent',
                          color: gitForm.provider === p ? '#000000' : 'var(--text-muted)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}>
                        {p === 'GITHUB' ? <GitBranch size={14} /> : <GitFork size={14} />} {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="label" style={{ color: '#ffffff' }}>Repository Namespace & Name</label>
                  <input
                    required value={gitForm.repositoryName}
                    onChange={e => setGitForm(f => ({ ...f, repositoryName: e.target.value }))}
                    placeholder="username/my-flowforge-api"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="label" style={{ color: '#ffffff' }}>Personal Access Token (repo scope)</label>
                  <input
                    required type="password" value={gitForm.accessToken}
                    onChange={e => setGitForm(f => ({ ...f, accessToken: e.target.value }))}
                    placeholder="ghp_••••••••••••••••••••"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                    <Lightbulb size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Securely encrypted using AES-256-GCM. Create a token with <strong style={{ color: '#ffffff' }}>repo</strong> access scope.
                  </div>
                </div>

                <button type="submit" disabled={savingGit}
                  style={{
                    padding: '14px',
                    background: savingGit ? 'transparent' : gitSaved ? 'rgba(16,185,129,0.1)' : '#ffffff',
                    color: savingGit ? 'var(--text-muted)' : gitSaved ? '#10b981' : '#000000',
                    border: `1.5px solid ${gitSaved ? '#10b981' : 'transparent'}`,
                    borderRadius: '6px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: savingGit ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!savingGit && !gitSaved) e.currentTarget.style.background = '#cbd5e1'; }}
                  onMouseLeave={e => { if (!savingGit && !gitSaved) e.currentTarget.style.background = '#ffffff'; }}
                >
                  {savingGit ? 'Saving Connection...' : gitSaved ? 'Connection Successful' : 'Save Connection'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── EXPORT TAB ── */}
        {activeTab === 'export' && (
          <div>
            <div style={{ padding: 28, background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>Export Codebase Details</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>When exporting workflows, FlowForge packages a production codebase built on standard enterprise software:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: Cpu, text: 'Fastify Node.js HTTP server routing' },
                  { icon: Database, text: 'Prisma ORM Client models & PostgreSQL adapter' },
                  { icon: Layers, text: 'Docker containment & docker-compose configurations' },
                  { icon: Shield, text: 'Secure env.example configuration templates' },
                  { icon: Terminal, text: 'Dynamic sandbox virtual machine routing scripts' },
                  { icon: Settings, text: 'Comprehensive OpenAPI dynamic documentation charts' }
                ].map(f => (
                  <div key={f.text} style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                    <f.icon size={14} style={{ color: '#ffffff' }} /> {f.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
