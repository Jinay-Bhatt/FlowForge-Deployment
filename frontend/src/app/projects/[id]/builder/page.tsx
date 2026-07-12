'use client';
import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import { useParams } from 'next/navigation';
import {
  ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState,
  addEdge, Panel, MarkerType, Connection, Edge, Node, BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { io, Socket } from 'socket.io-client';
import { api, BASE_URL_DIRECT } from '../../../../services/api';
import { nodeTypes, NODE_PALETTE, getNodeIcon } from '../../../../components/customNodes';
import CustomSelect from '../../../../components/CustomSelect';
import { Play, Pause, Settings, Zap, Trash2, Monitor, Save, Rocket, Loader2, Sparkles, Terminal, X, AlertCircle, Check } from 'lucide-react';

const METHOD_COLORS: Record<string, string> = { GET: '#10b981', POST: '#6366f1', PUT: '#f59e0b', DELETE: '#ef4444', PATCH: '#38bdf8' };

export default function BuilderPage() {
  const params = useParams();
  const projectId = params?.id as string;

  // Workflows
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWf, setSelectedWf] = useState<any>(null);
  const [wfLoading, setWfLoading] = useState(false);
  const [showCreateWf, setShowCreateWf] = useState(false);
  const [newWf, setNewWf] = useState({ name: '', path: '/', method: 'GET' });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [creating, setCreating] = useState(false);

  // Canvas
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isMinimapVisible, setIsMinimapVisible] = useState(false);
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


  // AI
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // API Sandbox Testing States
  const [showTestModal, setShowTestModal] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testHeaders, setTestHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [testBody, setTestBody] = useState('{\n  \n}');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Metrics
  const [logs, setLogs] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!projectId) return;
    loadWorkflows();
    const socket = io(BASE_URL_DIRECT);
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join-project', projectId));
    socket.on('metrics', (m: any) => setLogs(p => [m, ...p].slice(0, 50)));
    return () => { socket.disconnect(); };
  }, [projectId]);

  const loadWorkflows = async () => {
    setWfLoading(true);
    try {
      const list = await api.workflows.list(projectId);
      setWorkflows(list);
      if (list.length > 0) loadWorkflowDetail(list[0]);
    } finally { setWfLoading(false); }
  };

  const loadWorkflowDetail = async (wf: any) => {
    setSelectedWf(wf);
    const full = await api.workflows.get(wf.id);
    setNodes((full.nodes as Node[]) || []);
    setEdges((full.edges as Edge[]) || []);
    setSelectedNodeId(null);
  };

  const handleCreateWf = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await api.workflows.create(projectId, newWf);
      setWorkflows(p => [created, ...p]);
      await loadWorkflowDetail(created);
      setShowCreateWf(false);
      setNewWf({ name: '', path: '/', method: 'GET' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedWf) return;
    setSaving(true);
    try {
      const triggerNode = nodes.find(n => n.type === 'triggerNode');
      await api.workflows.update(selectedWf.id, {
        nodes, edges,
        method: triggerNode?.data?.method || selectedWf.method,
        path: triggerNode?.data?.path || selectedWf.path,
      });
      const list = await api.workflows.list(projectId);
      setWorkflows(list);
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (!selectedWf) return;
    setPublishing(true);
    try {
      const next = !selectedWf.isPublished;
      await api.workflows.publish(selectedWf.id, next);
      setSelectedWf((p: any) => ({ ...p, isPublished: next }));
      setWorkflows(wfs => wfs.map(w => w.id === selectedWf.id ? { ...w, isPublished: next } : w));
    } catch (err: any) { alert(err.message); }
    finally { setPublishing(false); }
  };

  const handleDeleteWfById = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.workflows.delete(id);
      const list = await api.workflows.list(projectId);
      setWorkflows(list);
      if (selectedWf?.id === id) {
        if (list.length > 0) loadWorkflowDetail(list[0]);
        else { setSelectedWf(null); setNodes([]); setEdges([]); }
      }
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteWf = async () => {
    if (!selectedWf) return;
    await handleDeleteWfById(selectedWf.id, selectedWf.name);
  };

  const onConnect = useCallback((params: Connection) =>
    setEdges(eds => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#00f2fe', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#00f2fe' }
    }, eds)), []);

  const addNode = (type: string, defaultData: any) => {
    if (!selectedWf) { alert('Select or create a workflow first'); return; }
    if (type === 'triggerNode' && nodes.some(n => n.type === 'triggerNode')) {
      alert('Only one trigger node per workflow'); return;
    }
    const id = `node_${Date.now()}`;
    const newNode: Node = { id, type, position: { x: 120 + nodes.length * 60, y: 180 + (nodes.length % 3) * 80 }, data: { ...defaultData } };
    setNodes(ns => [...ns, newNode]);
    setSelectedNodeId(id);
  };

  const deleteNode = () => {
    if (!selectedNodeId) return;
    setNodes(ns => ns.filter(n => n.id !== selectedNodeId));
    setEdges(es => es.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleNodeDataChange = (key: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes(ns => ns.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, [key]: value } } : n));
  };

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // AI Generator
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.ai.generateWorkflow(aiPrompt);
      const { workflow } = res;
      const created = await api.workflows.create(projectId, {
        name: workflow.name,
        path: workflow.path,
        method: workflow.method,
        nodes: workflow.nodes,
        edges: workflow.edges
      });
      setNodes((workflow.nodes as Node[]) || []);
      setEdges((workflow.edges as Edge[]) || []);
      setSelectedWf(created);
      setWorkflows(p => [created, ...p]);
      setShowAi(false);
      setAiPrompt('');
    } catch (err: any) { setAiError(err.message); }
    finally { setAiLoading(false); }
  };

  const handleTestExecute = async () => {
    if (!selectedWf) return;
    setTestLoading(true);
    setTestResult(null);

    const startTime = Date.now();
    const cleanPath = selectedWf.path.startsWith('/') ? selectedWf.path : `/${selectedWf.path}`;
    const queryStr = testQuery.trim() ? (testQuery.startsWith('?') ? testQuery : `?${testQuery}`) : '';
    const gatewayUrl = `${BASE_URL_DIRECT}/api/${projectId}${cleanPath}${queryStr}`;

    try {
      let headersObj = {};
      try {
        if (testHeaders.trim()) {
          headersObj = JSON.parse(testHeaders);
        }
      } catch (err) {
        throw new Error('Invalid JSON format in Request Headers');
      }

      let bodyData: any = undefined;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(selectedWf.method)) {
        try {
          if (testBody.trim()) {
            bodyData = JSON.parse(testBody);
          }
        } catch (err) {
          throw new Error('Invalid JSON format in Request Body');
        }
      }

      const response = await fetch(gatewayUrl, {
        method: selectedWf.method,
        headers: {
          ...headersObj,
        },
        body: bodyData ? JSON.stringify(bodyData) : undefined,
      });

      const latency = Date.now() - startTime;
      let responseBodyText = '';
      let isJson = false;
      const contentType = response.headers.get('content-type') || '';
      
      try {
        if (contentType.includes('application/json')) {
          const json = await response.json();
          responseBodyText = JSON.stringify(json, null, 2);
          isJson = true;
        } else {
          responseBodyText = await response.text();
        }
      } catch (err) {
        responseBodyText = `Failed to parse response content: ${(err as Error).message}`;
      }

      const resHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      setTestResult({
        status: response.status,
        statusText: response.statusText,
        latency,
        headers: resHeaders,
        body: responseBodyText,
        isJson,
        success: response.ok
      });
    } catch (err: any) {
      setTestResult({
        error: true,
        message: err.message || 'Network execution failed.'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const renderConsole = () => {
    if (!testResult) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: '8px', padding: 24, gap: 12 }}>
          <Terminal size={24} style={{ color: 'var(--text-faint)' }} />
          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' }}>
            READY FOR EXECUTION.<br/>CONFIGURE PARAMETERS AND CLICK TEST BELOW.
          </div>
        </div>
      );
    }

    if (testResult.error) {
      return (
        <div style={{ flex: 1, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', padding: '16px', borderRadius: '8px', color: '#fca5a5', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, whiteSpace: 'pre-wrap', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#ef4444' }}><AlertCircle size={14} /> Execution Error</div>
          {testResult.message}
        </div>
      );
    }

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
        {/* Telemetry metadata tags */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            background: testResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1.5px solid ${testResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: testResult.success ? '#10b981' : '#ef4444',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            STATUS: {testResult.status} {testResult.statusText}
          </span>
          
          <span style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1.5px solid rgba(245,158,11,0.3)',
            color: '#f59e0b',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            LATENCY: {testResult.latency} ms
          </span>
        </div>

        {/* Response Body Text */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '6px', background: '#030303', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            RESPONSE BODY ({testResult.isJson ? 'JSON' : 'PLAINTEXT'})
          </div>
          <pre style={{
            margin: 0,
            padding: '12px',
            overflowY: 'auto',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            lineHeight: 1.5,
            color: testResult.success ? '#a7f3d0' : '#fbcfe8',
            flex: 1,
            whiteSpace: 'pre-wrap'
          }}>{testResult.body || 'No payload returned.'}</pre>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', background: 'var(--bg-base)', fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────── */}
      <div style={{ width: 260, background: '#09090b', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
        {/* Workflows panel */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5 }}><Monitor size={11} /> ACTIVE ROUTES</span>
            <button onClick={() => setShowCreateWf(true)}
              style={{
                width: 22,
                height: 22,
                border: '1px solid var(--border)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
            >+</button>
          </div>
          <div className="scroll-area" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {wfLoading ? <div style={{ height: 32, borderRadius: 6 }} className="skeleton" /> :
              workflows.map(wf => {
                const isSelected = selectedWf?.id === wf.id;
                return (
                  <div key={wf.id}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                      border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'}`,
                      borderRadius: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <button onClick={() => loadWorkflowDetail(wf)}
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        padding: '8px 10px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        overflow: 'hidden',
                        color: 'inherit',
                      }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: METHOD_COLORS[wf.method] || '#6366f1', background: `${METHOD_COLORS[wf.method]}18`, border: `1px solid ${METHOD_COLORS[wf.method]}30`, borderRadius: 3, padding: '1px 4px', fontFamily: "'JetBrains Mono', monospace" }}>{wf.method}</span>
                      <span style={{ fontSize: 11, color: isSelected ? '#ffffff' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontWeight: isSelected ? 600 : 400 }}>{wf.name}</span>
                      {wf.isPublished && (
                        <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                      )}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWfById(wf.id, wf.name);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.25)',
                        cursor: 'pointer',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                        height: '100%',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent'; }}
                      title="Delete Workflow"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Node Palette */}
        <div className="scroll-area" style={{ flex: 1, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Settings size={11} style={{ color: '#94a3b8' }} /> NODE TELEMETRY
          </div>
          {NODE_PALETTE.map(cat => (
            <div key={cat.category} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: cat.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', marginBottom: 6 }}>{cat.category.toUpperCase()}</div>
              {cat.nodes.map(n => (
                <button key={n.type} onClick={() => addNode(n.type, n.defaultData)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: cat.color + '0c',
                    border: `1px solid ${cat.color}25`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 6,
                    transition: 'all 0.2s ease',
                    color: '#cbd5e1',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = cat.color + '55';
                    e.currentTarget.style.background = cat.color + '18';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.boxShadow = `0 0 12px ${cat.color}15`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = cat.color + '25';
                    e.currentTarget.style.background = cat.color + '0c';
                    e.currentTarget.style.color = '#cbd5e1';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', color: cat.color }}>
                    {getNodeIcon(n.icon, 14)}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#e2e8f0' }}>{n.label}</div>
                    <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{n.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── CANVAS ───────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Toolbar */}
        <div style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(9, 9, 11, 0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          borderRadius: '8px',
          padding: '6px 14px'
        }}>
          {selectedWf ? (
            <>
              <span style={{ fontSize: 11, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedWf.name.toUpperCase()}</span>
              <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.08)' }} />
              
              {/* Save Button */}
              <button onClick={handleSave} disabled={saving}
                style={{
                  padding: '5px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  color: saving ? 'var(--text-faint)' : '#ffffff',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if(!saving) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; } }}
                onMouseLeave={e => { if(!saving) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; } }}
              >
                {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />} {saving ? 'SAVING...' : 'SAVE'}
              </button>

              <button onClick={handlePublish} disabled={publishing}
                style={{
                  padding: '5px 12px',
                  background: selectedWf?.isPublished ? 'rgba(239,68,68,0.1)' : '#ffffff',
                  border: selectedWf?.isPublished ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
                  color: selectedWf?.isPublished ? '#ef4444' : '#020202',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  cursor: publishing ? 'not-allowed' : 'pointer',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!publishing) {
                    if (selectedWf?.isPublished) {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                      e.currentTarget.style.borderColor = '#ef4444';
                    } else {
                      e.currentTarget.style.background = '#e2e8f0';
                    }
                  }
                }}
                onMouseLeave={e => {
                  if (!publishing) {
                    if (selectedWf?.isPublished) {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                    } else {
                      e.currentTarget.style.background = '#ffffff';
                    }
                  }
                }}
              >
                {publishing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : selectedWf?.isPublished ? <><Pause size={12} /> SUSPEND</> : <><Rocket size={12} /> INITIALIZE</>}
              </button>

              {selectedWf?.isPublished && (
                <div style={{
                  padding: '3px 8px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: 9,
                  color: '#10b981',
                  fontWeight: 700,
                  borderRadius: '4px',
                  fontFamily: "'JetBrains Mono', monospace",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  LIVE
                </div>
              )}
              
              <button
                onClick={handleDeleteWf}
                style={{
                  padding: '5px 12px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  background: 'rgba(239, 68, 68, 0.04)',
                  color: '#ef4444',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                title="Delete Workflow"
              >
                <Trash2 size={12} />
                DELETE
              </button>
            </>
          ) : (
            <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>← SELECT OR GENERATE WORKFLOW</span>
          )}
          <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.08)' }} />
          
          {/* AI Button */}
          <button onClick={() => setShowAi(true)}
            style={{
              padding: '5px 12px',
              border: '1px solid var(--border)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#ffffff',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              borderRadius: '6px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
          >
            <Sparkles size={11} style={{ color: '#ffb300', fill: 'rgba(255, 179, 0, 0.15)' }} /> AI SYNTHESIZE
          </button>

          {selectedWf && (
            <button onClick={() => setShowTestModal(true)}
              style={{
                padding: '5px 12px',
                border: '1.5px solid rgba(0, 242, 254, 0.35)',
                background: 'rgba(0, 242, 254, 0.05)',
                color: '#00f2fe',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                borderRadius: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.65)'; e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)'; e.currentTarget.style.background = 'rgba(0, 242, 254, 0.05)'; }}
            >
              <Play size={11} style={{ fill: 'rgba(0, 242, 254, 0.15)' }} /> TEST API
            </button>
          )}
        </div>

        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          onMove={onMove}
          fitView
          style={{ background: 'var(--bg-base)' }}
          defaultEdgeOptions={{ animated: true, style: { stroke: '#00f2fe', strokeWidth: 2 } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(0, 242, 254, 0.08)" />
          <Controls style={{ background: '#0a0f1e', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: 0, boxShadow: '0 0 10px rgba(0, 242, 254, 0.15)' }} />
          <MiniMap style={{
            background: '#020617',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: 0,
            opacity: isMinimapVisible ? 1 : 0,
            pointerEvents: isMinimapVisible ? 'all' : 'none',
            transition: 'opacity 0.3s ease-in-out',
          }} nodeColor={() => '#00f2fe'} maskColor="rgba(2,6,23,0.85)" />
          {nodes.length === 0 && (
            <Panel position="top-center">
              <div style={{ marginTop: 100, textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, animation: 'float 3s infinite' }}>
                  <Zap size={44} style={{ color: 'var(--neon-amber)', filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>DEPLOY NODES FROM PALETTE OR SYNTHESIZE VIA GEMINI AI</div>
              </div>
            </Panel>
          )}
        </ReactFlow>

        {/* Live metrics strip (HUD style bottom feed) */}
        {logs.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(5, 10, 20, 0.95)',
            borderTop: '1.5px solid rgba(0, 242, 254, 0.2)',
            padding: '8px 16px',
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            fontSize: 9,
            color: '#94a3b8',
            fontFamily: "'JetBrains Mono', monospace",
            zIndex: 5
          }}>
            <div style={{ color: '#00f2fe', fontWeight: 900, borderRight: '1.5px solid rgba(0,242,254,0.3)', paddingRight: 10 }}>TELEMETRY STREAM:</div>
            {logs.slice(0, 5).map((l, i) => (
              <span key={i} style={{ flexShrink: 0, color: l.responseStatus >= 400 ? '#ef4444' : '#05ffc4' }}>
                [{l.method}] {l.path} → CODE {l.responseStatus} ({l.latencyMs}ms)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT CONFIG PANEL ────────────────────────── */}
      {selectedNode && (
        <div style={{ width: 300, background: 'rgba(10, 15, 30, 0.9)', borderLeft: '1.5px solid rgba(0, 242, 254, 0.2)', overflowY: 'auto', flexShrink: 0, backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px dashed rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#00f2fe', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings size={12} /> NODE CONFIG
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={deleteNode} style={{ padding: '4px 8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>DELETE</button>
              <button onClick={() => setSelectedNodeId(null)} style={{ width: 22, height: 22, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
            </div>
          </div>
          <div className="scroll-area" style={{ padding: 20, flex: 1 }}>
            <NodeConfigPanel node={selectedNode} onChange={handleNodeDataChange} />
          </div>
        </div>
      )}

      {/* ── CREATE WORKFLOW MODAL ─────────────────────── */}
      {showCreateWf && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CREATE WORKFLOW</h2>
              <button onClick={() => setShowCreateWf(false)} style={{ width: 24, height: 24, border: '1px solid var(--border)', borderRadius: '6px', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
            </div>
            <form onSubmit={handleCreateWf} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[{ k: 'name', label: 'Name Namespace Key', placeholder: 'Get Products', type: 'text' }, { k: 'path', label: 'Gateway Endpoint Path', placeholder: '/products', type: 'text' }].map(f => (
                <div key={f.k}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'JetBrains Mono', monospace" }}>{f.label}</label>
                  <input required type={f.type} value={(newWf as any)[f.k]} onChange={e => setNewWf(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.placeholder}
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
                    }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'JetBrains Mono', monospace" }}>REST Method</label>
                <CustomSelect
                  value={newWf.method}
                  onChange={(val) => setNewWf(p => ({ ...p, method: val }))}
                  options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE']}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowCreateWf(false)} disabled={creating} style={{ flex: 1, height: 38, borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', fontSize: 12.5, cursor: creating ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>Cancel</button>
                <button type="submit"
                  disabled={creating}
                  style={{
                    flex: 2,
                    height: 38,
                    background: creating ? 'rgba(255, 255, 255, 0.4)' : '#ffffff',
                    border: 'none',
                    color: '#000000',
                    borderRadius: '8px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: creating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                  onMouseEnter={e => { if (!creating) e.currentTarget.style.background = '#cbd5e1'; }}
                  onMouseLeave={e => { if (!creating) e.currentTarget.style.background = '#ffffff'; }}
                >
                  {creating ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      DEPLOYING...
                    </>
                  ) : (
                    'Deploy Workflow'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AI GENERATE MODAL ─────────────────────────── */}
      {showAi && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} style={{ color: '#ffb300', fill: 'rgba(255, 179, 0, 0.15)' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Workflow Synthesizer</h2>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>POWERED BY GEMINI · SPECIFY INSTRUCTIONS</p>
              </div>
              <button onClick={() => { setShowAi(false); setAiError(''); }} style={{ marginLeft: 'auto', width: 24, height: 24, border: '1px solid var(--border)', borderRadius: '6px', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
            </div>

            {aiError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 14px', marginBottom: 16, color: '#fca5a5', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>⚠ PIPELINE FAIL: {aiError}</div>
            )}

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {['Create a Product CRUD API', 'Build a User Auth workflow with JWT', 'Make a webhook that validates and stores events'].map(ex => (
                  <button key={ex} onClick={() => setAiPrompt(ex)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: 'pointer',
                      borderRadius: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                    {ex}
                  </button>
                ))}
              </div>
              <textarea
                value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe what API you want to build... e.g. 'Create a REST API that validates a JWT token, queries a PostgreSQL users table, and returns the user profile'"
                rows={4}
                style={{
                  width: '100%',
                  background: '#030303',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: 12.5,
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: '12px',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  lineHeight: 1.6
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowAi(false); setAiError(''); }} style={{ flex: 1, height: 38, borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', fontSize: 12.5, cursor: 'pointer', transition: 'all 0.15s ease' }}>Cancel</button>
              <button onClick={handleAiGenerate} disabled={aiLoading || !aiPrompt.trim()}
                style={{
                  flex: 3,
                  height: 38,
                  background: aiLoading ? '#1e293b' : '#ffffff',
                  border: 'none',
                  color: aiLoading ? '#475569' : '#000000',
                  borderRadius: '8px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: aiLoading || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { if(!aiLoading && aiPrompt.trim()) e.currentTarget.style.background = '#cbd5e1'; }}
                onMouseLeave={e => { if(!aiLoading && aiPrompt.trim()) e.currentTarget.style.background = '#ffffff'; }}
              >
                {aiLoading ? (
                  <>Synthesizing...</>
                ) : (
                  <>
                    <Sparkles size={13} style={{ marginRight: 6, color: '#ffb300', fill: 'rgba(255, 179, 0, 0.15)' }} />
                    Synthesize Workflow
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── API TESTING SANDBOX MODAL ────────────────── */}
      {showTestModal && selectedWf && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#09090b', border: '1px solid var(--border)', borderRadius: '12px', padding: 28, width: '100%', maxWidth: 780, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }} className="scroll-area">
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Terminal size={18} style={{ color: '#00f2fe' }} />
                <div>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Sandbox Test Runner</h2>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>TEST LIVE INTERACTIVE GATEWAY ENDPOINTS IN REALTIME</p>
                </div>
              </div>
              <button onClick={() => { setShowTestModal(false); setTestResult(null); }} style={{ width: 24, height: 24, border: '1px solid var(--border)', borderRadius: '6px', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
            </div>

            {/* Warning banner if workflow is unpublished */}
            {!selectedWf.isPublished && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', padding: '10px 14px', borderRadius: '6px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#fcd34d', lineHeight: 1.4 }}>
                  <strong>Workflow is suspended/unpublished.</strong> Please click <strong>Initialize</strong> on the canvas toolbar to publish the route, otherwise the gateway will return a 404 error.
                </span>
              </div>
            )}

            {/* Split Panel Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1, minHeight: 340 }}>
              
              {/* Left Column: Request configuration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#00f2fe', fontFamily: "'JetBrains Mono', monospace", borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>REQUEST PARAMETERS</div>
                
                {/* Method & URL tag */}
                <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '6px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: METHOD_COLORS[selectedWf.method] || '#6366f1', color: '#000', fontSize: 9.5, fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                    {selectedWf.method}
                  </span>
                  <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    /api/{projectId}{selectedWf.path}
                  </span>
                </div>

                {/* Query String Params */}
                <div>
                  <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, fontFamily: "'JetBrains Mono', monospace" }}>Query Params</label>
                  <input type="text" value={testQuery} onChange={e => setTestQuery(e.target.value)} placeholder="e.g. ?limit=10&page=1"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#030303',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: 11.5,
                      fontFamily: "'JetBrains Mono', monospace",
                      padding: '8px 10px',
                      outline: 'none',
                    }} />
                </div>

                {/* Headers String */}
                <div>
                  <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, fontFamily: "'JetBrains Mono', monospace" }}>Headers (JSON)</label>
                  <textarea value={testHeaders} onChange={e => setTestHeaders(e.target.value)} placeholder='{"Authorization": "Bearer token"}' rows={3}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#030303',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      padding: '8px 10px',
                      outline: 'none',
                      resize: 'vertical',
                    }} />
                </div>

                {/* JSON Body */}
                {['POST', 'PUT', 'PATCH', 'DELETE'].includes(selectedWf.method) && (
                  <div>
                    <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, fontFamily: "'JetBrains Mono', monospace" }}>JSON Body</label>
                    <textarea value={testBody} onChange={e => setTestBody(e.target.value)} placeholder='{"key": "value"}' rows={4}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#030303',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        padding: '8px 10px',
                        outline: 'none',
                        resize: 'vertical',
                      }} />
                  </div>
                )}
              </div>

              {/* Right Column: Execution Response Telemetry Console */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#00f2fe', fontFamily: "'JetBrains Mono', monospace", borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>RESPONSE CONSOLE</div>
                {renderConsole()}
              </div>

            </div>

            {/* Bottom Row */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowTestModal(false); setTestResult(null); }}
                style={{
                  height: 38,
                  padding: '0 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Close Sandbox
              </button>
              
              <button onClick={handleTestExecute} disabled={testLoading}
                style={{
                  height: 38,
                  padding: '0 24px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: 'none',
                  color: '#000000',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: testLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if(!testLoading) e.currentTarget.style.background = '#cbd5e1'; }}
                onMouseLeave={e => { if(!testLoading) e.currentTarget.style.background = '#ffffff'; }}
              >
                {testLoading ? (
                  <>
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Executing Request...</span>
                  </>
                ) : (
                  <>
                    <Terminal size={13} />
                    <span>Execute Gateway Request</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─── NODE CONFIG CONTEXT & COMPONENT ───────────────────────────────────────
const NodeConfigContext = createContext<{ data: any; onChange: (k: string, v: any) => void } | null>(null);

function Field({ label, fieldKey, type = 'text', placeholder = '' }: any) {
  const ctx = useContext(NodeConfigContext);
  if (!ctx) return null;
  const { data, onChange } = ctx;
  const value = data[fieldKey] || '';

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>{label}</label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(fieldKey, e.target.value)} placeholder={placeholder} rows={5}
          style={{
            width: '100%',
            background: 'rgba(0,0,0,0.3)',
            border: '1.5px solid rgba(0, 242, 254, 0.25)',
            borderRadius: 0,
            padding: '8px 10px',
            color: '#fff',
            fontSize: 11,
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.5
          }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(fieldKey, e.target.value)} placeholder={placeholder}
          style={{
            width: '100%',
            background: 'rgba(0,0,0,0.3)',
            border: '1.5px solid rgba(0, 242, 254, 0.25)',
            borderRadius: 0,
            padding: '8px 10px',
            color: '#fff',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
            boxSizing: 'border-box'
          }} />
      )}
    </div>
  );
}

// ─── NODE CONFIG PANEL ─────────────────────────────────────────────────────
function NodeConfigPanel({ node, onChange }: { node: Node; onChange: (k: string, v: any) => void }) {
  const data = node.data as any;

  const nodeConfigs: Record<string, React.ReactNode> = {
    triggerNode: (
      <>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Method</label>
          <CustomSelect
            value={data.method || 'GET'}
            onChange={(val) => onChange('method', val)}
            options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE']}
          />
        </div>
        <Field label="Path" fieldKey="path" placeholder="/api/resource" />
      </>
    ),

    webhookNode: <><Field label="Path" fieldKey="path" placeholder="/webhook/events" /><Field label="Secret" fieldKey="secret" type="password" placeholder="webhook secret" /></>,
    scheduledNode: <><Field label="Cron Expression" fieldKey="cron" placeholder="0 * * * *" /><Field label="Timezone" fieldKey="timezone" placeholder="UTC" /></>,
    databaseNode: <Field label="SQL Query" fieldKey="query" type="textarea" placeholder="SELECT * FROM users WHERE id = $request.params.id;" />,
    customCodeNode: <Field label="JavaScript Code" fieldKey="code" type="textarea" placeholder="const { body } = context.request;\nreturn { processed: true };" />,
    ifElseNode: <Field label="Condition (JS expression)" fieldKey="condition" placeholder="context.request.body.active === true" />,
    switchCaseNode: (
      <>
        <Field label="Expression (JS expression)" fieldKey="expression" placeholder="context.request.body.status" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            Cases (comma-separated, include 'default')
          </label>
          <input
            type="text"
            value={(data.cases || []).join(', ')}
            onChange={e => {
              const val = e.target.value;
              const casesArr = val.split(',').map(s => s.trim()).filter(Boolean);
              onChange('cases', casesArr);
            }}
            placeholder="paid, pending, default"
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1.5px solid rgba(0, 242, 254, 0.25)',
              borderRadius: 0,
              padding: '8px 10px',
              color: '#fff',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </>
    ),
    transformNode: <Field label="Mapping (JS object)" fieldKey="mapping" type="textarea" placeholder="{\n  id: steps.db.id,\n  name: steps.db.name\n}" />,
    httpClientNode: (
      <>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Method</label>
          <CustomSelect
            value={data.method || 'GET'}
            onChange={(val) => onChange('method', val)}
            options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE']}
          />
        </div>
        <Field label="URL (use $request or $steps to interpolate)" fieldKey="url" placeholder="https://api.github.com/users/$request.body.username" />
        <Field label="Headers (JSON string)" fieldKey="headers" type="textarea" placeholder='{\n  "Content-Type": "application/json"\n}' />
        <Field label="Body (JSON / string / reference)" fieldKey="body" type="textarea" placeholder='{"text": "Hello $request.body.name"}' />
      </>
    ),
    jwtValidateNode: <Field label="JWT Secret (optional override)" fieldKey="secret" type="password" placeholder="uses env.JWT_SECRET if empty" />,
    apiKeyNode: <Field label="Header Name" fieldKey="headerName" placeholder="x-api-key" />,
    responseNode: (
      <>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>Status Code</label>
          <input type="number" value={data.statusCode || 200} onChange={e => onChange('statusCode', parseInt(e.target.value))}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1.5px solid rgba(0, 242, 254, 0.25)',
              borderRadius: 0,
              padding: '8px 10px',
              color: '#fff',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              outline: 'none',
              boxSizing: 'border-box'
            }} />
        </div>
        <Field label="Body (use $steps.nodeId to reference)" fieldKey="body" type="textarea" placeholder="$steps.db_query" />
        <Field label="Custom Response Headers (JSON string)" fieldKey="headers" type="textarea" placeholder='{\n  "Content-Type": "text/html"\n}' />
        <Field label="Redirect URL (optional override)" fieldKey="redirectUrl" placeholder="https://example.com or $steps.codeNode.url" />
      </>
    ),
  };

  return (
    <NodeConfigContext.Provider value={{ data, onChange }}>
      <div>
        <div style={{ padding: '8px 12px', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.25)', marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: '#00f2fe', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>NODE TELEMETRY KEY</div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{node.id}</div>
        </div>
        {nodeConfigs[node.type as string] || <div style={{ color: '#475569', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>NO DIAGNOSTICS CONFIGURATION AVAILABLE.</div>}
      </div>
    </NodeConfigContext.Provider>
  );
}
