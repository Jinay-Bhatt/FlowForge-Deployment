'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { api, BASE_URL_DIRECT } from '../../../../services/api';
import { Radio, Play, Pause, Trash2 } from 'lucide-react';

const STATUS_COLOR = (s: number) => s >= 500 ? '#ef4444' : s >= 400 ? '#f59e0b' : '#10b981';


function AnimatedCounter({ value, duration = 600 }: { value: number | string, duration?: number }) {
  const isMs = typeof value === 'string' && value.endsWith('ms');
  const numValue = typeof value === 'number' ? value : parseInt(value as string) || 0;
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const startVal = displayValue;
    const diff = numValue - startVal;
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(startVal + diff * ease));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [numValue]);

  if (value === '-') return <span>-</span>;
  return <span>{displayValue.toLocaleString()}{isMs ? 'ms' : ''}</span>;
}

function LivePulseBar({ paused }: { paused: boolean }) {
  return (
    <div style={{ height: 1, width: '100%', background: 'rgba(255, 255, 255, 0.06)', position: 'relative', overflow: 'hidden' }}>
      {!paused && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '30%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
          animation: 'shimmer 1.5s infinite linear',
        }} />
      )}
    </div>
  );
}

export default function MonitorPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [logs, setLogs] = useState<any[]>([]);
  const [paused, setPaused] = useState(false);
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!projectId) return;
    loadDbLogs();
    const socket = io(BASE_URL_DIRECT);
    socket.on('connect', () => socket.emit('join-project', projectId));
    socket.on('metrics', (m: any) => {
      if (!pausedRef.current) setLogs(p => [{ ...m, id: m.id || Math.random().toString(), ts: new Date().toISOString() }, ...p].slice(0, 200));
    });
    return () => { socket.disconnect(); };
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadDbLogs = async () => {
    setLoading(true);
    try {
      const res = await api.analytics.logs(projectId, { limit: 100, status: filter === 'all' ? undefined : filter });
      setDbLogs(res.logs || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadDbLogs(); }, [filter]);

  const allLogs = logs.length > 0 ? logs : dbLogs;

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: '#09090b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radio size={18} style={{ color: '#ffffff' }} />
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: 0 }}>Live Monitor</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>Real-time gateway request stream</p>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'success', 'error'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: filter === f ? 'none' : '1px solid var(--border)',
                  background: filter === f ? '#ffffff' : 'transparent',
                  color: filter === f ? '#000000' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { if(filter !== f) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#ffffff'; } else { e.currentTarget.style.background = '#cbd5e1'; } }}
                onMouseLeave={e => { if(filter !== f) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } else { e.currentTarget.style.background = '#ffffff'; } }}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setPaused(p => !p)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: `1px solid ${paused ? '#f59e0b' : 'var(--border)'}`,
              background: 'transparent',
              color: paused ? '#f59e0b' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
            <span>{paused ? 'Resume' : 'Pause'}</span>
          </button>
          <button onClick={() => setLogs([])}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
          {/* Live dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)', border: `1px solid ${paused ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}` }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: paused ? '#f59e0b' : '#10b981' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: paused ? '#f59e0b' : '#10b981' }}>{paused ? 'PAUSED' : 'LIVE'}</span>
          </div>
        </div>
      </div>

      <LivePulseBar paused={paused} />

      {/* Log table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px', background: '#020202' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 90px 70px 180px 90px 120px 1fr', gap: 12, padding: '12px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: '#020202', zIndex: 5, fontFamily: 'var(--mono)' }}>
          {['Timestamp', 'Packet', 'Method', 'Route', 'Status', 'Latency', 'Workflow'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{h.toUpperCase()}</span>
          ))}
        </div>

        {loading && dbLogs.length === 0 ? (
          <div style={{ padding: 24 }}>
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 36, borderRadius: '6px', marginBottom: 6 }} />)}
          </div>
        ) : allLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>SYSTEMS_IDLE // NO_TELEMETRY_FEEDS</p>
          </div>
        ) : (
          allLogs.map((log: any, i) => {
            const status = log.responseStatus || log.status;
            const statusColor = status >= 500 ? '#ef4444' : status >= 400 ? '#f59e0b' : '#10b981';
            const methodColor = { GET: '#10b981', POST: '#ffffff', PUT: '#f59e0b', DELETE: '#ef4444', PATCH: '#a78bfa' }[log.method as string] || 'var(--text-muted)';
            const latencyVal = log.latencyMs || log.latency || 0;
            const pktId = `0x${(log.id || 'FF').replace(/-/g, '').substring(0, 6).toUpperCase()}`;

            return (
              <div key={log.id || log.ts || log.timestamp || i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 90px 70px 180px 90px 120px 1fr',
                  gap: 12,
                  padding: '10px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.02)',
                  background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  alignItems: 'center',
                  borderLeft: '3px solid transparent'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderLeftColor = '#ffffff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{new Date(log.createdAt || log.ts || log.timestamp).toLocaleTimeString()}</span>
                <span style={{ color: '#ffffff', opacity: 0.7 }}>{pktId}</span>
                <span style={{ color: methodColor, fontWeight: 700, fontSize: 10 }}>{log.method}</span>
                <span style={{ color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.path}</span>
                <span style={{ color: statusColor, fontWeight: 700 }}>{status}</span>
                
                {/* Latency with mini graphical bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: latencyVal > 500 ? '#f59e0b' : 'var(--text-muted)', minWidth: 40 }}>{latencyVal}ms</span>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.04)', position: 'relative', width: 50, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${Math.min((latencyVal / 600) * 100, 100)}%`,
                      background: latencyVal > 400 ? '#ef4444' : latencyVal > 150 ? '#f59e0b' : '#10b981',
                    }} />
                  </div>
                </div>

                <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.workflow?.name?.toUpperCase() || log.workflowId?.substring(0, 8) || 'SANDBOX'}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer stats */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 24px', display: 'flex', gap: 28, background: '#09090b', fontFamily: 'var(--mono)', fontSize: 11 }}>
        {[
          { label: 'TOTAL_PACKETS', value: allLogs.length, color: '#ffffff' },
          { label: 'STATUS_OK', value: allLogs.filter((l: any) => (l.responseStatus || l.status) < 400).length, color: '#10b981' },
          { label: 'STATUS_ERR', value: allLogs.filter((l: any) => (l.responseStatus || l.status) >= 400).length, color: '#ef4444' },
          { label: 'AVG_LATENCY', value: allLogs.length ? Math.round(allLogs.reduce((a: number, l: any) => a + (l.latencyMs || l.latency || 0), 0) / allLogs.length) + 'ms' : '-', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>{s.label}:</span>
            <span style={{ fontWeight: 700, color: s.color }}>
              <AnimatedCounter value={s.value} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
