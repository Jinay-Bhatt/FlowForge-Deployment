'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../services/api';
import CustomSelect from '../../../../components/CustomSelect';
import { Key, Info, Shield } from 'lucide-react';

export default function GatewayPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWfId, setSelectedWfId] = useState('');
  const [config, setConfig] = useState<any>({ requireJwt: false, requireApiKey: false, apiKeyValue: '', rateLimitLimit: '', rateLimitWindow: '', corsEnabled: true, allowedOrigins: '*' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    api.workflows.list(projectId).then(list => {
      setWorkflows(list);
      if (list.length > 0) setSelectedWfId(list[0].id);
    });
  }, [projectId]);

  useEffect(() => {
    if (!selectedWfId) return;
    setLoading(true);
    api.workflows.gatewayConfig(selectedWfId).then(cfg => {
      if (cfg) setConfig({ requireJwt: cfg.requireJwt || false, requireApiKey: cfg.requireApiKey || false, apiKeyValue: '', rateLimitLimit: cfg.rateLimitLimit || '', rateLimitWindow: cfg.rateLimitWindow || '', corsEnabled: cfg.corsEnabled !== false, allowedOrigins: cfg.allowedOrigins || '*' });
      else setConfig({ requireJwt: false, requireApiKey: false, apiKeyValue: '', rateLimitLimit: '', rateLimitWindow: '', corsEnabled: true, allowedOrigins: '*' });
    }).finally(() => setLoading(false));
  }, [selectedWfId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.workflows.updateGatewayConfig(selectedWfId, { ...config, rateLimitLimit: config.rateLimitLimit ? parseInt(config.rateLimitLimit) : null, rateLimitWindow: config.rateLimitWindow ? parseInt(config.rateLimitWindow) : null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const Toggle = ({ label, sub, field }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>{label.toUpperCase().replace(/ /g, '_')}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--mono)' }}>{sub.toUpperCase()}</div>}
      </div>
      <button onClick={() => setConfig((p: any) => ({ ...p, [field]: !p[field] }))}
        style={{
          padding: '6px 14px',
          border: config[field] ? 'none' : '1px solid var(--border)',
          background: config[field] ? '#ffffff' : 'rgba(255,255,255,0.02)',
          color: config[field] ? '#000000' : 'var(--text-muted)',
          cursor: 'pointer',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          fontWeight: 700,
          borderRadius: '6px',
          letterSpacing: '0.08em',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          if (!config[field]) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          } else {
            e.currentTarget.style.background = '#cbd5e1';
          }
        }}
        onMouseLeave={e => {
          if (!config[field]) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            e.currentTarget.style.borderColor = 'var(--border)';
          } else {
            e.currentTarget.style.background = '#ffffff';
          }
        }}
      >
        {config[field] ? 'ACTIVE' : 'DISABLED'}
      </button>
    </div>
  );

  const selectedWf = workflows.find(w => w.id === selectedWfId);

  return (
    <div style={{ height: 'calc(100vh - 104px)', overflowY: 'auto', background: 'var(--bg-base)', fontFamily: 'Inter, sans-serif' }}>
      {/* Visual Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: '#09090b', position: 'relative' }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px', fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} /> API Gateway Configuration</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Configure security controls, rate limiting, and CORS headers per endpoint.</p>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Workflow selector capsule */}
        <div style={{ padding: '20px 24px', background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'var(--mono)' }}>ACTIVE_ENDPOINT_WORKFLOW</label>
          <CustomSelect
            value={selectedWfId}
            onChange={(val) => setSelectedWfId(val)}
            options={workflows.map(wf => ({
              value: wf.id,
              label: `${wf.method} ${wf.path} — ${wf.name}`,
              method: wf.method,
              badge: wf.isPublished ? 'LIVE' : undefined,
              badgeColor: '#10b981'
            }))}
          />
          {selectedWf && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <span className={selectedWf.isPublished ? 'badge badge-success' : 'badge badge-accent'} style={{ fontSize: 10, background: selectedWf.isPublished ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)', color: selectedWf.isPublished ? '#10b981' : 'var(--text-muted)', border: `1px solid ${selectedWf.isPublished ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)'}`, padding: '2px 8px', borderRadius: '4px' }}>
                {selectedWf.isPublished ? 'Published' : 'Draft'}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 10, padding: '2px 8px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace" }}>ID: {selectedWf.id.slice(0,8)}...</span>
            </div>
          )}
        </div>

        {loading ? <div className="skeleton" style={{ height: 320, borderRadius: '12px' }} /> : (
          <>
            {/* Auth section */}
            <div style={{ padding: '24px 28px', background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)' }}>AUTHENTICATION_CONTROLS</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Require credentials to invoke this API endpoint.</div>
              <Toggle label="Require JWT Bearer Token" sub="Verify Authorization: Bearer <JWT> token on requests" field="requireJwt" />
              <Toggle label="Require API Key" sub="Verify custom x-api-key header credentials" field="requireApiKey" />
              
              {config.requireApiKey && (
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>SECURE_API_KEY_VALUE</label>
                  <div style={{
                    position: 'relative',
                    background: '#030303',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <input type="password" value={config.apiKeyValue} onChange={e => setConfig((p: any) => ({ ...p, apiKeyValue: e.target.value }))} placeholder="••••••••••••••••••••••••••••••••"
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#ffffff', fontSize: 13, outline: 'none', fontFamily: 'var(--mono)' }} />
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Key size={10} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                    <span>Leaving it blank will retain the previously saved secure API key.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Rate limiting */}
            <div style={{ padding: '24px 28px', background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)' }}>RATE_LIMITING_LIMITS</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Throttle request volume per client IP to prevent abuse.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {[{ label: 'Max Requests', key: 'rateLimitLimit', placeholder: 'e.g. 100' }, { label: 'Window (seconds)', key: 'rateLimitWindow', placeholder: 'e.g. 60' }].map(f => (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{f.label}</label>
                    <div style={{
                      position: 'relative',
                      background: '#030303',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <input type="number" value={config[f.key]} onChange={e => setConfig((p: any) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#ffffff', fontSize: 13, outline: 'none', fontFamily: 'var(--mono)' }} />
                    </div>
                  </div>
                ))}
              </div>
              {config.rateLimitLimit && config.rateLimitWindow && (
                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)' }}>
                  <Info size={12} style={{ flexShrink: 0 }} />
                  <span>Endpoint configured for {config.rateLimitLimit} requests every {config.rateLimitWindow} seconds per IP.</span>
                </div>
              )}
            </div>

            {/* CORS */}
            <div style={{ padding: '24px 28px', background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)' }}>CROSS_ORIGIN_RESOURCE_POLICIES</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Manage which web applications are permitted to call this endpoint.</div>
              <Toggle label="Enable CORS headers" sub="Authorize cross-origin requests & preflight prechecks" field="corsEnabled" />
              {config.corsEnabled && (
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Allowed Origins</label>
                  <div style={{
                    position: 'relative',
                    background: '#030303',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <input value={config.allowedOrigins} onChange={e => setConfig((p: any) => ({ ...p, allowedOrigins: e.target.value }))} placeholder="* or https://my-client-app.com"
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#ffffff', fontSize: 13, outline: 'none', fontFamily: 'var(--mono)' }} />
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleSave} disabled={saving || !selectedWfId}
              style={{
                padding: '14px',
                background: saving ? '#1e293b' : saved ? 'rgba(16,185,129,0.1)' : '#ffffff',
                color: saving ? '#475569' : saved ? '#10b981' : '#000000',
                border: saved ? '1px solid rgba(16,185,129,0.2)' : 'none',
                fontFamily: 'var(--mono)',
                fontSize: 13,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: '6px',
                transition: 'all 0.15s ease',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = saved ? 'rgba(16,185,129,0.15)' : '#cbd5e1'; }}}
              onMouseLeave={e => { e.currentTarget.style.background = saving ? '#1e293b' : saved ? 'rgba(16,185,129,0.1)' : '#ffffff'; }}
            >
              {saving ? 'COMMITTING CONFIGURATION...' : saved ? 'GATEWAY CONFIGURATION COMMITTED SUCCESS' : 'SAVE GATEWAY CONFIG'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
