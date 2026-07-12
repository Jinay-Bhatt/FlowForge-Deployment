'use client';
import { useState } from 'react';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────── */
interface DocSection {
  id: string;
  title: string;
  items: { id: string; label: string }[];
}

/* ─── Sidebar config ─────────────────────────────── */
const SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'quickstart', label: 'Quickstart Guide' },
      { id: 'visual-editor', label: 'Visual Editor Basics' },
      { id: 'architecture', label: 'Architecture Overview' },
    ],
  },
  {
    id: 'nodes-reference',
    title: 'Nodes Reference',
    items: [
      { id: 'http-triggers', label: 'HTTP Triggers' },
      { id: 'auth-guards', label: 'Auth Guards' },
      { id: 'secure-sandbox', label: 'Secure JS Sandbox' },
      { id: 'database', label: 'Neondb / PostgreSQL' },
      { id: 'conditionals', label: 'Conditionals & Loops' },
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment & SDK',
    items: [
      { id: 'production-gateway', label: 'Production Gateway' },
      { id: 'export-typescript', label: 'Exporting TypeScript' },
      { id: 'cicd-github', label: 'CI/CD GitHub Sync' },
      { id: 'env-secrets', label: 'Environment Secrets' },
    ],
  },
];

function Code({ children, lang = '' }: { children: string; lang?: string }) {
  return (
    <div style={{
      background: '#09090b',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      {lang && (
        <div style={{
          padding: '6px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontSize: 10.5,
          fontWeight: 700,
          color: '#475569',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          background: 'rgba(255,255,255,0.015)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {lang}
        </div>
      )}
      <pre style={{
        margin: 0,
        padding: '16px 20px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13,
        color: '#cbd5e1',
        overflowX: 'auto',
        lineHeight: 1.8,
        whiteSpace: 'pre',
      }}>
        {children}
      </pre>
    </div>
  );
}

function InfoBox({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const colors: Record<string, { bg: string; border: string; icon: string; label: string }> = {
    info:    { bg: 'rgba(99,102,241,0.05)',  border: 'rgba(99,102,241,0.2)',  icon: 'i', label: 'Note' },
    warning: { bg: 'rgba(245,158,11,0.05)',  border: 'rgba(245,158,11,0.2)',  icon: '!', label: 'Warning' },
    tip:     { bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.2)', icon: '*', label: 'Tip' },
  };
  const c = colors[type];
  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: '14px 18px',
      marginBottom: 24,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1, fontWeight: 800, color: '#e2e8f0' }}>{c.icon}</span>
      <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.65 }}>
        <strong style={{ color: '#e2e8f0' }}>{c.label}: </strong>{children}
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 22,
      fontWeight: 800,
      color: '#ffffff',
      letterSpacing: '-0.5px',
      margin: '48px 0 16px 0',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: 12,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: 16,
      fontWeight: 700,
      color: '#e2e8f0',
      margin: '28px 0 10px 0',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 15.5, color: '#94a3b8', lineHeight: 1.75, marginBottom: 18 }}>
      {children}
    </p>
  );
}

function PropTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 24 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['Property', 'Type', 'Description'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#e2e8f0', fontWeight: 700, background: 'rgba(255,255,255,0.02)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([prop, type, desc], i) => (
            <tr key={prop} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              <td style={{ padding: '9px 12px', fontFamily: 'JetBrains Mono, monospace', color: '#a5b4fc', fontSize: 12.5 }}>{prop}</td>
              <td style={{ padding: '9px 12px', fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8', fontSize: 12 }}>{type}</td>
              <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DOC_CONTENT: Record<string, React.ReactNode> = {
  introduction: (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Getting Started</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Introduction</h1>
      <P>FlowForge is a visual API builder that transforms the way you design, secure, and deploy backend services. Instead of writing boilerplate Express or Fastify routes from scratch, you drag-and-drop nodes onto a canvas, wire them together, and FlowForge compiles them into clean, production-ready TypeScript code.</P>
      <P>Whether you are a solo developer prototyping quickly or a team deploying enterprise-grade APIs, FlowForge adapts to your workflow with zero vendor lock-in.</P>
      <InfoBox type="tip">New to FlowForge? Jump straight to the Quickstart Guide to have your first API live in under 5 minutes.</InfoBox>
      <H2>Core Pillars</H2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {[
          { icon: 'V', title: 'Visual Canvas', desc: 'Drag-and-drop 12+ node types — triggers, DB queries, auth guards, custom code, conditionals, cron schedulers.' },
          { icon: 'S', title: 'Secure Execution', desc: 'Custom JS runs inside isolated Node.js VMs with a hard 200ms CPU timeout. No process, no require.' },
          { icon: 'D', title: 'Zero Config Deploy', desc: 'One-click publish to the FlowForge gateway. No build step, no Dockerfile, no server config required.' },
          { icon: 'E', title: 'TypeScript Export', desc: 'Export clean Fastify + Prisma + TypeScript. Push to GitHub. Run on any cloud, zero runtime dependency.' },
        ].map(c => (
          <div key={c.title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{c.desc}</div>
          </div>
        ))}
      </div>
      <H2>How FlowForge Fits Your Stack</H2>
      <P>FlowForge acts as the API layer sitting between your clients and your data sources. It provides authentication, rate limiting, transformation, and routing out of the box, all configurable visually.</P>
      <Code lang="Architecture">{`Client (Browser / SDK)
       |
       v
FlowForge Edge Gateway  <-- JWT Auth, Rate Limiting, CORS
       |
       |-->  Visual Workflow Engine  <-- Your canvas pipeline
       |         |
       |         |-->  Secure JS Sandbox (custom logic)
       |         |-->  Prisma ORM  -->  PostgreSQL / Neondb
       |         |-->  External HTTP calls
       |
       v
    Response  ->  Client`}</Code>
      <H2>Key Concepts</H2>
      <H3>Workflows</H3>
      <P>A Workflow is a directed acyclic graph (DAG) of nodes that defines a single API endpoint. Each workflow has one entry node (an HTTP Trigger) and terminates at a response node.</P>
      <H3>Nodes</H3>
      <P>Nodes are the building blocks of a workflow. Each node performs a single, well-defined operation: receive a request, query a database, validate a JWT, execute custom JS, evaluate a condition, and so on.</P>
      <H3>Projects</H3>
      <P>A Project groups multiple workflows under a single gateway namespace. Think of it as your microservice or API module, for example an auth-service or a payments-service.</P>
    </>
  ),
  quickstart: (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Getting Started</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Quickstart Guide</h1>
      <P>Get your first API endpoint live in under 5 minutes. No terminal required for the core workflow, everything runs visually in your browser.</P>
      <H2>Step 1 - Create an Account</H2>
      <P>Visit flowforge.app and click Get Started Free. Sign up with email. No credit card required for the Hobby plan.</P>
      <H2>Step 2 - Create a New Project</H2>
      <P>From your Dashboard, click + New Project. Give it a name and a description. Your project gets a unique gateway URL.</P>
      <Code lang="">{`https://api.flowforge.app/u/my-first-api`}</Code>
      <H2>Step 3 - Open the Visual Builder</H2>
      <P>Click into your project and then Open Builder. You will see the canvas, an infinite dark grid where you build your API pipeline.</P>
      <H2>Step 4 - Drag Your First Node</H2>
      <P>From the left panel, drag an HTTP Trigger onto the canvas. Configure it:</P>
      <PropTable rows={[
        ['method', 'GET | POST | PUT | DELETE', 'The HTTP method this endpoint accepts'],
        ['path', 'string', 'e.g. /users or /users/:id'],
        ['description', 'string', 'Optional label shown in the inspector'],
      ]} />
      <H2>Step 5 - Add a Response Node</H2>
      <P>Drag a Response node, connect it to the HTTP Trigger with an edge, and set the status code and body:</P>
      <Code lang="JSON">{`{
  "statusCode": 200,
  "body": {
    "message": "Hello from FlowForge!"
  }
}`}</Code>
      <H2>Step 6 - Publish</H2>
      <P>Click Publish in the top-right. Your endpoint goes live instantly. Test it:</P>
      <Code lang="Shell">{`$ curl https://api.flowforge.app/u/my-first-api/users
{ "message": "Hello from FlowForge!" }`}</Code>
      <InfoBox type="tip">Use the Monitor tab to see real-time request logs, latency, and error rates for your live endpoint.</InfoBox>
    </>
  ),
  'visual-editor': (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Getting Started</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Visual Editor Basics</h1>
      <P>The FlowForge Visual Editor is a React-Flow-powered canvas where you design your API pipelines by connecting nodes.</P>
      <H2>Canvas Navigation</H2>
      <PropTable rows={[
        ['Scroll', 'Mouse wheel', 'Zoom in / out'],
        ['Pan', 'Click + drag (empty area)', 'Move the canvas'],
        ['Select node', 'Click a node', 'Opens node inspector on the right'],
        ['Multi-select', 'Shift + click or drag-select', 'Select multiple nodes'],
        ['Delete', 'Select + Delete key', 'Remove selected nodes'],
        ['Undo / Redo', 'Ctrl+Z / Ctrl+Shift+Z', 'Undo or redo last canvas change'],
      ]} />
      <H2>Node Types</H2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'HTTP Trigger', color: '#6366f1', desc: 'Entry point, defines the route and HTTP method.' },
          { label: 'JWT Auth Guard', color: '#8b5cf6', desc: 'Validates Authorization header bearer tokens.' },
          { label: 'DB Query', color: '#38bdf8', desc: 'Runs Prisma ORM queries against your PostgreSQL database.' },
          { label: 'Code Block', color: '#f59e0b', desc: 'Runs custom JavaScript in an isolated VM sandbox.' },
          { label: 'Conditional', color: '#10b981', desc: 'Branches flow based on a boolean expression.' },
          { label: 'Response', color: '#e2e8f0', desc: 'Sends the HTTP response back to the client.' },
        ].map(n => (
          <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: n.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#e2e8f0', width: 140, flexShrink: 0 }}>{n.label}</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>{n.desc}</span>
          </div>
        ))}
      </div>
      <H2>Connecting Nodes</H2>
      <P>Hover over a node to reveal its handle ports (small circles on the edges). Drag from an output handle to an input handle of another node to create an edge.</P>
      <InfoBox type="info">Each node passes its output as context to the next node. The context object accumulates data as it travels through the pipeline.</InfoBox>
      <H2>Toolbar Actions</H2>
      <PropTable rows={[
        ['Save', 'Ctrl+S', 'Saves the current canvas state'],
        ['Publish', 'Top-right button', 'Deploys the workflow to the live gateway'],
        ['Export', 'Top-right menu', 'Generates and downloads TypeScript source'],
        ['Zoom to Fit', 'Ctrl+Shift+F', 'Resets the view to show all nodes'],
      ]} />
    </>
  ),
  architecture: (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Getting Started</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Architecture Overview</h1>
      <P>FlowForge is composed of four primary layers: the Frontend Canvas, the API Gateway, the Workflow Engine, and the Export Compiler.</P>
      <H2>System Layers</H2>
      <Code lang="Architecture">{`+--------------------------------------------------+
|              FlowForge Platform                  |
|                                                  |
|  +--------------+    +--------------------+     |
|  | Visual Canvas|    |   REST Admin API   |     |
|  | (Next.js +   |    |  (Fastify + Auth)  |     |
|  | React Flow)  |    +--------+-----------+     |
|  +------+-------+             |                 |
|         |  save/publish        |                |
|         v                      v                |
|  +---------------------------------------------+|
|  |          Workflow Storage (DB)               ||
|  |      Workflow DAG serialised as JSON         ||
|  +---------------------------------------------+|
|                     |  on HTTP request           |
|                     v                            |
|  +---------------------------------------------+|
|  |          API Gateway Layer                   ||
|  |  JWT Auth . Rate Limit . CORS . Routing      ||
|  +---------------------------------------------+|
|                     |                            |
|                     v                            |
|  +---------------------------------------------+|
|  |       Workflow Execution Engine              ||
|  |  Interprets DAG . Runs nodes in order        ||
|  |  VM Sandbox . Prisma ORM . HTTP calls        ||
|  +---------------------------------------------+|
+--------------------------------------------------+`}</Code>
      <H2>Request Lifecycle</H2>
      <P>When a client hits your FlowForge gateway URL, here is the exact sequence of events:</P>
      {[
        ['1', 'Gateway receives HTTP request', 'The Fastify-based gateway receives the request and matches it to a published workflow by project slug + path.'],
        ['2', 'Auth middleware runs', 'If the workflow has an Auth Guard node configured, the JWT is validated here. A 401 is returned immediately on failure.'],
        ['3', 'Rate limiter checks', 'Per-endpoint rate limits are checked using an in-memory sliding window. A 429 is returned if exceeded.'],
        ['4', 'DAG execution starts', 'The workflow execution engine loads the serialised DAG and starts from the entry node.'],
        ['5', 'Node-by-node execution', 'Each node runs in sequence (or parallel for branches). DB queries use Prisma. Code blocks run in isolated Node.js VMs.'],
        ['6', 'Response assembled', 'The final Response node data is serialised to JSON and returned to the client.'],
      ].map(([num, title, desc]) => (
        <div key={num} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1.5px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#818cf8', flexShrink: 0 }}>{num}</div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>{desc}</div>
          </div>
        </div>
      ))}
      <H2>Data Model</H2>
      <Code lang="TypeScript">{`interface Project {
  id: string;
  name: string;
  slug: string;        // gateway URL segment
  userId: string;
  workflows: Workflow[];
}

interface Workflow {
  id: string;
  name: string;
  path: string;        // e.g. /users/:id
  method: HttpMethod;
  isPublished: boolean;
  nodes: Node[];       // serialised DAG
  edges: Edge[];
}

interface Node {
  id: string;
  type: NodeType;
  data: Record<string, any>;
  position: { x: number; y: number };
}`}</Code>
    </>
  ),
  'http-triggers': (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Nodes Reference</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>HTTP Triggers</h1>
      <P>The HTTP Trigger node is the entry point for every workflow. It defines the route, method, and request shape that your API endpoint will accept. Every workflow must begin with exactly one HTTP Trigger.</P>
      <H2>Configuration</H2>
      <PropTable rows={[
        ['method', 'GET | POST | PUT | PATCH | DELETE', 'HTTP method the endpoint accepts'],
        ['path', 'string (URL pattern)', 'Route path, e.g. /users or /users/:id'],
        ['description', 'string', 'Optional human-readable label'],
        ['parseBody', 'boolean', 'Whether to auto-parse JSON request body (default: true)'],
        ['parseQuery', 'boolean', 'Whether to auto-parse query string params (default: true)'],
      ]} />
      <H2>Context Output</H2>
      <Code lang="TypeScript">{`interface HttpContext {
  request: {
    method: string;
    path: string;
    params: Record<string, string>;
    query: Record<string, string>;
    body: any;
    headers: Record<string, string>;
    ip: string;
  };
}`}</Code>
      <H2>Path Parameters</H2>
      <Code lang="Examples">{`/users             -> static path
/users/:id         -> captures id
/users/:id/posts   -> captures id
/orgs/:org/repos/:repo  -> captures org and repo`}</Code>
      <InfoBox type="info">Path parameters are available in subsequent nodes as context.request.params.id</InfoBox>
    </>
  ),
  'auth-guards': (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Nodes Reference</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Auth Guards</h1>
      <P>Auth Guard nodes protect your API endpoints by validating tokens before executing any downstream logic. FlowForge supports JWT (RS256 and HS256) and API Key strategies out of the box.</P>
      <H2>JWT Auth Guard</H2>
      <PropTable rows={[
        ['algorithm', 'RS256 | HS256', 'JWT signing algorithm (default: RS256)'],
        ['secret', 'string', 'HS256 secret key (store in Environment Secrets)'],
        ['publicKey', 'string', 'RS256 PEM public key (store in Environment Secrets)'],
        ['expiryCheck', 'boolean', 'Enforce token expiration (default: true)'],
        ['audience', 'string', 'Expected JWT aud claim (optional)'],
        ['issuer', 'string', 'Expected JWT iss claim (optional)'],
      ]} />
      <InfoBox type="warning">Never paste your JWT secret directly into the node config. Use Environment Secrets and reference them by name.</InfoBox>
      <H2>Context After Auth</H2>
      <Code lang="TypeScript">{`context.auth = {
  sub: 'user_id_from_jwt',
  email: 'user@example.com',
  role: 'admin',
  iat: 1720000000,
  exp: 1720086400,
};`}</Code>
      <H2>API Key Guard</H2>
      <PropTable rows={[
        ['source', 'header | query', 'Where to read the API key from'],
        ['headerName', 'string', "Header name (default: 'X-API-Key')"],
        ['queryParam', 'string', "Query param name (default: 'api_key')"],
        ['keySecret', 'string', 'The valid key value (use Environment Secrets)'],
      ]} />
      <H2>Failure Behaviour</H2>
      <Code lang="Response">{`HTTP/1.1 401 Unauthorized
Content-Type: application/json

{ "error": "Unauthorized", "message": "Invalid or expired token" }`}</Code>
    </>
  ),
  'secure-sandbox': (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Nodes Reference</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Secure JS Sandbox</h1>
      <P>The Code Block node lets you run arbitrary JavaScript inside an isolated Node.js VM. It gives you full programmatic control at any point in your pipeline.</P>
      <InfoBox type="warning">Sandbox execution has a hard 200ms CPU timeout. Requests that exceed this are killed and return a 500 error.</InfoBox>
      <H2>Writing Sandbox Code</H2>
      <Code lang="JavaScript">{`const { body, auth } = context.request;

const transformed = {
  ...body,
  userId: auth.sub,
  createdAt: new Date().toISOString(),
  slug: body.title.toLowerCase().replace(/\\s+/g, '-'),
};

return { payload: transformed };`}</Code>
      <H2>Available APIs</H2>
      <PropTable rows={[
        ['JSON', 'global', 'JSON.parse and JSON.stringify'],
        ['Math', 'global', 'Full Math object'],
        ['Date', 'global', 'Date constructor and static methods'],
        ['console.log', 'function', 'Output is captured in execution logs'],
        ['fetch', 'async function', 'Make outbound HTTP requests (up to 2 concurrent)'],
        ['btoa / atob', 'function', 'Base64 encode/decode'],
        ['crypto.randomUUID', 'function', 'Generate a UUID v4'],
      ]} />
      <H2>Restricted APIs</H2>
      <Code lang="Blocked">{`process          -- no shell access
require / import -- no module loading
fs               -- no filesystem access
child_process    -- no subprocess execution
eval             -- no dynamic code evaluation`}</Code>
    </>
  ),
  database: (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Nodes Reference</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Neondb / PostgreSQL</h1>
      <P>The DB Query node connects directly to your PostgreSQL database using Prisma ORM under the hood. No raw SQL required, though raw queries are also supported.</P>
      <H2>Connecting Your Database</H2>
      <Code lang="Connection String">{`# Standard PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Neondb (serverless)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`}</Code>
      <H2>Query Operations</H2>
      <PropTable rows={[
        ['findMany', 'SELECT', 'Returns all matching records. Supports where, orderBy, take, skip.'],
        ['findUnique', 'SELECT ONE', 'Returns a single record by unique field (e.g. id, email).'],
        ['create', 'INSERT', 'Creates a new record. Returns the created record.'],
        ['update', 'UPDATE', 'Updates a record by unique identifier.'],
        ['delete', 'DELETE', 'Deletes a record by unique identifier.'],
        ['raw', 'RAW SQL', 'Run arbitrary SQL using $queryRaw or $executeRaw.'],
      ]} />
      <H2>Example: Find User by ID</H2>
      <Code lang="Node Config">{`Operation:  findUnique
Model:      User
Where:      { id: context.request.params.id }
Select:     { id: true, email: true, name: true, createdAt: true }`}</Code>
      <InfoBox type="tip">The result is placed in context.dbResult for downstream nodes to use.</InfoBox>
    </>
  ),
  conditionals: (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Nodes Reference</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Conditionals & Loops</h1>
      <P>Use Conditional nodes to branch your workflow into different paths based on runtime data. Loop nodes iterate over arrays returned by previous nodes.</P>
      <H2>Conditional Node</H2>
      <PropTable rows={[
        ['expression', 'JS expression string', 'Evaluated in the sandbox. Must return a boolean.'],
        ['trueLabel', 'string', 'Label for the true output edge (default: Yes)'],
        ['falseLabel', 'string', 'Label for the false output edge (default: No)'],
      ]} />
      <H2>Expression Examples</H2>
      <Code lang="JavaScript">{`context.auth.role === 'admin'
context.dbResult !== null
context.request.body.price > 0`}</Code>
      <H2>Branching Example</H2>
      <Code lang="Workflow">{`HTTP Trigger (DELETE /posts/:id)
  +--> Auth Guard (JWT)
         +--> DB Query (find post by id)
                +--> Conditional (context.dbResult?.authorId === context.auth.sub)
                       +--> [true]  DB Query (delete post)
                       |              +--> Response (200, { deleted: true })
                       +--> [false] Response (403, { error: "Forbidden" })`}</Code>
      <H2>Loop Node</H2>
      <PropTable rows={[
        ['arrayPath', 'string', 'Path to array in context, e.g. context.dbResult'],
        ['itemAlias', 'string', 'Name to use for each item, e.g. post -> context.post'],
        ['maxIterations', 'number', 'Safety cap to prevent runaway loops (default: 100)'],
      ]} />
      <InfoBox type="warning">Loops with many iterations can exceed the 200ms sandbox timeout. For bulk operations, consider using a DB Query with a batch operation instead.</InfoBox>
    </>
  ),
  'production-gateway': (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Deployment & SDK</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Production Gateway</h1>
      <P>Every FlowForge project has a dedicated Edge Gateway URL. Once you publish a workflow, it is live at that URL instantly, no redeployment pipeline, no CI/CD wait.</P>
      <H2>Gateway URL Structure</H2>
      <Code lang="">{`https://api.flowforge.app/u/{project-slug}/{workflow-path}

https://api.flowforge.app/u/my-startup/users
https://api.flowforge.app/u/my-startup/users/42
https://api.flowforge.app/u/my-startup/auth/login`}</Code>
      <H2>Gateway Features</H2>
      {[
        ['JWT Authentication', 'Per-endpoint RS256 / HS256 token validation with configurable claims.'],
        ['API Key Auth', 'Header or query-param key validation for server-to-server calls.'],
        ['Rate Limiting', 'Configurable per-endpoint request limits with sliding window algorithm.'],
        ['CORS', 'Fully configurable allowed origins, headers, and methods per project.'],
        ['TLS / HTTPS', 'All gateway URLs are served over TLS 1.3. No configuration needed.'],
        ['Health Checks', 'Each project has a /health endpoint returning gateway status.'],
      ].map(([title, desc]) => (
        <div key={title} style={{ display: 'flex', gap: 14, marginBottom: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
          <span style={{ color: '#10b981', fontSize: 14, flexShrink: 0 }}>check</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{desc}</div>
          </div>
        </div>
      ))}
      <H2>Rate Limit Configuration</H2>
      <PropTable rows={[
        ['windowMs', 'number (ms)', 'Time window for rate limit tracking (default: 60000)'],
        ['max', 'number', 'Max requests per window per IP (default: 100)'],
        ['keyBy', 'ip | user | apiKey', 'What to use as the rate limit key'],
        ['skipSuccessful', 'boolean', 'Only count failed requests toward the limit'],
      ]} />
    </>
  ),
  'export-typescript': (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Deployment & SDK</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Exporting TypeScript</h1>
      <P>Export any FlowForge workflow as a clean, dependency-free Fastify + Prisma + TypeScript project. The generated code is human-readable, extensible, and deployable to any Node.js hosting environment.</P>
      <H2>File Structure</H2>
      <Code lang="File Structure">{`my-project/
+-- src/
|   +-- routes/
|   |   +-- users.ts
|   |   +-- auth.ts
|   +-- middleware/
|   |   +-- jwtAuth.ts
|   +-- db/
|   |   +-- prisma.ts
|   +-- server.ts
+-- prisma/
|   +-- schema.prisma
+-- Dockerfile
+-- .env.example
+-- package.json`}</Code>
      <H2>Generated Route Example</H2>
      <Code lang="TypeScript">{`import { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { verifyJwt } from '../middleware/jwtAuth';

export async function usersRoutes(app: FastifyInstance) {
  app.get('/users/:id', { preHandler: verifyJwt }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
    if (!user) return reply.status(404).send({ error: 'Not found' });
    return reply.send({ user });
  });
}`}</Code>
      <H2>Running the Exported Project</H2>
      <Code lang="Shell">{`npm install
cp .env.example .env
npx prisma migrate dev
npm run dev`}</Code>
      <InfoBox type="tip">The exported project is a normal Node.js app. You can add new routes, middleware, and logic directly.</InfoBox>
    </>
  ),
  'cicd-github': (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Deployment & SDK</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CI/CD GitHub Sync</h1>
      <P>FlowForge can push your exported TypeScript project directly to a GitHub repository using the Octokit SDK. Once pushed, you can connect GitHub Actions, Railway, Render, or any other CD platform for automatic deployments.</P>
      <H2>Connecting GitHub</H2>
      <P>Go to Project Settings, then Integrations, then GitHub, and click Connect GitHub. Authorize FlowForge to access your repositories.</P>
      <H2>Configuration</H2>
      <PropTable rows={[
        ['repository', 'owner/repo', 'Target GitHub repository, e.g. yourname/my-api'],
        ['branch', 'string', 'Target branch (default: main)'],
        ['commitMessage', 'string', 'Commit message template (supports {workflow} variable)'],
        ['autoPush', 'boolean', 'Automatically push to GitHub on every Publish'],
      ]} />
      <H2>GitHub Actions CD Example</H2>
      <Code lang="YAML">{`name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx prisma generate
      - run: railway up
        env:
          RAILWAY_TOKEN: \${{ secrets.RAILWAY_TOKEN }}`}</Code>
      <InfoBox type="tip">Use Railway GitHub deploy triggers to auto-deploy every time FlowForge pushes to your repo.</InfoBox>
    </>
  ),
  'env-secrets': (
    <>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Deployment & SDK</span>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Environment Secrets</h1>
      <P>Environment Secrets let you securely store sensitive configuration such as database URLs, JWT secrets, and API keys. Secrets are encrypted at rest and never exposed in logs or exports.</P>
      <InfoBox type="warning">Never hard-code secrets into node configuration fields or code blocks. Always use Environment Secrets and reference them by name.</InfoBox>
      <H2>Adding a Secret</H2>
      <P>Go to Project Settings, then Environment Secrets, then + Add Secret. Enter a key name and value. Click Save. The secret is encrypted immediately.</P>
      <H2>Referencing Secrets</H2>
      <Code lang="Node Config">{`# JWT Auth Guard
Secret:     \${JWT_SECRET}
Algorithm:  HS256

# In Code Block
const apiKey = context.secrets.STRIPE_SECRET_KEY;`}</Code>
      <H2>Common Secrets</H2>
      <PropTable rows={[
        ['DATABASE_URL', 'string', 'PostgreSQL / Neondb connection string'],
        ['JWT_SECRET', 'string', 'HS256 JWT signing secret'],
        ['JWT_PUBLIC_KEY', 'string', 'RS256 PEM-encoded public key'],
        ['STRIPE_SECRET_KEY', 'string', 'Stripe API key for payment workflows'],
        ['GITHUB_TOKEN', 'string', 'GitHub Personal Access Token for repo sync'],
      ]} />
      <H2>In Exported Projects</H2>
      <Code lang=".env.example">{`DATABASE_URL=
JWT_SECRET=
JWT_PUBLIC_KEY=
STRIPE_SECRET_KEY=`}</Code>
      <InfoBox type="tip">Use a secrets manager like Doppler or Infisical to inject environment variables into your deployed service automatically.</InfoBox>
    </>
  ),
};

export default function DocsPage() {
  const [activeId, setActiveId] = useState('introduction');
  const content = DOC_CONTENT[activeId];
  const allItems = SECTIONS.flatMap(s => s.items);
  const currentIdx = allItems.findIndex(i => i.id === activeId);
  const prevItem = currentIdx > 0 ? allItems[currentIdx - 1] : null;
  const nextItem = currentIdx < allItems.length - 1 ? allItems[currentIdx + 1] : null;

  return (
    <div style={{ minHeight: '100vh', background: '#020202', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .sidebar-link:hover { color: #e2e8f0 !important; }
        .nav-btn:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.12) !important; }
      `}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(2,2,2,0.95)', backdropFilter: 'blur(24px)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/FlowForge.png" alt="FlowForge" width={22} height={22} style={{ objectFit: 'contain' }} />
            <span style={{ fontSize: 15.5, fontWeight: 900, color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Flow<span style={{ background: 'linear-gradient(135deg,#ffffff,#a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forge</span></span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginLeft: 4 }}>Docs</span>
          </Link>
          <div style={{ flex: 1, maxWidth: 360, marginLeft: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, height: 36, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#334155' }}>Search docs...</span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#1e293b', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>Ctrl K</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: 13, color: '#475569', textDecoration: 'none', padding: '6px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.07)' }}>Back to Home</Link>
            <Link href="/register" style={{ fontSize: 13, fontWeight: 700, color: '#000', background: '#ffffff', textDecoration: 'none', padding: '6px 16px', borderRadius: 7 }}>Get Started</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 'calc(100vh - 60px)' }}>
        <aside style={{ borderRight: '1px solid rgba(255,255,255,0.05)', padding: '32px 0', position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          {SECTIONS.map(sec => (
            <div key={sec.id} style={{ marginBottom: 32, padding: '0 20px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 10 }}>{sec.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sec.items.map(item => {
                  const isActive = activeId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        className="sidebar-link"
                        onClick={() => { setActiveId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        style={{ all: 'unset', display: 'block', width: '100%', padding: '6px 10px', borderRadius: 6, fontSize: 13.5, fontWeight: isActive ? 700 : 500, color: isActive ? '#ffffff' : '#64748b', background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent', borderLeft: isActive ? '2px solid #ffffff' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        <main style={{ padding: '48px 64px 96px 64px', maxWidth: 820 }}>
          {content}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 72, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {prevItem ? (
              <button className="nav-btn" onClick={() => { setActiveId(prevItem.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>Previous</span>
                <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{prevItem.label}</span>
              </button>
            ) : <div />}
            {nextItem ? (
              <button className="nav-btn" onClick={() => { setActiveId(nextItem.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', textAlign: 'right' as const }}>
                <span style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>Next</span>
                <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{nextItem.label}</span>
              </button>
            ) : <div />}
          </div>
        </main>
      </div>
    </div>
  );
}
