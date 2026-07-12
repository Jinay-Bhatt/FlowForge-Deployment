'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, Cell,
} from 'recharts';
import { api } from '../../../../services/api';
import { Hash, CheckCircle, Zap, TriangleAlert, BarChart2 } from 'lucide-react';

const RANGE_OPTIONS = [
  { label: '24h', value: '24h' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
];

function AnimatedCounter({ value, suffix = '', duration = 650 }: { value: number | string, suffix?: string, duration?: number }) {
  const numValue = typeof value === 'number' ? value : parseInt(value.replace(/[^0-9]/g, '')) || 0;
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

  return <span>{displayValue.toLocaleString()}{suffix}</span>;
}

function MetricCard({ icon, label, value, sub, theme }: any) {
  // Extract number and suffix (like % or ms)
  const isPercent = typeof value === 'string' && value.includes('%');
  const isMs = typeof value === 'string' && value.includes('ms');
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/,/g, '')) || 0;
  const suffix = isPercent ? '%' : isMs ? 'ms' : '';

  const accentColor = theme === 'cyan' ? '#38bdf8' : theme === 'emerald' ? '#10b981' : theme === 'amber' ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      background: '#09090b',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--mono)' }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', lineHeight: 1, fontFamily: 'var(--mono)' }}>
            <AnimatedCounter value={numericValue} suffix={suffix} />
          </div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--mono)' }}>{sub.toUpperCase()}</div>}
        </div>
        <div style={{ fontSize: 20, color: accentColor }}>{icon}</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#09090b', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontSize: 11, fontFamily: 'var(--mono)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color === 'var(--neon-cyan)' ? '#ffffff' : p.color === 'var(--neon-rose)' ? '#ef4444' : p.color, fontWeight: 700 }}>{p.name.toUpperCase()}: {p.value}</div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [range, setRange] = useState('7d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    loadAnalytics();
  }, [projectId, range]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.analytics.get(projectId, { range });
      setData(res);
    } finally { setLoading(false); }
  };

  const s = data?.summary;

  return (
    <div style={{ height: 'calc(100vh - 100px)', overflowY: 'auto', background: 'var(--bg-base)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: '#09090b' }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}><BarChart2 size={16} /> Analytics</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>API traffic metrics and performance insights</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {RANGE_OPTIONS.map(r => (
            <button key={r.value} onClick={() => setRange(r.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: range === r.value ? 'none' : '1px solid var(--border)',
                background: range === r.value ? '#ffffff' : 'transparent',
                color: range === r.value ? '#000000' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { if(range !== r.value) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#ffffff'; } else { e.currentTarget.style.background = '#cbd5e1'; } }}
              onMouseLeave={e => { if(range !== r.value) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } else { e.currentTarget.style.background = '#ffffff'; } }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Summary cards */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: '12px' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
            <MetricCard icon={<Hash size={20} />} label="Total Requests" value={s?.totalRequests?.toLocaleString() || 0} theme="cyan" />
            <MetricCard icon={<CheckCircle size={20} />} label="Success Rate" value={`${s?.successRate || 100}%`} sub={`${s?.totalRequests - s?.totalErrors || 0} successful`} theme="emerald" />
            <MetricCard icon={<Zap size={20} />} label="Avg Latency" value={`${s?.avgLatency || 0}ms`} sub={`p95: ${s?.p95Latency || 0}ms`} theme="amber" />
            <MetricCard icon={<TriangleAlert size={20} />} label="Error Rate" value={`${s?.errorRate || 0}%`} sub={`${s?.totalErrors || 0} errors`} theme="rose" />
          </div>
        )}

        {/* Traffic Trend */}
        <div style={{ padding: 24, background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 20, fontFamily: 'var(--mono)' }}>TRAFFIC TREND METRICS</div>
          {loading ? <div className="skeleton" style={{ height: 220, borderRadius: '6px' }} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.dailyTrend || []}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="requests" name="Requests" stroke="#ffffff" fill="url(#reqGrad)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="errors" name="Errors" stroke="#ef4444" fill="url(#errGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Top Routes */}
          <div style={{ padding: 24, background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 20, fontFamily: 'var(--mono)' }}>HOT API ROUTES</div>
            {loading ? <div className="skeleton" style={{ height: 200, borderRadius: '6px' }} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(data?.topRoutes || []).slice(0, 6)} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="route" tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Requests" radius={[0, 4, 4, 0]}>
                    {(data?.topRoutes || []).slice(0,6).map((_: any, i: number) => (
                      <Cell key={i} fill={`rgba(255, 255, 255, ${0.3 + (i * 0.12)})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Hourly heatmap */}
          <div style={{ padding: 24, background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 20, fontFamily: 'var(--mono)' }}>HOURLY LOAD DISTRIBUTION</div>
            {loading ? <div className="skeleton" style={{ height: 200, borderRadius: '6px' }} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.hourlyDistribution || []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} tickFormatter={h => `${h}h`} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} labelFormatter={h => `${h}:00`} />
                  <Bar dataKey="count" name="Requests" radius={[2, 2, 0, 0]}>
                    {(data?.hourlyDistribution || []).map((d: any, i: number) => (
                      <Cell key={i} fill={`rgba(255, 255, 255, ${0.2 + (d.count / (Math.max(...(data?.hourlyDistribution || []).map((x:any)=>x.count), 1))) * 0.7})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Latency trend */}
        <div style={{ padding: 24, background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 20, fontFamily: 'var(--mono)' }}>RESPONSE LATENCY HEURISTICS</div>
          {loading ? <div className="skeleton" style={{ height: 180, borderRadius: '6px' }} /> : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data?.dailyTrend || []}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} unit="ms" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avgLatency" name="Avg Latency" stroke="#ffffff" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
