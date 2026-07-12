'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../services/api';
import {
  Package, Code2, Download, GitBranch, GitFork, Loader2, CheckCircle2,
  AlertCircle, ChevronRight, FileCode, Copy, Terminal, ExternalLink
} from 'lucide-react';

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(true);
  
  // Compilation and Git states
  const [compiling, setCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState<string>('');
  const [statusLevel, setStatusLevel] = useState<'info' | 'success' | 'error'>('info');
  const [jobId, setJobId] = useState<string | null>(null);
  const [gitConfig, setGitConfig] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadCodePreview();
    loadGitConfig();
  }, [projectId]);

  // Poll compilation status if jobId is present
  useEffect(() => {
    if (!jobId || !projectId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.exporter.getJobStatus(projectId, jobId);
        setCompileStatus(`Compilation state: ${res.state.toUpperCase()} (Progress: ${res.progress || 0}%)`);
        
        if (res.state === 'completed') {
          clearInterval(interval);
          setCompiling(false);
          setJobId(null);
          setCompileStatus('Codebase successfully compiled!');
          setStatusLevel('success');
          
          // If we compiled for local download, trigger the file download
          if (res.returnValue && !res.returnValue.pushedToGit) {
            triggerFileDownload();
          } else if (res.returnValue?.pushedToGit) {
            setCompileStatus('Codebase compiled and pushed to Git repo successfully!');
            setStatusLevel('success');
          }
        } else if (res.state === 'failed') {
          clearInterval(interval);
          setCompiling(false);
          setJobId(null);
          setCompileStatus(`Error: ${res.failedReason || 'Job failed'}`);
          setStatusLevel('error');
        }
      } catch (err: any) {
        clearInterval(interval);
        setCompiling(false);
        setJobId(null);
        setCompileStatus(`Status check failed: ${err.message}`);
        setStatusLevel('error');
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId, projectId]);

  const loadCodePreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await api.exporter.getPreview(projectId);
      if (res.files) {
        setFiles(res.files);
        // Default select src/index.ts or first file
        const first = Object.keys(res.files).find(k => k.includes('index.ts')) || Object.keys(res.files)[0] || '';
        setSelectedFile(first);
      }
    } catch (err: any) {
      console.error('Failed to load code preview', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadGitConfig = async () => {
    try {
      const res = await api.git.getConfig();
      if (res.config && res.config.isActive) {
        setGitConfig(res.config);
      }
    } catch {}
  };

  const triggerFileDownload = () => {
    const baseUrl = api.exporter.getDownloadUrl(projectId);
    const token = typeof window !== 'undefined' ? localStorage.getItem('ff_token') : null;
    const url = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
    
    // Open in a new hidden iframe or window location to trigger binary stream download
    const link = document.createElement('a');
    link.href = url;
    // Set headers if required, but standard GET triggers file attachment download
    link.setAttribute('download', `${projectId}-backend.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCodebase = async () => {
    if (compiling) return;
    setCompiling(true);
    setCompileStatus('Queuing compilation task on server...');
    setStatusLevel('info');
    try {
      const res = await api.exporter.exportProject(projectId, false);
      if (res.jobId) {
        setJobId(res.jobId);
        setCompileStatus('Compiling source files, configurations, and schemas...');
        setStatusLevel('info');
      } else {
        throw new Error('No jobId received from queue manager');
      }
    } catch (err: any) {
      setCompiling(false);
      setCompileStatus(`Failed to queue compiler: ${err.message}`);
      setStatusLevel('error');
    }
  };

  const handlePushToGit = async () => {
    if (!gitConfig) {
      // Redirect to settings page Git tab
      router.push('/settings');
      return;
    }
    if (compiling) return;
    setCompiling(true);
    setCompileStatus('Initializing secure repository connection...');
    setStatusLevel('info');
    try {
      const res = await api.exporter.exportProject(projectId, true);
      if (res.jobId) {
        setJobId(res.jobId);
        setCompileStatus('Compiling and preparing repository commit payload...');
        setStatusLevel('info');
      } else {
        throw new Error('No jobId received from queue manager');
      }
    } catch (err: any) {
      setCompiling(false);
      setCompileStatus(`Failed to queue sync task: ${err.message}`);
      setStatusLevel('error');
    }
  };

  const copyToClipboard = () => {
    if (!selectedFile || !files[selectedFile]) return;
    navigator.clipboard.writeText(files[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ height: 'calc(100vh - 104px)', overflow: 'hidden', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── HEADER STATUS CONTROLS ───────────────────── */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} style={{ color: 'var(--accent)' }} /> Compilation Exporter Workspace
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Compile workflows into standalone Fastify codebases. Download ZIP packages or sync with Git.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {compileStatus && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: 11,
              color: statusLevel === 'error' ? '#fca5a5' : statusLevel === 'success' ? '#a7f3d0' : 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              {compiling && <Loader2 size={12} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />}
              {!compiling && statusLevel === 'success' && <CheckCircle2 size={12} style={{ color: '#10b981' }} />}
              {!compiling && statusLevel === 'error' && <AlertCircle size={12} style={{ color: '#ef4444' }} />}
              {compileStatus}
            </div>
          )}

          <button onClick={handleDownloadCodebase} disabled={compiling}
            style={{
              height: 38,
              padding: '0 16px',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: compiling ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { if(!compiling) e.currentTarget.style.background = '#cbd5e1'; }}
            onMouseLeave={e => { if(!compiling) e.currentTarget.style.background = '#ffffff'; }}
          >
            {compiling && !gitConfig ? <Loader2 size={13} style={{ animation: 'spin 1s linear' }} /> : <Download size={13} />}
            Download ZIP Codebase
          </button>

          <button onClick={handlePushToGit} disabled={compiling}
            style={{
              height: 38,
              padding: '0 16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: compiling ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { if(!compiling) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; } }}
            onMouseLeave={e => { if(!compiling) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; } }}
          >
            {gitConfig ? (
              <>
                <GitBranch size={13} style={{ color: '#10b981' }} />
                <span>Push to {gitConfig.repositoryName.split('/')[1] || 'GitHub'}</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} style={{ color: '#f59e0b' }} />
                <span>Link GitHub Repository</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── WORKSPACE GRID ───────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side: File Selector Tree */}
        <div style={{ width: 260, borderRight: '1px solid var(--border)', background: '#09090b', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
            <Code2 size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> GENERATED FILE TREE
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }} className="scroll-area">
            {loadingPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ height: 32, borderRadius: 6, opacity: 1 - i * 0.15 }} className="skeleton" />
                ))}
              </div>
            ) : Object.keys(files).length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                No routes or workflows configured to generate files. Set up routes in the Builder.
              </div>
            ) : (
              Object.keys(files).sort().map(filePath => {
                const isSelected = selectedFile === filePath;
                const parts = filePath.split('/');
                const fileName = parts[parts.length - 1];
                const fileDir = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';

                return (
                  <button key={filePath} onClick={() => setSelectedFile(filePath)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'left',
                      padding: '8px 12px',
                      background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      border: `1px solid ${isSelected ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      marginBottom: 3,
                      gap: 10
                    }}
                    onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <FileCode size={13} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 12, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#ffffff' : '#cbd5e1' }}>{fileName}</div>
                      {fileDir && <div style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{fileDir}</div>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Code Viewer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-void)', overflow: 'hidden', position: 'relative' }}>
          {selectedFile ? (
            <>
              {/* Toolbar */}
              <div style={{ height: 42, borderBottom: '1px solid var(--border)', background: 'rgba(5, 5, 5, 0.4)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                  File: <strong style={{ color: '#ffffff' }}>{selectedFile}</strong>
                </span>
                
                <button onClick={copyToClipboard}
                  style={{
                    height: 26,
                    padding: '0 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: copied ? '#10b981' : '#ffffff',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                >
                  {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              {/* Code Panel */}
              <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', margin: 0, display: 'flex', gap: 18 }} className="scroll-area">
                {/* Line Numbers */}
                <div style={{
                  userSelect: 'none',
                  textAlign: 'right',
                  color: 'var(--text-faint)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  borderRight: '1px solid rgba(255, 255, 255, 0.04)',
                  paddingRight: 16
                }}>
                  {(files[selectedFile] || '').split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Code body */}
                <pre style={{
                  margin: 0,
                  padding: 0,
                  background: 'none',
                  border: 'none',
                  color: '#e2e8f0',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  whiteSpace: 'pre',
                  overflowX: 'auto',
                  flex: 1
                }}>
                  <code>{files[selectedFile]}</code>
                </pre>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
              <Terminal size={32} style={{ color: 'var(--text-faint)' }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>SELECT A GENERATED FILE ON THE LEFT PALETTE TO VIEW CODE</div>
            </div>
          )}
        </div>

      </div>
      
      {/* ── KEYFRAME CUSTOM STYLING ────────────────────── */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
