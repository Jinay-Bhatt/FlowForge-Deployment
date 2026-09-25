'use client';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Tag, Calendar } from 'lucide-react';

export default function ChangelogPage() {
  const updates = [
    {
      version: 'v1.2.0',
      date: 'July 5, 2026',
      title: 'Neon DB Integration & Real-time Websocket Analytics',
      desc: 'Seamlessly bind your Neon serverless databases to visual endpoints, and view socket telemetry streaming immediately on trigger events.'
    },
    {
      version: 'v1.1.4',
      date: 'June 22, 2026',
      title: 'V8 Sandboxed Code Nodes',
      desc: 'Custom JS logic now runs inside highly secure V8 isolates with absolute protection from process and file system leakage.'
    },
    {
      version: 'v1.0.0',
      date: 'May 12, 2026',
      title: 'Visual API Builder Launch',
      desc: 'Create, validate, secure, and deploy Fastify + Prisma + TypeScript codebases visual-first.'
    }
  ];

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
              }}>Changelog</span>
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
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 96px' }}>
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
          <Sparkles size={12} color="#ffffff" /> Product Updates
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-1.2px', margin: '0 0 16px 0', color: '#ffffff' }}>Release Notes & Changelog</h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 48 }}>
          Stay up to date with new features, visual pipeline improvements, engine enhancements, and runtime releases.
        </p>

        {/* Neumorphic Timeline */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          borderLeft: '2px solid var(--neu-border)',
          paddingLeft: 32,
          marginLeft: 12
        }}>
          {updates.map(up => (
            <div key={up.version} style={{ position: 'relative' }}>
              {/* Tactile Bullet Node */}
              <div style={{
                position: 'absolute',
                left: -42,
                top: 20,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'var(--neu-surface)',
                border: '2px solid #ffffff',
                boxShadow: 'var(--neu-flat-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff' }} />
              </div>

              {/* Neumorphic Extruded Update Card */}
              <div style={{
                background: 'var(--neu-surface)',
                border: '1px solid var(--neu-border-bevel)',
                borderRadius: 16,
                padding: '24px 28px',
                boxShadow: 'var(--neu-flat-sm)',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                    <Calendar size={13} /> {up.date}
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#ffffff',
                    background: 'var(--neu-sunken)',
                    boxShadow: 'var(--neu-pressed-sm)',
                    border: '1px solid var(--neu-border)',
                    padding: '3px 10px',
                    borderRadius: 8,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    <Tag size={11} /> {up.version}
                  </div>
                </div>

                <h2 style={{ fontSize: 19, fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0', letterSpacing: '-0.3px' }}>
                  {up.title}
                </h2>
                <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  {up.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
