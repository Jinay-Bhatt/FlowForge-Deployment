'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setSent(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020202', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      {/* Mini header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#ffffff' }}>
            <img src="/FlowForge.png" alt="FlowForge" width={24} height={24} />
            <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Flow<span style={{ background: 'linear-gradient(135deg,#ffffff,#a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forge</span><span style={{ color: '#94a3b8', marginLeft: 6, fontWeight: 500, fontSize: 13.5 }}>Support</span>
            </span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Back to Home</Link>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '80px 32px' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Get in Touch</span>
        <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-1.5px', margin: '8px 0 24px 0', color: '#ffffff' }}>Contact Support</h1>
        
        {sent ? (
          <div style={{ padding: '24px 20px', borderRadius: 12, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 15, lineHeight: 1.6 }}>
            Message received successfully. One of our engineers will reply shortly to {email}.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', fontWeight: 600, marginBottom: 8 }}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: '100%', padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', outline: 'none',
                  fontSize: 14.5
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', fontWeight: 600, marginBottom: 8 }}>Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="How can we help your team build API workflows?"
                style={{
                  width: '100%', padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', outline: 'none',
                  fontSize: 14.5, resize: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%', padding: 14, borderRadius: 10, background: '#6366f1', color: '#ffffff',
                border: 'none', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(99,102,241,0.2)', transition: 'all 0.2s ease'
              }}
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
