'use client';
import { Handle, Position } from '@xyflow/react';
import { 
  Globe, 
  Bell, 
  Clock, 
  Database, 
  Zap, 
  GitBranch, 
  RefreshCw, 
  Lock, 
  Key, 
  Send, 
  Radio 
} from 'lucide-react';

// Mapper to translate emoji strings to Lucide components dynamically
export function getNodeIcon(iconName: string, size = 14, color?: string) {
  const style = color ? { color } : undefined;
  switch (iconName) {
    case '🌐': return <Globe size={size} style={style} />;
    case '🔔': return <Bell size={size} style={style} />;
    case '⏰': return <Clock size={size} style={style} />;
    case '🗄️': return <Database size={size} style={style} />;
    case '⚡': return <Zap size={size} style={style} />;
    case '🔀': return <GitBranch size={size} style={style} />;
    case '🔄': return <RefreshCw size={size} style={style} />;
    case '🔐': return <Lock size={size} style={style} />;
    case '🗝️': return <Key size={size} style={style} />;
    case '📤': return <Send size={size} style={style} />;
    case '📡': return <Radio size={size} style={style} />;
    default: return null;
  }
}

// Custom helper to generate sci-fi handle styling
const getHandleStyle = (color: string, custom = {}) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: `2px solid ${color}`,
  background: '#020617',
  boxShadow: `0 0 8px ${color}`,
  zIndex: 10,
  transition: 'all 0.2s',
  ...custom
});

// A mini-terminal simulation inside node blocks
function MiniConsole({ color, content }: { color: string; content: string }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      background: 'rgba(2, 6, 23, 0.85)',
      border: `1px solid ${color}30`,
      boxShadow: `inset 0 0 8px ${color}10`,
      borderRadius: 4,
      padding: '6px 8px',
      color: color,
      maxWidth: 192,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      marginTop: 6,
    }}>
      <span style={{ color: '#475569', marginRight: 4, userSelect: 'none' }}>$</span>
      {content}
    </div>
  );
}

