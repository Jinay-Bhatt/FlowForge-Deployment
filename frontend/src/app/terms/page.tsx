'use client';

import Link from 'next/link';
import { Shield, FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      title: '1. Service Scope and Ownership',
      content:
        'JBSnap provides visual API design, node graph compilation, and serverless gateway execution tools. All TypeScript, Fastify, and Prisma code generated or exported through the platform is 100% your intellectual property. JBSnap claims no ownership or license rights over code you export.',
    },
    {
      title: '2. Sandbox and Execution Limits',
      content:
        'Custom JavaScript logic executed within visual nodes runs in isolated V8 sandbox environments. Each execution is subject to a hard 200ms CPU timeout and strictly restricted memory parameters. Scripts attempting filesystem access, network circumvention, or infinite loops will be terminated automatically.',
    },
    {
      title: '3. Account Security and Credentials',
      content:
        'You are responsible for safeguarding your authentication credentials, API keys, and repository personal access tokens. JBSnap encrypts all stored secrets at rest using AES-256 and never exposes decrypted keys in client-side bundles or public endpoints.',
    },
    {
      title: '4. Gateway Usage and Fair Rate Limits',
      content:
        'The JBSnap hosted edge gateway enforces per-plan throughput and rate limits to guarantee quality of service across all users. Automated abuse, denial of service attacks, or unauthorized scanning against platform infrastructure will result in immediate API key suspension.',
    },
    {
      title: '5. Availability and Service Guarantees',
      content:
        'While we strive for 99.9% uptime across production gateway endpoints, free-tier services are provided without express warranty. For mission-critical workloads, we encourage exporting source code directly to your private cloud infrastructure.',
    },
    {
      title: '6. Modifications and Termination',
      content:
        'We may update these terms periodically to reflect new features or security requirements. You may terminate your account at any time from your settings panel, which will purge your projects and encrypted credentials from our primary databases.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--neu-base)', color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      {/* Neumorphic Header Plate */}
      <header style={{
        borderBottom: '1px solid var(--neu-border)',
        background: 'var(--neu-surface)',
        boxShadow: 'var(--neu-flat-xs)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 60,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ maxWidth: 1080, width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#ffffff' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'var(--neu-sunken)',
              border: '1px solid var(--neu-border)',
              boxShadow: 'var(--neu-pressed-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img src="/logo.jpg" alt="JBSnap" width={22} height={22} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 900 }}>JB<span style={{ color: '#a1a1aa' }}>Snap</span></span>
            <span style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              border: '1px solid var(--neu-border)',
              background: 'var(--neu-sunken)',
              boxShadow: 'var(--neu-pressed-sm)',
              padding: '2px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700
            }}>Legal</span>
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

      {/* Main Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 96px' }}>
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
          <FileText size={12} color="#ffffff" /> Terms of Service
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-1px', margin: '0 0 12px 0' }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 14.5, color: 'var(--text-muted)', marginBottom: 44, lineHeight: 1.7 }}>
          Last updated: September 21, 2026. Please read these terms carefully before utilizing the JBSnap platform, visual pipeline compiler, or edge gateway.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sections.map((s) => (
            <div
              key={s.title}
              style={{
                padding: '24px 28px',
                borderRadius: 16,
                background: 'var(--neu-surface)',
                border: '1px solid var(--neu-border-bevel)',
                boxShadow: 'var(--neu-flat-sm)',
              }}
            >
              <h2 style={{ fontSize: 16.5, fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.2px' }}>
                {s.title}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                {s.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer info box */}
        <div style={{
          marginTop: 48,
          padding: '20px 24px',
          borderRadius: 16,
          background: 'var(--neu-surface)',
          border: '1px solid var(--neu-border-bevel)',
          boxShadow: 'var(--neu-flat-xs)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
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
            color: '#34d399',
            flexShrink: 0
          }}>
            <Shield size={18} />
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Questions regarding our terms or licensing agreements? Reach out to our engineering team at <a href="mailto:dualithjbsnap@gmail.com" style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 600 }}>dualithjbsnap@gmail.com</a>.
          </div>
        </div>
      </main>
    </div>
  );
}
