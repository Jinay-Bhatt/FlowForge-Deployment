'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../../../../services/api';
import { Link2, Network, Play, Pause, Trash2, X } from 'lucide-react';


const ServiceNode = ({ data }: any) => {
  const { name, baseUrl, isActive, routesCount } = data;
  const statusColor = isActive ? '#10b981' : '#64748b';
  const borderColor = isActive ? '#10b981' : 'rgba(255, 255, 255, 0.08)';
  
  return (
    <div style={{
      position: 'relative',
      background: '#09090b',
      border: `1px solid ${borderColor}`,
      borderRadius: '10px',
      padding: '12px 16px',
      minWidth: 180,
      boxShadow: isActive ? '0 0 16px rgba(16, 185, 129, 0.15)' : '0 4px 12px rgba(0,0,0,0.5)',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#09090b',
          border: `2px solid ${statusColor}`,
          left: -5,
        }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: statusColor,
        }} />
        <div style={{
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#ffffff',
          fontSize: 11,
        }}>
          {name}
        </div>
      </div>
      <div style={{
        fontSize: 9,
        color: '#64748b',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {baseUrl}
      </div>
      {routesCount > 0 && (
        <div style={{
          fontSize: 8.5,
          color: '#10b981',
          marginTop: 6,
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          paddingTop: 6,
          fontWeight: 600,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            {routesCount} ACTIVE PATHS
          </span>
        </div>
      )}

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#09090b',
          border: `2px solid ${statusColor}`,
          right: -5,
        }}
      />
    </div>
  );
};

const nodeTypes = {
  serviceNode: ServiceNode
};

export default function ServicesPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', baseUrl: '', description: '' });
  const [adding, setAdding] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isMinimapVisible, setIsMinimapVisible] = useState(false);
  const [showAddRouteSvcId, setShowAddRouteSvcId] = useState<string | null>(null);
  const [routeForm, setRouteForm] = useState({ path: '', method: 'GET', targetService: '', description: '' });
  const [addingRoute, setAddingRoute] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastZoomRef = useRef<number | null>(null);

  const onMove = useCallback((_event: any, viewport: any) => {
    const currentZoom = viewport.zoom;
    if (lastZoomRef.current !== null && lastZoomRef.current !== currentZoom) {
      setIsMinimapVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsMinimapVisible(false);
      }, 1500);
    }
    lastZoomRef.current = currentZoom;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => { if (projectId) loadServices(); }, [projectId]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const list = await api.services.list(projectId);
      setServices(list);
      buildGraph(list);
    } finally { setLoading(false); }
  };

  const buildGraph = (serviceList: any[]) => {
    const centerX = 400, centerY = 280, radius = 200;
    const newNodes: Node[] = serviceList.map((svc, i) => {
      const angle = (i / Math.max(serviceList.length, 1)) * 2 * Math.PI - Math.PI / 2;
      const x = serviceList.length === 1 ? centerX - 80 : centerX + radius * Math.cos(angle) - 80;
      const y = serviceList.length === 1 ? centerY - 40 : centerY + radius * Math.sin(angle) - 40;
      return {
        id: svc.id,
        type: 'serviceNode',
        position: { x, y },
        data: {
          name: svc.name,
          baseUrl: svc.baseUrl,
          isActive: svc.isActive,
          routesCount: svc.routes?.length || 0,
        },
      };
    });

    const newEdges: Edge[] = [];
    serviceList.forEach(svc => {
      (svc.routes || []).forEach((route: any, j: number) => {
        const target = serviceList.find((s: any) =>
          s.name === route.targetService || s.baseUrl.includes(route.targetService)
        );
        if (target && target.id !== svc.id) {
          newEdges.push({
            id: `e-${svc.id}-${target.id}-${j}`,
            source: svc.id,
            target: target.id,
            animated: true,
            label: `${route.method} ${route.path}`,
            style: { stroke: svc.isActive && target.isActive ? '#05ffc4' : '#334155', strokeWidth: 2 },
            labelStyle: { fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 },
            markerEnd: { type: MarkerType.ArrowClosed, color: svc.isActive && target.isActive ? '#05ffc4' : '#334155' },
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.services.create(projectId, form);
      await loadServices();
      setShowAdd(false);
      setForm({ name: '', baseUrl: '', description: '' });
    } catch (err: any) { alert(err.message); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete service "${name}"?`)) return;
    await api.services.delete(projectId, id);
    await loadServices();
  };

  const handleToggleActive = async (svc: any) => {
    await api.services.update(projectId, svc.id, { isActive: !svc.isActive });
    await loadServices();
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddRouteSvcId) return;
    setAddingRoute(true);
    try {
      await api.services.createRoute(projectId, showAddRouteSvcId, routeForm);
      await loadServices();
      setShowAddRouteSvcId(null);
    } catch (err: any) { alert(err.message); }
    finally { setAddingRoute(false); }
  };

  const handleDeleteRoute = async (serviceId: string, routeId: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    try {
      await api.services.deleteRoute(projectId, serviceId, routeId);
      await loadServices();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div style={{ height: 'calc(100vh - 104px)', display: 'flex', background: 'var(--bg-base)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div style={{ width: 340, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: '#09090b', flexShrink: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link2 size={13} style={{ color: '#ffffff' }} /> CORE SERVICES
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{services.length} ACTIVE NAMESPACES</div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: "'JetBrains Mono', monospace",
              borderRadius: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
          >+ Register</button>
        </div>

        <div className="scroll-area" style={{ flex: 1, padding: '16px' }}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 8, marginBottom: 12 }} />
            ))
          ) : services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--text-faint)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Network size={40} style={{ color: 'var(--text-faint)', marginBottom: 12 }} />
              <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)', margin: 0 }}>NO MESH NAMESPACES DETECTED.</p>
            </div>
          ) : services.map((svc, idx) => {
            const isSvcActive = svc.isActive;
            return (
              <div key={svc.id}
                style={{
                  padding: 16,
                  marginBottom: 14,
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.015)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isSvcActive ? '#10b981' : '#64748b',
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>{svc.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, zIndex: 10 }}>
                    <button onClick={() => handleToggleActive(svc)} title={isSvcActive ? 'Pause service' : 'Activate service'}
                      style={{
                        width: 24,
                        height: 24,
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.03)',
                        color: isSvcActive ? '#10b981' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >{isSvcActive ? <Pause size={11} /> : <Play size={11} />}</button>
                    <button onClick={() => handleDelete(svc.id, svc.name)}
                      style={{
                        width: 24,
                        height: 24,
                        border: `1px solid rgba(239, 68, 68, 0.2)`,
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.04)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    ><Trash2 size={11} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.baseUrl}</div>
                {svc.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{svc.description}</div>}
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 10 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)' }}>REGISTERED ROUTES</span>
                  <button
                    onClick={() => {
                      const otherSvcs = services.filter(s => s.id !== svc.id);
                      setRouteForm({
                        path: '',
                        method: 'GET',
                        targetService: otherSvcs[0]?.name || svc.name,
                        description: ''
                      });
                      setShowAddRouteSvcId(svc.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00f2fe',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >+ ADD ROUTE</button>
                </div>

                {(svc.routes && svc.routes.length > 0) ? (
                  <div style={{ marginTop: 8 }}>
                    {svc.routes.map((r: any) => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', marginTop: 6 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflow: 'hidden' }}>
                          <span className={`method-${r.method}`} style={{ fontSize: 8, padding: '2px 5px', borderRadius: 3, fontWeight: 700, background: r.method === 'GET' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)', color: r.method === 'GET' ? '#10b981' : '#6366f1' }}>{r.method}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }} title={r.path}>{r.path}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteRoute(svc.id, r.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Delete route"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', fontStyle: 'italic', marginTop: 6 }}>No routes registered.</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SERVICE MESH GRAPH ─────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          padding: '8px 16px',
          background: 'rgba(9, 9, 11, 0.92)',
          border: '1px solid var(--border)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: '#ffffff',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Network size={12} style={{ color: '#ffffff' }} /> MESH GRAPH CONTROL · {services.length} NODES · {edges.length} LINKS
        </div>

        {services.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-faint)', gap: 12 }}>
            <Network size={40} style={{ color: 'var(--text-faint)' }} />
            <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>SERVICE NETWORK OFFLINE</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Register nodes in the command telemetry panel to initiate graph link diagnostics.</p>
            <button onClick={() => setShowAdd(true)}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                background: '#ffffff',
                border: 'none',
                color: '#000000',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                borderRadius: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
            >+ Add First Service</button>
          </div>
        ) : (
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onMove={onMove} fitView style={{ background: 'var(--bg-base)' }}>
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255, 255, 255, 0.05)" />
            <Controls style={{ background: '#09090b', border: '1px solid var(--border)', borderRadius: '6px' }} />
            <MiniMap style={{
              background: '#020202',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              opacity: isMinimapVisible ? 1 : 0,
              pointerEvents: isMinimapVisible ? 'all' : 'none',
              transition: 'opacity 0.3s ease-in-out',
            }} nodeColor={(n) => n.data?.isActive ? '#10b981' : '#64748b'} maskColor="rgba(2,2,2,0.85)" />
          </ReactFlow>
        )}
      </div>

      {/* ── REGISTER SERVICE MODAL ─────────────────────── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ maxWidth: 460, width: '100%', padding: 28, background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 38, height: 38, border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <Link2 size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', color: '#fff', textTransform: 'uppercase' }}>REGISTER NODE</h2>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>ESTABLISHING NEW MESH NAMESPACE</p>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ marginLeft: 'auto', width: 24, height: 24, border: '1px solid var(--border)', borderRadius: '6px', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { k: 'name', label: 'Service Namespace Key', placeholder: 'auth-service', type: 'text' },
                { k: 'baseUrl', label: 'Target Base URL', placeholder: 'https://auth.api.mycompany.com', type: 'text' },
                { k: 'description', label: 'Service Description', placeholder: 'Handles profile security tokens', type: 'text' },
              ].map(f => (
                <div key={f.k}>
                  <label style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type} value={(form as any)[f.k]}
                    onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                    placeholder={f.placeholder}
                    required={f.k !== 'description'}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#030303',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: 12.5,
                      fontFamily: f.k === 'description' ? 'inherit' : "'JetBrains Mono', monospace",
                      padding: '8px 12px',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, height: 38, borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', fontSize: 12.5, cursor: 'pointer', transition: 'all 0.15s' }}>Cancel</button>
                <button type="submit" disabled={adding}
                  style={{
                    flex: 2,
                    height: 38,
                    background: adding ? '#1e293b' : '#ffffff',
                    border: 'none',
                    color: adding ? '#475569' : '#000000',
                    borderRadius: '8px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: adding ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if(!adding) e.currentTarget.style.background = '#cbd5e1'; }}
                  onMouseLeave={e => { if(!adding) e.currentTarget.style.background = '#ffffff'; }}
                >
                  {adding ? 'Registering...' : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Link2 size={14} /> Register Service
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD ROUTE MODAL ────────────────────────────── */}
      {showAddRouteSvcId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }} onClick={e => { if (e.target === e.currentTarget) setShowAddRouteSvcId(null); }}>
          <div style={{ maxWidth: 460, width: '100%', padding: 28, background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 38, height: 38, border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <Network size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', color: '#fff', textTransform: 'uppercase' }}>ADD SERVICE ROUTE</h2>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>DEFINING ROUTE PATH AND MESH CONNECTION</p>
              </div>
              <button onClick={() => setShowAddRouteSvcId(null)} style={{ marginLeft: 'auto', width: 24, height: 24, border: '1px solid var(--border)', borderRadius: '6px', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
            </div>

            <form onSubmit={handleAddRoute} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>HTTP Method</label>
                <select
                  value={routeForm.method}
                  onChange={e => setRouteForm(p => ({ ...p, method: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#030303',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: 12.5,
                    padding: '8px 12px',
                    outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Route Path</label>
                <input
                  type="text"
                  value={routeForm.path}
                  onChange={e => setRouteForm(p => ({ ...p, path: e.target.value }))}
                  placeholder="/users"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#030303',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: 12.5,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: '8px 12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Target Service Node</label>
                <select
                  value={routeForm.targetService}
                  onChange={e => setRouteForm(p => ({ ...p, targetService: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#030303',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: 12.5,
                    padding: '8px 12px',
                    outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Route Description</label>
                <input
                  type="text"
                  value={routeForm.description}
                  onChange={e => setRouteForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Fetches list of registered users"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#030303',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: 12.5,
                    padding: '8px 12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddRouteSvcId(null)} style={{ flex: 1, height: 38, borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', fontSize: 12.5, cursor: 'pointer', transition: 'all 0.15s' }}>Cancel</button>
                <button type="submit" disabled={addingRoute}
                  style={{
                    flex: 2,
                    height: 38,
                    background: addingRoute ? '#1e293b' : '#ffffff',
                    border: 'none',
                    color: addingRoute ? '#475569' : '#000000',
                    borderRadius: '8px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: addingRoute ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if(!addingRoute) e.currentTarget.style.background = '#cbd5e1'; }}
                  onMouseLeave={e => { if(!addingRoute) e.currentTarget.style.background = '#ffffff'; }}
                >
                  {addingRoute ? 'Adding...' : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Network size={14} /> Add Route
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

