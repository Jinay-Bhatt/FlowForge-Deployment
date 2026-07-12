'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock } from 'lucide-react';
import { api } from '../../services/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Focus tracking for premium input micro-interactions
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.auth.register(form);
      const res = await api.auth.login({ email: form.email, password: form.password });
      localStorage.setItem('ff_token', res.token);
      localStorage.setItem('ff_user', JSON.stringify(res.user));
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: '#020203',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Premium colorful background glow mesh */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        <div style={{
          position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 550, height: 550, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 50%, transparent 70%)',
          filter: 'blur(64px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '10%',
          width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          opacity: 0.8
        }} />
      </div>

      <div style={{
        width: '100%', maxWidth: 420,
        position: 'relative', zIndex: 10,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(16px)',
        transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        
        {/* Sleek Header */}
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Logo Node with high-tech background glow */}
          <div style={{
            position: 'relative', width: 68, height: 68, borderRadius: 20,
            background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)'
          }}>
            <img src="/FlowForge.png" alt="FlowForge Logo" width="34" height="34" style={{ objectFit: 'contain' }} />
            <div style={{
              position: 'absolute', inset: -4, borderRadius: 24,
              border: '1.5px dashed rgba(255,255,255,0.04)', pointerEvents: 'none'
            }} />
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 900, color: '#ffffff', letterSpacing: '-1px',
            fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", lineHeight: 1.1
          }}>
            Flow<span style={{ background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forge</span>
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 8 }}>Create your FlowForge account</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12,
            padding: '10px 16px',
            width: '100%',
            marginBottom: 24,
            color: '#fca5a5',
            fontSize: 12.5,
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(239,68,68,0.05)'
          }}>
            {error}
          </div>
        )}

        {/* Main Glassmorphic Card */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{
            width: '100%',
            padding: '36px 32px',
            background: 'rgba(8, 8, 11, 0.45)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top Glowing Edge decoration */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
              background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4), transparent)'
            }} />

            {/* Username Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{
                fontSize: 11, fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.08em'
              }}>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  color: usernameFocused ? '#818cf8' : '#475569', display: 'flex', alignItems: 'center',
                  transition: 'color 0.25s ease'
                }}>
                  <User size={16} />
                </span>
                <input
                  type="text" required
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  placeholder="johndoe"
                  style={{
                    width: '100%',
                    background: '#040406',
                    border: `1px solid ${usernameFocused ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 12,
                    padding: '12px 16px 12px 46px',
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    outline: 'none',
                    height: 48,
                    boxShadow: usernameFocused ? '0 0 0 3px rgba(99, 102, 241, 0.12)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{
                fontSize: 11, fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.08em'
              }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  color: emailFocused ? '#818cf8' : '#475569', display: 'flex', alignItems: 'center',
                  transition: 'color 0.25s ease'
                }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="you@company.com"
                  style={{
                    width: '100%',
                    background: '#040406',
                    border: `1px solid ${emailFocused ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 12,
                    padding: '12px 16px 12px 46px',
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    outline: 'none',
                    height: 48,
                    boxShadow: emailFocused ? '0 0 0 3px rgba(99, 102, 241, 0.12)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{
                fontSize: 11, fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.08em'
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  color: passwordFocused ? '#818cf8' : '#475569', display: 'flex', alignItems: 'center',
                  transition: 'color 0.25s ease'
                }}>
                  <Lock size={16} />
                </span>
                <input
                  type="password" required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="•••••••• (min 6 chars)"
                  style={{
                    width: '100%',
                    background: '#040406',
                    border: `1px solid ${passwordFocused ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 12,
                    padding: '12px 16px 12px 46px',
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    outline: 'none',
                    height: 48,
                    boxShadow: passwordFocused ? '0 0 0 3px rgba(99, 102, 241, 0.12)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Premium Silver Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 48,
                background: loading ? 'rgba(255, 255, 255, 0.08)' : 'linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)',
                color: loading ? '#64748b' : '#000000',
                border: 'none',
                borderRadius: 12,
                fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(255,255,255,0.06)',
                letterSpacing: '-0.01em',
                marginTop: 8
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(255,255,255,0.15)';
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.06)';
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid #64748b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        {/* Footer Links */}
        <div style={{ marginTop: 24, fontSize: 13.5, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Already have an account?</span>
          <Link
            href="/login"
            style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
