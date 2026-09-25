'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleSignInButton({
  onSuccess,
  gender,
  text = 'Sign in with Google',
  disabled = false,
}: {
  onSuccess: (res: any) => void;
  gender?: string;
  text?: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGsi = () => {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: false,
        });

        // Render official GSI button directly to ensure 100% compliance with COOP policy
        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            theme: 'filled_black',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: text.toLowerCase().includes('up') ? 'signup_with' : 'signin_with',
            width: 350,
            logo_alignment: 'left',
          });
        }
      } catch (err) {
        console.error('Google Identity init error:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const existingScript = document.getElementById('google-gsi-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => initGsi();
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', initGsi);
      }
    }
  }, [GOOGLE_CLIENT_ID, text]);

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

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)', width: '100%' }}>
        Google Sign-In requires NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {error && (
        <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)', width: '100%' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#94a3b8', fontSize: 13.5 }}>
          <div style={{ width: 16, height: 16, border: '2px solid #818cf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Authenticating Google Account...
        </div>
      ) : (
        /* Official Google Identity Services Rendered Button Container */
        <div
          ref={buttonContainerRef}
          style={{
            minHeight: 44,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        />
      )}
    </div>
  );
}


