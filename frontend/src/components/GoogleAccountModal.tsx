'use client';
import { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleAccountModal({
  isOpen,
  onClose,
  onSuccess,
  gender,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (res: any) => void;
  gender?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!isOpen) return;

    if (window.google?.accounts?.id) {
      initGoogleId();
    } else {
      const existingScript = document.getElementById('google-gsi-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => initGoogleId();
        script.onerror = () => setError('Failed to load Google Identity Services SDK');
        document.body.appendChild(script);
      } else {
        initGoogleId();
      }
    }
  }, [isOpen]);

  const decodeJwtPayload = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) return;
    setLoading(true);
    setError('');

    const payload = decodeJwtPayload(response.credential);
    const email = payload?.email;
    const name = payload?.name || payload?.given_name || email?.split('@')[0] || 'Google User';
    const picture = payload?.picture;

    if (!email) {
      setError('Could not retrieve email from Google Account');
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.googleLogin({
        email,
        name,
        picture,
        gender: gender || 'Prefer not to say',
      });
      onSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const initGoogleId = () => {
    if (!window.google?.accounts?.id || !GOOGLE_CLIENT_ID) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
      });

      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 320,
        });
      }

      window.google.accounts.id.prompt();
    } catch (err: any) {
      console.error('Google ID init error:', err);
    }
  };

  const triggerGooglePopup = () => {
    if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.prompt();
    } else if (GOOGLE_CLIENT_ID) {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=token%20id_token&scope=openid%20email%20profile&prompt=select_account`;
      window.open(authUrl, 'google_oauth_popup', 'width=500,height=600');
    } else {
      setError('Google Sign-In requires NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
      fontFamily: "'Plus Jakarta Sans', Roboto, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#ffffff',
        borderRadius: 24,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        position: 'relative',
        color: '#202124',
        padding: '32px 28px',
        textAlign: 'center',
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', right: 16, top: 16,
            border: 'none', background: 'transparent',
            color: '#5f6368', cursor: 'pointer',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={18} />
        </button>

        {/* Official Google G Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="40" height="40" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px 0', color: '#202124' }}>Sign in with Google</h2>
        <p style={{ fontSize: 13.5, color: '#5f6368', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Select a Google account logged into your device to continue to <strong style={{ color: '#1a73e8' }}>JBSnap</strong>
        </p>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fce8e6', color: '#c5221f', fontSize: 12.5, borderRadius: 8, marginBottom: 16, border: '1px solid #fad2cf', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4 }}>
              <AlertTriangle size={14} /> Authentication Error
            </div>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, border: '3px solid #1a73e8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13, color: '#5f6368', fontWeight: 600 }}>Authenticating Google Account...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Container for official Google GSI button */}
            <div ref={buttonContainerRef} style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />

            {/* Account Selection Popup button */}
            <button
              onClick={triggerGooglePopup}
              style={{
                width: '100%',
                maxWidth: 320,
                height: 44,
                borderRadius: 22,
                border: '1px solid #dadce0',
                background: '#ffffff',
                color: '#3c4043',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.borderColor = '#d2e3fc';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#dadce0';
              }}
            >
              <RefreshCw size={14} style={{ color: '#1a73e8' }} />
              Choose Device Google Account
            </button>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid #f1f3f4',
          fontSize: 11.5,
          color: '#70757a',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}>
          <ShieldCheck size={14} style={{ color: '#34A853' }} />
          <span>Google will share your device account name & email securely with JBSnap.</span>
        </div>

      </div>
    </div>
  );
}
