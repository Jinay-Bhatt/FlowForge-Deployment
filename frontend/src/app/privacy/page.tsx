'use client';

import Link from 'next/link';
import { Lock, Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Information We Collect',
      content:
        'We collect account email addresses and cryptographic password hashes required for user authentication. When you save third-party integration secrets (such as GitHub personal access tokens or external database connection URIs), these are stored as encrypted blobs and never indexed or inspected.',
    },
    {
      title: '2. Code and Telemetry Privacy',
      content:
        'Your visual schemas, custom JavaScript node code, and exported Fastify artifacts remain completely private to your account. JBSnap does not use your private workflow logic, endpoint schemas, or proprietary business logic to train artificial intelligence models.',
    },
    {
      title: '3. Gateway Execution Logs',
      content:
        'Live execution telemetry (status codes, request latencies, and system trace payloads) is temporarily buffered in memory to power your real-time analytics monitors. Telemetry retention is strictly limited to your plan tier (up to 7 days for Pro accounts) and permanently purged thereafter.',
    },
    {
      title: '4. Third-Party Integrations',
      content:
        'When you connect GitHub or GitLab to automate repository commits, JBSnap only requests the minimum OAuth and repository scopes required to push generated TypeScript files to your designated branch.',
    },
    {
      title: '5. Data Security Architecture',
      content:
        'All traffic traversing the JBSnap gateway is encrypted in transit via TLS 1.3. Database connection pools and sensitive credentials are encrypted at rest with AES-256-GCM. We conduct automated vulnerability scans across our microservice mesh.',
    },
    {
      title: '6. Your Rights and Data Deletion',
      content:
        'You retain the right to export your complete workspace manifests and delete your account at any time. Triggering an account deletion permanently scrubs all associated projects, workflows, and encrypted credentials across our primary databases and backups within 48 hours.',
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
          <Lock size={12} color="#ffffff" /> Privacy Policy
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-1px', margin: '0 0 12px 0' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14.5, color: 'var(--text-muted)', marginBottom: 44, lineHeight: 1.7 }}>
          Last updated: September 21, 2026. This policy outlines our strict commitments to data isolation, credential encryption, and developer ownership.
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
            Have questions regarding how your data is handled or encrypted? Contact our security team at <a href="mailto:dualithjbsnap@gmail.com" style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 600 }}>dualithjbsnap@gmail.com</a>.
          </div>
        </div>
      </main>
    </div>
  );
}
