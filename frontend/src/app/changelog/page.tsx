'use client';
import Link from 'next/link';

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
    <div style={{ minHeight: '100vh', background: '#020202', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      {/* Mini header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#ffffff' }}>
            <img src="/FlowForge.png" alt="FlowForge" width={24} height={24} />
            <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Flow<span style={{ background: 'linear-gradient(135deg,#ffffff,#a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forge</span><span style={{ color: '#94a3b8', marginLeft: 6, fontWeight: 500, fontSize: 13.5 }}>Changelog</span>
            </span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Back to Home</Link>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '80px 32px' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Changelog</span>
        <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-1.5px', margin: '8px 0 36px 0', color: '#ffffff' }}>Product Updates</h1>
        <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 56 }}>
          Stay up to date with new features, visual designer improvements, and CLI release notes.
        </p>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48, borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 32, marginLeft: 8 }}>
          {updates.map(up => (
            <div key={up.version} style={{ position: 'relative' }}>
              {/* Bullet node */}
              <div style={{ position: 'absolute', left: -41, top: 4, width: 18, height: 18, borderRadius: '50%', background: '#020202', border: '3.5px solid #6366f1' }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>{up.date}</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0' }}>{up.title} <span style={{ fontSize: 12.5, fontWeight: 800, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '2px 8px', borderRadius: 99, marginLeft: 8 }}>{up.version}</span></h2>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{up.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