function NodeShell({ color, icon, title, subtitle, children, selected }: any) {
  const borderColor = selected ? color : 'rgba(255, 255, 255, 0.08)';
  const glowShadow = selected ? `0 0 16px ${color}20` : '0 4px 12px rgba(0,0,0,0.5)';

  return (
    <div style={{
      position: 'relative',
      background: '#09090b',
      border: `1px solid ${borderColor}`,
      borderRadius: '10px',
      minWidth: 220,
      boxShadow: glowShadow,
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Header Bar */}
      <div style={{
        background: `${color}0b`,
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        {/* Tech Icon Container */}
        <div style={{
          width: 26,
          height: 26,
          borderRadius: '6px',
          background: `${color}12`,
          border: `1px solid ${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>{typeof icon === 'string' ? getNodeIcon(icon, 13, color) : icon}</div>
        
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>{title}</div>
          {subtitle && (
            <div style={{
              fontSize: 8,
              color: '#64748b',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginTop: 1
            }}>{subtitle}</div>
          )}
        </div>
        
        {/* Technical eyebrow System Indicator */}
        <div style={{
          fontSize: 8,
          color: color,
          fontWeight: 700,
        }}>
          SYS
        </div>
      </div>

      {/* Children / Body content */}
      {children && (
        <div style={{
          padding: '12px 14px',
          fontSize: 10,
          color: '#cbd5e1',
          lineHeight: 1.5,
          background: '#030303',
          borderTop: '1px solid rgba(255, 255, 255, 0.02)',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ color: '#475569', minWidth: 50, fontSize: 9 }}>{label}</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        background: '#040814',
        border: '1px solid #14223c',
        borderRadius: 3,
        padding: '1px 6px',
        color: '#e2e8f0',
        maxWidth: 130,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>{value || '—'}</span>
    </div>
  );
}

// ─── TRIGGER NODE ──────────────────────────────────────────────────────────
export function TriggerNode({ data, selected }: any) {
  const methodColors: Record<string, string> = { GET: '#10b981', POST: '#6366f1', PUT: '#f59e0b', DELETE: '#ef4444', PATCH: '#38bdf8', ANY: '#8b5cf6' };
  const color = methodColors[data.method] || '#10b981';
  return (
    <NodeShell color={color} icon="🌐" title="HTTP Trigger" subtitle="Entry point" selected={selected}>
      <Handle type="source" position={Position.Right} style={getHandleStyle(color)} className="handle-pulse" />
      <DataRow label="Method" value={data.method || 'GET'} />
      <DataRow label="Path" value={data.path || '/endpoint'} />
    </NodeShell>
  );
}

// ─── WEBHOOK NODE ──────────────────────────────────────────────────────────
export function WebhookNode({ data, selected }: any) {
  const color = '#f59e0b';
  return (
    <NodeShell color={color} icon="🔔" title="Webhook" subtitle="External trigger" selected={selected}>
      <Handle type="source" position={Position.Right} style={getHandleStyle(color)} className="handle-pulse" />
      <DataRow label="Path" value={data.path || '/webhook'} />
      <DataRow label="Secret" value={data.secret ? '••••••••' : 'not set'} />
    </NodeShell>
  );
}

// ─── SCHEDULED TRIGGER ─────────────────────────────────────────────────────
export function ScheduledNode({ data, selected }: any) {
  const color = '#8b5cf6';
  return (
    <NodeShell color={color} icon="⏰" title="Scheduled" subtitle="Cron trigger" selected={selected}>
      <Handle type="source" position={Position.Right} style={getHandleStyle(color)} className="handle-pulse" />
      <DataRow label="Cron" value={data.cron || '0 * * * *'} />
      <DataRow label="TZ" value={data.timezone || 'UTC'} />
    </NodeShell>
  );
}

// ─── DATABASE NODE ─────────────────────────────────────────────────────────
export function DatabaseNode({ data, selected }: any) {
  const color = '#38bdf8';
  return (
    <NodeShell color={color} icon="🗄️" title="Database" subtitle="PostgreSQL query" selected={selected}>
      <Handle type="target" position={Position.Left} style={getHandleStyle(color)} className="handle-pulse" />
      <Handle type="source" position={Position.Right} style={getHandleStyle(color)} className="handle-pulse" />
      <MiniConsole color="#7dd3fc" content={data.query || 'SELECT * FROM table;'} />
    </NodeShell>
  );
}

// ─── CUSTOM CODE NODE ──────────────────────────────────────────────────────
export function CustomCodeNode({ data, selected }: any) {
  const color = '#f59e0b';
  const preview = (data.code || '// custom logic').split('\n')[0].slice(0, 40);
  return (
    <NodeShell color={color} icon="⚡" title="JavaScript" subtitle="Custom logic" selected={selected}>
      <Handle type="target" position={Position.Left} style={getHandleStyle(color)} className="handle-pulse" />
      <Handle type="source" position={Position.Right} style={getHandleStyle(color)} className="handle-pulse" />
      <MiniConsole color="#fcd34d" content={`${preview}...`} />
    </NodeShell>
  );
}

// ─── IF/ELSE NODE ──────────────────────────────────────────────────────────
export function IfElseNode({ data, selected }: any) {
  const color = '#a78bfa';
  return (
    <NodeShell color={color} icon="🔀" title="If / Else" subtitle="Conditional branch" selected={selected}>
      <Handle type="target" position={Position.Left} style={getHandleStyle(color)} className="handle-pulse" />
      <Handle id="true" type="source" position={Position.Right} style={getHandleStyle('#10b981', { top: '35%' })} className="handle-pulse" />
      <Handle id="false" type="source" position={Position.Right} style={getHandleStyle('#ef4444', { top: '65%' })} className="handle-pulse" />
      <DataRow label="If" value={data.condition || 'ctx.body.x > 0'} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 9, color: '#10b981', fontFamily: "'JetBrains Mono', monospace" }}>✓ true →</span>
        <span style={{ fontSize: 9, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>✗ false →</span>
      </div>
    </NodeShell>
  );
}

// ─── SWITCH CASE NODE ──────────────────────────────────────────────────────
export function SwitchCaseNode({ data, selected }: any) {
  const color = '#d946ef';
  const cases = data.cases || ['paid', 'pending', 'default'];
  return (
    <NodeShell color={color} icon="🔀" title="Switch Case" subtitle="Multi-branch switch" selected={selected}>
      <Handle type="target" position={Position.Left} style={getHandleStyle(color)} className="handle-pulse" />
      
      {/* Map cases to handles */}
      {cases.map((c: string, index: number) => {
        const topPct = `${((index + 1) * 100) / (cases.length + 1)}%`;
        const handleColor = c === 'default' ? '#64748b' : '#d946ef';
        return (
          <Handle
            key={c}
            id={c}
            type="source"
            position={Position.Right}
            style={getHandleStyle(handleColor, { top: topPct })}
            className="handle-pulse"
          />
        );
      })}
      
      <DataRow label="Select" value={data.expression || 'context.request.body.status'} />
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {cases.map((c: string, idx: number) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: c === 'default' ? '#64748b' : '#e2e8f0', fontFamily: "'JetBrains Mono', monospace" }}>
            <span>↳ {c}</span>
            <span style={{ color: '#475569' }}>→</span>
          </div>
        ))}
      </div>
    </NodeShell>
  );
}

// ─── TRANSFORM NODE ────────────────────────────────────────────────────────
export function TransformNode({ data, selected }: any) {
  const color = '#ec4899';
  return (
    <NodeShell color={color} icon="🔄" title="Transform" subtitle="Map & reshape data" selected={selected}>
      <Handle type="target" position={Position.Left} style={getHandleStyle(color)} className="handle-pulse" />
      <Handle type="source" position={Position.Right} style={getHandleStyle(color)} className="handle-pulse" />
      <DataRow label="Map" value={data.mapping || '{ id: body.id }'} />
    </NodeShell>
  );
}

// ─── JWT VALIDATE NODE ─────────────────────────────────────────────────────
export function JwtValidateNode({ data, selected }: any) {
  const color = '#ef4444';
  return (
    <NodeShell color={color} icon="🔐" title="JWT Validate" subtitle="Verify Bearer token" selected={selected}>
      <Handle type="target" position={Position.Left} style={getHandleStyle(color)} className="handle-pulse" />
      <Handle type="source" position={Position.Right} style={getHandleStyle(color)} className="handle-pulse" />
      <DataRow label="Secret" value={data.secret ? '••••••••' : 'env.JWT_SECRET'} />
    </NodeShell>
  );
}

// ─── API KEY NODE ──────────────────────────────────────────────────────────
export function ApiKeyNode({ data, selected }: any) {
  const color = '#f97316';
  return (
    <NodeShell color={color} icon="🗝️" title="API Key" subtitle="Header validation" selected={selected}>
      <Handle type="target" position={Position.Left} style={getHandleStyle(color)} className="handle-pulse" />
      <Handle type="source" position={Position.Right} style={getHandleStyle(color)} className="handle-pulse" />
      <DataRow label="Header" value={data.headerName || 'x-api-key'} />
    </NodeShell>
  );
}

// ─── RESPONSE NODE ─────────────────────────────────────────────────────────
export function ResponseNode({ data, selected }: any) {
  const statusColor = (data.statusCode || 200) < 400 ? '#10b981' : '#ef4444';
  return (
    <NodeShell color={statusColor} icon="📤" title="Response" subtitle="HTTP response" selected={selected}>
      <Handle type="target" position={Position.Left} style={getHandleStyle(statusColor)} className="handle-pulse" />
      <DataRow label="Status" value={String(data.statusCode || 200)} />
      {data.redirectUrl ? (
        <DataRow label="Redirect" value={data.redirectUrl} />
      ) : (
        <DataRow label="Body" value={typeof data.body === 'string' ? data.body.slice(0, 25) : JSON.stringify(data.body || {}).slice(0, 25)} />
      )}
    </NodeShell>
  );
}

// ─── HTTP CLIENT NODE ──────────────────────────────────────────────────────
export function HttpClientNode({ data, selected }: any) {
  const color = '#14b8a6';
  return (
    <NodeShell color={color} icon="📡" title="HTTP Client" subtitle="External API Call" selected={selected}>
      <Handle type="target" position={Position.Left} style={getHandleStyle(color)} className="handle-pulse" />
      <Handle type="source" position={Position.Right} style={getHandleStyle(color)} className="handle-pulse" />
      <DataRow label="Method" value={data.method || 'GET'} />
      <MiniConsole color="#5eead4" content={data.url || 'https://api.example.com'} />
    </NodeShell>
  );
}

// ─── NODE TYPES MAP ────────────────────────────────────────────────────────
export const nodeTypes = {
  triggerNode: TriggerNode,
  webhookNode: WebhookNode,
  scheduledNode: ScheduledNode,
  databaseNode: DatabaseNode,
  customCodeNode: CustomCodeNode,
  ifElseNode: IfElseNode,
  switchCaseNode: SwitchCaseNode,
  httpClientNode: HttpClientNode,
  transformNode: TransformNode,
  jwtValidateNode: JwtValidateNode,
  apiKeyNode: ApiKeyNode,
  responseNode: ResponseNode,
};

// ─── NODE PALETTE CONFIG ───────────────────────────────────────────────────
export const NODE_PALETTE = [
  {
    category: 'Triggers',
    color: '#10b981',
    nodes: [
      { type: 'triggerNode', icon: '🌐', label: 'HTTP Trigger', desc: 'REST endpoint entry', defaultData: { method: 'GET', path: '/api/endpoint' } },
      { type: 'webhookNode', icon: '🔔', label: 'Webhook', desc: 'External event trigger', defaultData: { path: '/webhook', secret: '' } },
      { type: 'scheduledNode', icon: '⏰', label: 'Scheduled', desc: 'Cron-based trigger', defaultData: { cron: '0 * * * *', timezone: 'UTC' } },
    ]
  },
  {
    category: 'Logic',
    color: '#a78bfa',
    nodes: [
      { type: 'ifElseNode', icon: '🔀', label: 'If / Else', desc: 'Conditional branch', defaultData: { condition: 'context.request.body.active === true' } },
      { type: 'switchCaseNode', icon: '🔀', label: 'Switch Case', desc: 'Multi-branch switch', defaultData: { expression: 'context.request.body.status', cases: ['paid', 'pending', 'default'] } },
      { type: 'transformNode', icon: '🔄', label: 'Transform', desc: 'Map & reshape data', defaultData: { mapping: '{ id: steps.prev.id }' } },
    ]
  },
  {
    category: 'Data',
    color: '#38bdf8',
    nodes: [
      { type: 'databaseNode', icon: '🗄️', label: 'Database', desc: 'PostgreSQL query', defaultData: { query: 'SELECT * FROM users WHERE id = $request.params.id;' } },
    ]
  },
  {
    category: 'Integrations',
    color: '#14b8a6',
    nodes: [
      { type: 'httpClientNode', icon: '📡', label: 'HTTP Client', desc: 'Call external REST APIs', defaultData: { method: 'GET', url: 'https://api.github.com/users/$request.body.username', headers: '{\n  "User-Agent": "FlowForge-Platform"\n}', body: '' } },
    ]
  },
  {
    category: 'Security',
    color: '#ef4444',
    nodes: [
      { type: 'jwtValidateNode', icon: '🔐', label: 'JWT Validate', desc: 'Verify JWT token', defaultData: { secret: '' } },
      { type: 'apiKeyNode', icon: '🗝️', label: 'API Key', desc: 'Check API key header', defaultData: { headerName: 'x-api-key' } },
    ]
  },
  {
    category: 'Custom',
    color: '#f59e0b',
    nodes: [
      { type: 'customCodeNode', icon: '⚡', label: 'JavaScript', desc: 'Custom JS logic', defaultData: { code: '// Access context\nconst { body } = context.request;\n\n// Return output\nreturn { processed: true, data: body };' } },
    ]
  },
  {
    category: 'Response',
    color: '#10b981',
    nodes: [
      { type: 'responseNode', icon: '📤', label: 'Response', desc: 'Send HTTP response', defaultData: { statusCode: 200, body: '$steps.nodeId' } },
    ]
  },
];

