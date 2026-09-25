'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, BASE_URL_DIRECT } from '../../services/api';
import { Mail, Check, Copy, Send, ShieldCheck, ArrowLeft, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [subjectFocused, setSubjectFocused] = useState(false);
  const [messageFocused, setMessageFocused] = useState(false);

  const primaryEmail = 'dualithjbsnap@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(primaryEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${BASE_URL_DIRECT}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit contact request');
      }

      setSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInputStyle = (focused: boolean) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    background: 'var(--neu-sunken)',
    border: `1px solid ${focused ? 'rgba(255, 255, 255, 0.35)' : 'var(--neu-border)'}`,
    boxShadow: focused ? 'var(--neu-pressed-sm), 0 0 0 3px rgba(255, 255, 255, 0.08)' : 'var(--neu-pressed-sm)',
    color: '#ffffff',
    outline: 'none',
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--neu-base)', color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      {/* Neumorphic Header Plate */}
      <header style={{
        borderBottom: '1px solid var(--neu-border)',
        background: 'var(--neu-surface)',
        boxShadow: 'var(--neu-flat-xs)',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#ffffff' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--neu-sunken)',
              border: '1px solid var(--neu-border)',
              boxShadow: 'var(--neu-pressed-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img src="/logo.jpg" alt="JBSnap" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.3px' }}>
              JB<span style={{ color: '#a1a1aa' }}>Snap</span>
              <span style={{
                color: 'var(--text-muted)',
                marginLeft: 8,
                fontWeight: 600,
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 6,
                background: 'var(--neu-sunken)',
                border: '1px solid var(--neu-border)'
              }}>Support</span>
            </span>
          </Link>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 10,
              background: 'var(--neu-grad-convex)',
              border: '1px solid var(--neu-border-bevel)',
              boxShadow: 'var(--neu-flat-xs)',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = 'var(--neu-flat-sm)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--neu-flat-xs)';
            }}
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '64px 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 8,
            background: 'var(--neu-sunken)',
            boxShadow: 'var(--neu-pressed-sm)',
            border: '1px solid var(--neu-border)',
            fontSize: 11,
            fontWeight: 800,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 16
          }}>
            <MessageSquare size={12} color="#ffffff" /> Direct Official Contact
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1.2px', margin: '0 0 16px', color: '#ffffff' }}>Get in Touch With Us</h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            Have questions about JBSnap, custom enterprise workflows, or technical support? All inquiries are routed directly to our inbox.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {/* Direct Email Card */}
          <div style={{
            background: 'var(--neu-surface)',
            border: '1px solid var(--neu-border-bevel)',
            boxShadow: 'var(--neu-flat-sm)',
            borderRadius: 20,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'var(--neu-sunken)',
                border: '1px solid var(--neu-border)',
                boxShadow: 'var(--neu-pressed-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                marginBottom: 24
              }}>
                <Mail size={22} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: '0 0 10px' }}>Official Inbox</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 24px' }}>
                All contact form submissions and direct email responses are dispatched to this designated address:
              </p>

              {/* Sunken Email Container */}
              <div style={{
                background: 'var(--neu-sunken)',
                border: '1px solid var(--neu-border)',
                boxShadow: 'var(--neu-pressed-sm)',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 24
              }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, color: '#ffffff', fontWeight: 600, wordBreak: 'break-all' }}>
                  {primaryEmail}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  style={{
                    background: copied ? 'rgba(16, 185, 129, 0.15)' : 'var(--neu-surface)',
                    border: '1px solid ' + (copied ? 'rgba(16, 185, 129, 0.4)' : 'var(--neu-border-bevel)'),
                    boxShadow: 'var(--neu-flat-xs)',
                    color: copied ? '#10b981' : '#ffffff',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{
              paddingTop: 20,
              borderTop: '1px solid var(--neu-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#34d399',
              fontSize: 13,
              fontWeight: 600
            }}>
              <ShieldCheck size={18} /> Verified Direct Receiving Inbox
            </div>
          </div>

          {/* Form Card */}
          <div style={{
            background: 'var(--neu-surface)',
            border: '1px solid var(--neu-border-bevel)',
            boxShadow: 'var(--neu-flat-sm)',
            borderRadius: 20,
            padding: 32
          }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'var(--neu-sunken)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  boxShadow: 'var(--neu-pressed-sm)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <Check size={28} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', marginBottom: 12 }}>Message Dispatched!</h3>
                <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                  Your message has been routed to <strong style={{ color: '#ffffff' }}>{primaryEmail}</strong>. Our engineering team will review it and reply directly to <strong style={{ color: '#ffffff' }}>{email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => { setSent(false); setMessage(''); }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 12,
                    background: 'var(--neu-grad-convex)',
                    border: '1px solid var(--neu-border-bevel)',
                    boxShadow: 'var(--neu-flat-xs)',
                    color: '#ffffff',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {errorMsg && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'rgba(248, 113, 113, 0.1)',
                    border: '1px solid rgba(248, 113, 113, 0.25)',
                    color: '#f87171',
                    fontSize: 13
                  }}>
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    placeholder="Alex Morgan"
                    style={getInputStyle(nameFocused)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="alex@company.com"
                    style={getInputStyle(emailFocused)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    onFocus={() => setSubjectFocused(true)}
                    onBlur={() => setSubjectFocused(false)}
                    placeholder="Question about JBSnap API Gateway"
                    style={getInputStyle(subjectFocused)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onFocus={() => setMessageFocused(true)}
                    onBlur={() => setMessageFocused(false)}
                    placeholder="How can we help your engineering team?"
                    style={{
                      ...getInputStyle(messageFocused),
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 12,
                    background: 'var(--neu-grad-convex)',
                    border: '1px solid var(--neu-border-bevel)',
                    boxShadow: 'var(--neu-flat-sm)',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 6,
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={e => {
                    if (!submitting) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = 'var(--neu-flat)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--neu-flat-sm)';
                  }}
                >
                  <Send size={16} />
                  {submitting ? 'Routing Message...' : 'Send Message'}
                </button>

                <p style={{ fontSize: 11.5, color: 'var(--text-faint)', textAlign: 'center', margin: '4px 0 0' }}>
                  All inquiries route to {primaryEmail}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
