'use client';
import Link from 'next/link';
import { ArrowLeft, Compass, Target, Shield, Mail, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const contactEmail = 'dualithjbsnap@gmail.com';

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
              }}>Company</span>
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
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '64px 24px 96px' }}>
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
          <Compass size={12} color="#ffffff" /> About Us
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-1.2px', margin: '0 0 20px 0', color: '#ffffff' }}>Company Vision</h1>
        <p style={{ fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 20 }}>
          At JBSnap, we believe database and backend integration should be direct, instantaneous, and visual.
        </p>
        <p style={{ fontSize: 15.5, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 44 }}>
          Traditional integration workflows require writing boilerplate, configuring routing servers, maintaining schema migrations, and managing deployment pipelines. JBSnap replaces all of that with an intuitive, visual DAG workflow editor that compiles directly to production-grade Fastify + TypeScript codebases.
        </p>

        {/* Feature Cards Grid (Neumorphic Extrusions) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 48 }}>
          <div style={{
            padding: 28,
            borderRadius: 16,
            background: 'var(--neu-surface)',
            border: '1px solid var(--neu-border-bevel)',
            boxShadow: 'var(--neu-flat-sm)'
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--neu-sunken)',
              border: '1px solid var(--neu-border)',
              boxShadow: 'var(--neu-pressed-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: 16
            }}>
              <Target size={20} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0' }}>Our Mission</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              To empower developers and engineering teams to design and deploy custom API gateways in under 60 seconds with absolute performance confidence.
            </p>
          </div>

          <div style={{
            padding: 28,
            borderRadius: 16,
            background: 'var(--neu-surface)',
            border: '1px solid var(--neu-border-bevel)',
            boxShadow: 'var(--neu-flat-sm)'
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--neu-sunken)',
              border: '1px solid var(--neu-border)',
              boxShadow: 'var(--neu-pressed-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: 16
            }}>
              <Shield size={20} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0' }}>Our Commitment</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              Zero vendor lock-in. Visual design compiles to clean, type-safe Fastify + Prisma + TypeScript code that you can freely export and self-host anywhere.
            </p>
          </div>
        </div>

        {/* Tactile Contact Callout Box */}
        <div style={{
          padding: '28px 32px',
          borderRadius: 20,
          background: 'var(--neu-surface)',
          border: '1px solid var(--neu-border-bevel)',
          boxShadow: 'var(--neu-flat)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>
              Have Questions or Feedback?
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} /> Official Support:
              <span style={{
                color: '#ffffff',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                background: 'var(--neu-sunken)',
                padding: '2px 8px',
                borderRadius: 6,
                border: '1px solid var(--neu-border)'
              }}>{contactEmail}</span>
            </div>
          </div>

          <Link
            href="/contact"
            style={{
              padding: '12px 22px',
              borderRadius: 12,
              background: 'var(--neu-grad-convex)',
              border: '1px solid var(--neu-border-bevel)',
              boxShadow: 'var(--neu-flat-xs)',
              color: '#ffffff',
              fontSize: 13.5,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = 'var(--neu-flat-sm)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--neu-flat-xs)';
            }}
          >
            Contact Support <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
