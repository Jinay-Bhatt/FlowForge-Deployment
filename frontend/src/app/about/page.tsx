'use client';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#020202', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      {/* Mini header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#ffffff' }}>
            <img src="/FlowForge.png" alt="FlowForge" width={24} height={24} />
            <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Flow<span style={{ background: 'linear-gradient(135deg,#ffffff,#a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forge</span><span style={{ color: '#94a3b8', marginLeft: 6, fontWeight: 500, fontSize: 13.5 }}>Company</span>
            </span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Back to Home</Link>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '80px 32px' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>About Us</span>
        <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-1.5px', margin: '8px 0 24px 0', color: '#ffffff' }}>Company Vision</h1>
        <p style={{ fontSize: 17, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 24 }}>
          At FlowForge, we believe database and backend integration should be direct, fast, and visual.
        </p>
        <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 40 }}>
          Traditional integration workflows require writing boilerplate, configuring routing servers, maintaining schema migrations, and managing deployment pipelines. FlowForge replaces all of that with a visual DAG workflow editor that compiles directly to production-grade Fastify + TypeScript code bases.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 56 }}>
          <div style={{ padding: 24, borderRadius: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0' }}>Our Mission</h3>
            <p style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>To empower developers to deploy custom API gateways in under 60 seconds with absolute performance confidence.</p>
          </div>
          <div style={{ padding: 24, borderRadius: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0' }}>Our Commitment</h3>
            <p style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>Zero vendor lock-in. Visual design compiles to clean Fastify + TypeScript that you can export and host anywhere.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
