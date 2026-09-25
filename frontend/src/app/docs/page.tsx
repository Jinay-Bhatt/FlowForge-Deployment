'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search, X, Command, BookOpen, Layers, Shield, Cpu, Terminal,
  ExternalLink, Zap, CheckCircle2, ArrowRight, ArrowLeft,
  Calendar, Lock, Database, GitBranch, RefreshCw, Send, Radio, Mail, Code as CodeIcon
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────── */
interface DocItem {
  id: string;
  label: string;
  desc?: string;
  badge?: string;
}

interface DocSection {
  id: string;
  title: string;
  items: DocItem[];
}

/* ─── Comprehensive Sidebar config ───────────────── */
const SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction', desc: 'Core visual backend architecture & philosophy' },
      { id: 'quickstart', label: 'Quickstart Guide', desc: 'Create and deploy your first API in 5 minutes' },
      { id: 'visual-editor', label: 'Visual Editor & Hotkeys', desc: 'Canvas navigation, shortcut keys, and layout controls' },
      { id: 'architecture', label: 'Architecture Overview', desc: 'Fastify, Prisma, V8 runtime, and Gateway compiler' },
    ],
  },
  {
    id: 'nodes-reference',
    title: 'Nodes Reference',
    items: [
      { id: 'http-triggers', label: 'HTTP Triggers', desc: 'REST endpoints, HTTP methods, and route parameters' },
      { id: 'webhooks-events', label: 'Webhooks & Event Bus', desc: 'Incoming webhooks and message queue event subscribers', badge: 'New' },
      { id: 'scheduled-cron', label: 'Scheduled Cron', desc: 'Automated background tasks and recurring jobs' },
      { id: 'auth-guards', label: 'Auth Guards & API Keys', desc: 'JWT RS256/HS256 and header token validation' },
      { id: 'database', label: 'PostgreSQL / Neon DB', desc: 'Prisma ORM queries, transactions, and pools' },
      { id: 'secure-sandbox', label: 'Secure JS Sandbox', desc: 'Isolated V8 execution with 200ms CPU guard' },
      { id: 'conditionals', label: 'Conditionals & Loops', desc: 'Boolean branching expressions and array mapping' },
      { id: 'external-apis', label: 'External APIs & HTTP', desc: 'Dispatch outgoing HTTP requests and third-party webhooks' },
      { id: 'ai-agent', label: 'AI Agent & LLM Logic', desc: 'Gemini synthesis and intelligent workflow reasoning', badge: 'AI' },
      { id: 'email-nodes', label: 'Email Automation', desc: 'Transactional emails with DNS MX validation' },
    ],
  },
  {
    id: 'developer-tools',
    title: 'Developer Tools',
    items: [
      { id: 'ai-workflow-synthesizer', label: 'AI Pipeline Synthesizer', desc: 'Generate complete backend graphs via natural language', badge: 'AI' },
      { id: 'api-sandbox', label: 'Canvas Sandbox Test Runner', desc: 'Live request testing directly on canvas with custom payloads' },
      { id: 'realtime-telemetry', label: 'Live Telemetry & Logs', desc: 'Real-time WebSocket event streaming and latency tracing' },
    ],
  },
  {
    id: 'security-scalability',
    title: 'Security & Performance',
    items: [
      { id: 'security-firewall', label: 'Ultra Security & Anti-DDoS', desc: 'Sliding window rate limit, IP ban, and injection guards' },
      { id: 'email-verification', label: 'Email Verification & DNS', desc: '3-tier validation (RFC 5322, disposable filter, MX DNS)' },
      { id: 'high-concurrency', label: 'Scalability & DAG Cache', desc: 'In-memory execution in < 0.2ms with connection pool' },
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment & SDK',
    items: [
      { id: 'production-gateway', label: 'Production Gateway', desc: 'Edge routing, custom domains, and instant live deploys' },
      { id: 'export-typescript', label: 'Exporting TypeScript', desc: 'Standalone Fastify + Prisma + TypeScript code generation' },
      { id: 'cicd-github', label: 'CI/CD GitHub Sync', desc: 'Automated Git commit pushing via Octokit SDK' },
      { id: 'env-secrets', label: 'Environment Secrets', desc: 'AES-256 encrypted credential management' },
    ],
  },
];

/* ─── Neumorphic Helper Components ───────────────── */
function DocEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: 8,
      background: 'var(--neu-sunken)',
      border: '1px solid var(--neu-border)',
      boxShadow: 'var(--neu-pressed-sm)',
      fontSize: 11,
      fontWeight: 800,
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 16
    }}>
      {children}
    </div>
  );
}

function Code({ children, lang = '' }: { children: string; lang?: string }) {
  return (
    <div style={{
      background: 'var(--neu-sunken)',
      border: '1px solid var(--neu-border)',
      boxShadow: 'var(--neu-pressed-sm)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      {lang && (
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--neu-border)',
          fontSize: 10.5,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          background: 'rgba(255, 255, 255, 0.02)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {lang}
        </div>
      )}
      <pre style={{
        margin: 0,
        padding: '16px 20px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        color: '#e2e8f0',
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
    info:    { bg: 'var(--neu-surface)', border: 'var(--neu-border-bevel)', icon: 'ℹ', label: 'Note' },
    warning: { bg: 'var(--neu-surface)', border: 'rgba(251, 191, 36, 0.3)', icon: '⚠', label: 'Warning' },
    tip:     { bg: 'var(--neu-surface)', border: 'rgba(52, 211, 153, 0.3)', icon: '✦', label: 'Tip' },
  };
  const c = colors[type];
  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      boxShadow: 'var(--neu-flat-xs)',
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 24,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1, fontWeight: 800, color: '#ffffff' }}>{c.icon}</span>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        <strong style={{ color: '#ffffff' }}>{c.label}: </strong>{children}
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
      borderBottom: '1px solid var(--neu-border)',
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
      color: '#ffffff',
      margin: '28px 0 10px 0',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 15.5, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 18 }}>
      {children}
    </p>
  );
}

function PropTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div style={{
      overflowX: 'auto',
      marginBottom: 24,
      background: 'var(--neu-surface)',
      border: '1px solid var(--neu-border-bevel)',
      boxShadow: 'var(--neu-flat-xs)',
      borderRadius: 12
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--neu-border)', background: 'var(--neu-sunken)' }}>
            {['Property', 'Type', 'Description'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#ffffff', fontWeight: 800 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([prop, type, desc], i) => (
            <tr key={prop} style={{ borderBottom: '1px solid var(--neu-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#ffffff', fontWeight: 600, fontSize: 12.5 }}>{prop}</td>
              <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--neon-cyan)', fontSize: 12 }}>{type}</td>
              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Documentation Contents Database ────────────── */
const DOC_CONTENT: Record<string, React.ReactNode> = {
  introduction: (
    <>
      <DocEyebrow>Getting Started</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Introduction</h1>
      <P>JBSnap is an industrial-grade visual API builder that transforms how engineering teams design, secure, and deploy backend microservices. Instead of handwriting repetitive routing boilerplate, configuring middleware chains, and wiring database models manually, you drag and drop tactile nodes onto a DAG canvas. JBSnap compiles the graph into clean, production-ready Fastify + Prisma + TypeScript codebases.</P>
      <P>Whether prototyping microservices in minutes or handling high-throughput production workloads, JBSnap provides zero vendor lock-in with standalone exportability.</P>
      <InfoBox type="tip">New to JBSnap? Jump straight to the Quickstart Guide to deploy your first live endpoint in under 5 minutes.</InfoBox>
      <H2>Core Architectural Pillars</H2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {[
          { icon: '🌐', title: 'Tactile Visual Canvas', desc: '14+ specialized node types: HTTP triggers, webhooks, auth guards, Prisma queries, JS isolates, and LLM reasoning.' },
          { icon: '⚡', title: 'Hardened V8 Sandbox', desc: 'Custom JavaScript logic executes inside isolated VMs with a strict 200ms CPU timeout and zero filesystem access.' },
          { icon: '🚀', title: 'Instant Gateway Publish', desc: 'Single-click live gateway deployment. In-memory DAG routing serves requests in < 0.2ms.' },
          { icon: '📦', title: 'Standalone TypeScript Export', desc: 'Download standard Fastify + Prisma source code. Push to GitHub with one click and self-host on any cloud.' },
        ].map(c => (
          <div key={c.title} style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border-bevel)', boxShadow: 'var(--neu-flat-xs)', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 20, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.desc}</div>
          </div>
        ))}
      </div>
      <H2>How JBSnap Fits Your Stack</H2>
      <P>JBSnap acts as an intelligent API routing & execution mesh sitting between client frontends (React, Next.js, mobile apps) and your persistent datastores.</P>
      <Code lang="Architecture Flow">{`Client (Web, Mobile, SDK)
        │
        ▼
JBSnap Edge Gateway   <─── Rate Limiter, DDoS Shield, CORS, JWT Guard
        │
        ▼
In-Memory DAG Runner  <─── RAM Cache (< 0.2ms latency)
   ├── Secure JS VM   <─── Isolated V8 context
   ├── Neon / PG DB   <─── Pooled Prisma ORM
   └── External APIs  <─── HTTP fetcher & webhooks
        │
        ▼
HTTP JSON Response    ───> Client`}</Code>
    </>
  ),

  quickstart: (
    <>
      <DocEyebrow>Getting Started</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Quickstart Guide</h1>
      <P>Build and deploy your first live API endpoint in under 5 minutes without writing boilerplate setup code.</P>
      <H2>Step 1 - Create a Project</H2>
      <P>Navigate to your Dashboard and click <strong>Create Project</strong>. Enter a project name like <code>User Service</code> and set a route slug.</P>
      <H2>Step 2 - Launch Visual Builder</H2>
      <P>Click your newly created project card to enter the DAG builder. You will be greeted by the dark obsidian canvas equipped with the left node palette and top action toolbar.</P>
      <H2>Step 3 - Add an HTTP Trigger</H2>
      <P>Click <strong>HTTP Trigger</strong> from the sidebar. Set the method to <code>GET</code> and path to <code>/hello</code>.</P>
      <H2>Step 4 - Add Custom Logic</H2>
      <P>Click <strong>JavaScript</strong> node from the palette. Connect the right output handle of the HTTP Trigger to the left input handle of the JavaScript node.</P>
      <Code lang="JavaScript">{`// Custom JS Logic Node
context.response = {
  status: 200,
  body: {
    message: "Welcome to JBSnap Visual APIs!",
    timestamp: new Date().toISOString(),
    ip: context.request.ip
  }
};`}</Code>
      <H2>Step 5 - Publish & Test</H2>
      <P>Click <strong>Publish Gateway</strong> in the top toolbar. Your endpoint is live instantly at your unique gateway route:</P>
      <Code lang="Shell">{`$ curl -X GET https://api.jbsnap.app/u/user-service/hello
{
  "message": "Welcome to JBSnap Visual APIs!",
  "timestamp": "2026-09-22T16:45:00.000Z",
  "ip": "127.0.0.1"
}`}</Code>
      <InfoBox type="tip">You can also use the built-in <strong>Test API Sandbox</strong> button directly in the canvas toolbar to trigger requests without opening your terminal.</InfoBox>
    </>
  ),

  'visual-editor': (
    <>
      <DocEyebrow>Getting Started</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Visual Editor & Hotkeys</h1>
      <P>The Visual Editor is a React-Flow-powered DAG environment with tactile neumorphic nodes, interactive ports, and high-performance keyboard shortcuts.</P>
      <H2>Keyboard Shortcuts</H2>
      <PropTable rows={[
        ['Ctrl + S', 'Shortcut', 'Saves the current pipeline configuration and nodes layout'],
        ['Ctrl + Z', 'Shortcut', 'Undoes the previous node movement or connection action'],
        ['Ctrl + Shift + Z', 'Shortcut', 'Redoes the previously undone action'],
        ['Delete / Backspace', 'Shortcut', 'Deletes currently selected node or connection edge'],
        ['Ctrl + K', 'Global', 'Opens rapid documentation command palette search'],
        ['Mouse Wheel', 'Navigation', 'Zooms in and out of the canvas viewport'],
        ['Click + Drag (Canvas)', 'Navigation', 'Pans around the workflow workspace'],
      ]} />
      <H2>Canvas Node Palette Overview</H2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'HTTP Trigger', color: '#10b981', desc: 'API entry point defining route path and HTTP verb (GET, POST, PUT, DELETE, PATCH)' },
          { label: 'Webhook', color: '#f59e0b', desc: 'Secure incoming webhook listener with secret signature verification' },
          { label: 'Scheduled Cron', color: '#8b5cf6', desc: 'Recurring cron timer executing pipelines on automated intervals' },
          { label: 'Database', color: '#38bdf8', desc: 'Prisma PostgreSQL & Neon serverless queries with prepared statements' },
          { label: 'JavaScript', color: '#f59e0b', desc: 'Sandboxed V8 custom business logic with full context object access' },
          { label: 'If / Else', color: '#10b981', desc: 'Conditional logic branching pipelines based on runtime evaluations' },
          { label: 'Auth Guard', color: '#ec4899', desc: 'Token authorization verification protecting downstream nodes' },
          { label: 'AI Agent', color: '#a855f7', desc: 'Gemini LLM reasoning block executing prompt-driven decisions' },
        ].map(n => (
          <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--neu-surface)', border: '1px solid var(--neu-border-bevel)', boxShadow: 'var(--neu-flat-xs)', borderRadius: 12, padding: '12px 18px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: n.color, flexShrink: 0, boxShadow: `0 0 8px ${n.color}` }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', width: 150, flexShrink: 0 }}>{n.label}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{n.desc}</span>
          </div>
        ))}
      </div>
    </>
  ),

  architecture: (
    <>
      <DocEyebrow>Getting Started</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Architecture Overview</h1>
      <P>JBSnap is architected into four decoupled layers engineered for high concurrency and sub-millisecond execution.</P>
      <H2>1. Frontend Visual Pipeline Studio</H2>
      <P>Built on Next.js 16 (Turbopack) and React Flow, the editor renders interactive neumorphic nodes. Graph modifications are validated against DAG cycle detection algorithms before being serialized.</P>
      <H2>2. High-Speed Edge Gateway</H2>
      <P>A Fastify-based microservice mesh terminating TLS 1.3 connections. It runs anti-DDoS sliding-window rate limiters, verifies CORS policies, and validates security headers before dispatching to the execution engine.</P>
      <H2>3. In-Memory DAG Runner</H2>
      <P>Active workflows reside in an in-memory cache. Node graph traversals execute with zero database overhead during live calls, achieving median response latencies under <strong>0.2ms</strong>.</P>
      <H2>4. Fastify + Prisma Export Compiler</H2>
      <P>The AST compiler translates your visual graph into structured TypeScript files: <code>server.ts</code>, <code>routes/*.ts</code>, <code>prisma/schema.prisma</code>, and <code>package.json</code>.</P>
    </>
  ),

  'http-triggers': (
    <>
      <DocEyebrow>Nodes Reference</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>HTTP Triggers</h1>
      <P>Every workflow starts with an HTTP Trigger defining the network route and method.</P>
      <H2>Configuration Parameters</H2>
      <PropTable rows={[
        ['method', 'GET | POST | PUT | DELETE | PATCH', 'The HTTP verb that triggers this endpoint'],
        ['path', 'string', 'Route pattern, supports params e.g. /users/:id or /orders/:orderId/items'],
        ['authRequired', 'boolean', 'Enforces authentication checks before pipeline start'],
      ]} />
      <H2>Accessing Request Data</H2>
      <P>Downstream nodes access request data through the unified <code>context.request</code> object:</P>
      <Code lang="JavaScript">{`const userId = context.request.params.id;
const queryPage = context.request.query.page || 1;
const requestBody = context.request.body;
const authHeader = context.request.headers['authorization'];`}</Code>
    </>
  ),

  'webhooks-events': (
    <>
      <DocEyebrow>Nodes Reference</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Webhooks & Event Bus</h1>
      <P>Webhook nodes allow external third-party services (such as Stripe, GitHub, Shopify, or Slack) to trigger your visual API workflows securely.</P>
      <H2>HMAC Secret Verification</H2>
      <P>Webhooks feature cryptographic HMAC signature validation out of the box. Incoming requests with missing or invalid signatures are rejected with a <code>401 Unauthorized</code> response.</P>
      <PropTable rows={[
        ['secret', 'string / secret', 'Cryptographic secret key used to compute HMAC SHA-256 signature'],
        ['signatureHeader', 'string', 'Header containing the signature (e.g. stripe-signature, x-hub-signature-256)'],
        ['tolerance', 'number (seconds)', 'Timestamp tolerance window to protect against replay attacks'],
      ]} />
      <Code lang="Stripe Webhook Example">{`// Inside downstream Code Block node:
const event = context.webhook.event;
if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object;
  context.customerEmail = paymentIntent.receipt_email;
}`}</Code>
    </>
  ),

  'scheduled-cron': (
    <>
      <DocEyebrow>Nodes Reference</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Scheduled Cron Workflows</h1>
      <P>Schedule pipelines to run automatically on fixed recurrence intervals using standard cron expressions.</P>
      <H2>Cron Syntax</H2>
      <PropTable rows={[
        ['cron', 'string', 'Standard 5-segment cron syntax (e.g. */15 * * * * for every 15 min)'],
        ['timezone', 'string', 'IANA timezone descriptor (e.g. UTC, America/New_York, Asia/Kolkata)'],
        ['retryOnFail', 'boolean', 'Automatically retries pipeline on unhandled errors'],
      ]} />
      <Code lang="Cron Expressions">{`0 0 * * *       -- Executes daily at midnight UTC
*/10 * * * *     -- Executes every 10 minutes
0 9 * * 1-5      -- Executes Monday through Friday at 9:00 AM UTC`}</Code>
    </>
  ),

  'auth-guards': (
    <>
      <DocEyebrow>Nodes Reference</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Auth Guards & API Keys</h1>
      <P>Auth Guard nodes validate user authentication before allowing downstream data mutations or queries to run.</P>
      <H2>Supported Strategies</H2>
      <P>1. <strong>JWT Bearer Token:</strong> Validates signatures using RS256 public keys or HS256 shared secrets.</P>
      <P>2. <strong>API Key:</strong> Validates custom keys passed via <code>x-api-key</code> headers or query parameters.</P>
      <H2>Downstream Context Injection</H2>
      <P>Upon successful validation, token claims are automatically populated into <code>context.auth</code>:</P>
      <Code lang="JavaScript">{`// Access authenticated user claims
const userId = context.auth.sub || context.auth.id;
const userRole = context.auth.role;
const userEmail = context.auth.email;`}</Code>
    </>
  ),

  database: (
    <>
      <DocEyebrow>Nodes Reference</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>PostgreSQL & Neon DB</h1>
      <P>The Database node connects to serverless PostgreSQL (such as Neon, Supabase, AWS RDS) using pooled Prisma ORM connections.</P>
      <H2>Supported Operations</H2>
      <PropTable rows={[
        ['findMany', 'SELECT', 'Returns multiple records matching filter conditions with pagination'],
        ['findUnique', 'SELECT ONE', 'Fetches single record by unique primary key or index'],
        ['create', 'INSERT', 'Creates a new table record with sanitized attributes'],
        ['update', 'UPDATE', 'Updates records matching primary key criteria'],
        ['delete', 'DELETE', 'Removes record and returns deleted representation'],
        ['rawQuery', 'RAW SQL', 'Executes parameterized SQL queries with $1, $2 placeholders'],
      ]} />
      <Code lang="Parameterized Query Example">{`// In Database Node Config:
Operation: findMany
Model: User
Where: {
  status: "active",
  organizationId: context.auth.orgId
}
OrderBy: { createdAt: "desc" }
Take: 20`}</Code>
    </>
  ),

  'secure-sandbox': (
    <>
      <DocEyebrow>Nodes Reference</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Secure JS Sandbox</h1>
      <P>Execute custom JavaScript in an isolated V8 micro-sandbox. The sandbox has zero access to the host file system, child processes, or process environment.</P>
      <InfoBox type="warning">Execution has a strict 200ms CPU timeout. Infinite loops or recursive operations exceeding 200ms are terminated immediately with a 504 Gateway Timeout.</InfoBox>
      <H2>Context Object API</H2>
      <Code lang="JavaScript">{`// Transform data and write to context
const items = context.dbResult || [];
context.calculatedTotal = items.reduce((sum, item) => sum + item.price, 0);

// Set final HTTP response
context.response = {
  status: 200,
  headers: { 'Cache-Control': 'max-age=60' },
  body: { total: context.calculatedTotal, count: items.length }
};`}</Code>
    </>
  ),

  conditionals: (
    <>
      <DocEyebrow>Nodes Reference</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Conditionals & Loops</h1>
      <P>Branch pipeline execution based on dynamic runtime expressions or iterate over arrays.</P>
      <H2>If / Else Conditional Branching</H2>
      <P>A conditional node evaluates a boolean expression and outputs to two distinct ports: <code>True</code> and <code>False</code>.</P>
      <Code lang="JavaScript">{`// Expression examples:
context.auth.role === 'admin'
context.dbResult.length > 0
context.request.body.amount >= 1000`}</Code>
      <H2>Loop / Iterator Node</H2>
      <P>Iterates over an array of items, executing child pipelines sequentially or in parallel batches.</P>
    </>
  ),

  'external-apis': (
    <>
      <DocEyebrow>Nodes Reference</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>External APIs & HTTP Requests</h1>
      <P>Dispatch outgoing HTTP requests to external third-party REST services (SendGrid, Twilio, OpenAI, GitHub, Stripe) and capture responses.</P>
      <H2>Configuration</H2>
      <PropTable rows={[
        ['url', 'string', 'Target URL e.g. https://api.openai.com/v1/chat/completions'],
        ['method', 'GET | POST | PUT | DELETE', 'HTTP method for outgoing request'],
        ['headers', 'JSON / key-value', 'Custom headers including authorization tokens'],
        ['timeout', 'number (ms)', 'Outgoing request timeout before throwing error (default: 5000ms)'],
      ]} />
      <InfoBox type="tip">Secrets should be referenced dynamically using <code>{"${context.secrets.API_KEY}"}</code> syntax rather than hardcoding credentials.</InfoBox>
    </>
  ),

  'ai-agent': (
    <>
      <DocEyebrow>Nodes Reference</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI Agent & LLM Logic</h1>
      <P>Integrate Google Gemini LLM reasoning directly into your API workflows. Use natural language prompts to categorize data, extract entities, synthesize text, or make intelligent routing decisions.</P>
      <H2>Capabilities</H2>
      <PropTable rows={[
        ['prompt', 'string', 'System instruction or user prompt with context interpolation'],
        ['model', 'string', 'Gemini model target (default: gemini-2.5-flash)'],
        ['outputFormat', 'json | text', 'Enforces strict JSON schema validation on the AI response'],
      ]} />
      <Code lang="AI Node Config">{`Prompt: "Analyze the user feedback: \${context.request.body.comment}.
Classify sentiment as POSITIVE, NEUTRAL, or NEGATIVE.
Extract any mentioned product features into an array."

Output Format: JSON`}</Code>
    </>
  ),

  'email-nodes': (
    <>
      <DocEyebrow>Nodes Reference</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Email Automation</h1>
      <P>Send transactional emails with automatic real-time DNS MX record verification to protect sender domain reputation.</P>
      <H2>Email Node Attributes</H2>
      <PropTable rows={[
        ['to', 'string', 'Recipient email address. Evaluated with 3-tier syntax and DNS MX checks'],
        ['subject', 'string', 'Email subject line, supports template tags like \${context.user.name}'],
        ['template', 'HTML / Markdown', 'Email body template rendered before transmission'],
      ]} />
    </>
  ),

  'ai-workflow-synthesizer': (
    <>
      <DocEyebrow>Developer Tools</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI Pipeline Synthesizer</h1>
      <P>Generate full API pipelines from natural language prompts using the built-in Gemini Workflow Synthesizer.</P>
      <H2>How It Works</H2>
      <P>1. In the builder toolbar, click <strong>AI Synthesize</strong>.</P>
      <P>2. Describe your desired endpoint: e.g. <em>"Create an order checkout endpoint that validates JWT, verifies stock in PostgreSQL, charges Stripe via HTTP, and returns 201 Created with order receipt."</em></P>
      <P>3. The synthesizer automatically selects appropriate nodes, connects edges, configures database queries, and formats response payloads.</P>
      <InfoBox type="tip">You can modify or extend synthesized nodes manually at any time on the canvas.</InfoBox>
    </>
  ),

  'api-sandbox': (
    <>
      <DocEyebrow>Developer Tools</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Canvas Sandbox Test Runner</h1>
      <P>Test your active visual workflows live directly inside the browser canvas without leaving JBSnap.</P>
      <H2>Sandbox Features</H2>
      <P>• <strong>Custom Headers & Bearer Tokens:</strong> Simulate authentication headers and API keys.</P>
      <P>• <strong>JSON Request Body Editor:</strong> Formatted editor with syntax highlighting.</P>
      <P>• <strong>Step-by-Step Node Inspector:</strong> Watch execution flow through connected nodes with millisecond latency breakdowns.</P>
      <P>• <strong>Status & Response Viewer:</strong> View HTTP status codes, headers, and parsed response payloads.</P>
    </>
  ),

  'realtime-telemetry': (
    <>
      <DocEyebrow>Developer Tools</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Live Telemetry & Logs</h1>
      <P>Real-time execution telemetry streams directly into the canvas bottom HUD strip over WebSockets.</P>
      <H2>Observed Telemetry Metrics</H2>
      <PropTable rows={[
        ['Status Code', '2xx, 4xx, 5xx', 'Visual color-coded badges indicating execution health'],
        ['Latency', 'milliseconds', 'End-to-end request duration from gateway receipt to response flush'],
        ['Memory Allocation', 'Megabytes', 'V8 isolate memory footprint during script execution'],
        ['Trace Logs', 'stdout / stderr', 'Console logs printed by custom JavaScript nodes'],
      ]} />
    </>
  ),

  'security-firewall': (
    <>
      <DocEyebrow>Security & Performance</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ultra Security & Anti-DDoS</h1>
      <P>JBSnap features an enterprise security shield protecting deployed APIs from DoS/DDoS, SQLi, XSS, and brute-force socket attacks.</P>
      <H2>Protection Layers</H2>
      <PropTable rows={[
        ['Global Rate Limit', '120 reqs/min per IP', 'Sliding window rate limit applied across all API endpoints'],
        ['Auth Rate Limit', '10 reqs/min per IP', 'Strict limit on login/registration endpoints to stop credential stuffing'],
        ['Anti-DDoS IP Ban', '15 min ban', 'Triggered automatically when an IP accumulates > 30 violations in 5 minutes'],
        ['Max Payload Cap', '2MB', 'Rejects oversized request buffers preventing memory overflow attacks'],
        ['OWASP Headers', 'Helmet Integration', 'Automatic HSTS, CSP, X-Frame-Options (DENY), and nosniff protection'],
      ]} />
    </>
  ),

  'email-verification': (
    <>
      <DocEyebrow>Security & Performance</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Email Verification & Support Contact</h1>
      <P>All email fields across registration, contact forms, and transactional nodes undergo 3-tier validation:</P>
      <P>1. <strong>RFC 5322 Syntax Validation:</strong> Guarantees structural format compliance.</P>
      <P>2. <strong>Disposable Provider Blacklist:</strong> Filters temporary throwaway inboxes (tempmail, mailinator, etc.).</P>
      <P>3. <strong>Live DNS MX Lookup:</strong> Queries Mail Exchange records in real-time. Non-existent email domains are rejected instantly.</P>
      <H2>Official Contact</H2>
      <P>Official engineering support: <strong style={{ color: '#ffffff' }}>dualithjbsnap@gmail.com</strong>.</P>
    </>
  ),

  'high-concurrency': (
    <>
      <DocEyebrow>Security & Performance</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Scalability & In-Memory DAG Cache</h1>
      <P>JBSnap is engineered to sustain hundreds of thousands of concurrent requests without service degradation.</P>
      <H2>RAM-Cached DAG Graph</H2>
      <P>Published API graphs are cached in memory. Incoming requests execute entirely in RAM with no database queries required to load routing structures, enabling median execution in <strong>&lt; 0.2ms</strong>.</P>
      <H2>PostgreSQL Connection Pooling</H2>
      <P>Intelligent connection pooling with idle recycling and strict query timeouts prevents database socket exhaustion during traffic surges.</P>
    </>
  ),

  'production-gateway': (
    <>
      <DocEyebrow>Deployment & SDK</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Production Gateway</h1>
      <P>Every project receives a dedicated high-performance gateway URL served over TLS 1.3 edge certificates.</P>
      <Code lang="URL Patterns">{`https://api.jbsnap.app/u/{project-slug}/{workflow-path}

# Examples:
https://api.jbsnap.app/u/ecommerce/checkout
https://api.jbsnap.app/u/saas-app/auth/login`}</Code>
      <H2>Instant Zero-Downtime Updates</H2>
      <P>Publishing a workflow updates the in-memory route registry atomically. Existing in-flight requests complete cleanly while new requests route to the updated pipeline with zero downtime.</P>
    </>
  ),

  'export-typescript': (
    <>
      <DocEyebrow>Deployment & SDK</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Exporting TypeScript</h1>
      <P>JBSnap provides 100% vendor independence. Export any visual workflow as clean, type-safe Fastify + Prisma + TypeScript code.</P>
      <H2>Generated Project Structure</H2>
      <Code lang="Directory Layout">{`my-exported-api/
├── src/
│   ├── routes/
│   │   ├── users.ts       # Generated Fastify route handlers
│   │   └── checkout.ts
│   ├── middleware/
│   │   └── auth.ts        # Hardened JWT verification middleware
│   └── server.ts          # Fastify server entry point
├── prisma/
│   └── schema.prisma      # Prisma schema definitions
├── package.json
└── tsconfig.json`}</Code>
      <H2>Running Exported Code</H2>
      <Code lang="Shell">{`$ npm install
$ npx prisma generate
$ npm run dev`}</Code>
    </>
  ),

  'cicd-github': (
    <>
      <DocEyebrow>Deployment & SDK</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CI/CD GitHub Sync</h1>
      <P>Connect your GitHub account to automatically push exported TypeScript projects directly to any GitHub repository.</P>
      <H2>Setup Steps</H2>
      <P>1. In the project Export tab, click <strong>Connect GitHub</strong>.</P>
      <P>2. Select your repository and designated branch (e.g. <code>main</code> or <code>staging</code>).</P>
      <P>3. JBSnap commits the generated Fastify code with clean semantic commit messages, triggering your existing CI/CD pipelines (GitHub Actions, Railway, Docker Hub, Render) automatically.</P>
    </>
  ),

  'env-secrets': (
    <>
      <DocEyebrow>Deployment & SDK</DocEyebrow>
      <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.2px', margin: '8px 0 20px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Environment Secrets</h1>
      <P>Securely manage sensitive credentials (database strings, Stripe keys, OpenAI tokens) with AES-256-GCM encryption at rest.</P>
      <H2>Accessing Secrets in Workflows</H2>
      <P>Secrets are exposed inside sandboxed JavaScript nodes and external API nodes via <code>context.secrets</code>:</P>
      <Code lang="JavaScript">{`const stripeKey = context.secrets.STRIPE_SECRET_KEY;
const dbSecret = context.secrets.DATABASE_URL;`}</Code>
      <InfoBox type="warning">Secrets are never serialized into client browser bundles or telemetry log traces.</InfoBox>
    </>
  ),
};

/* ─── Main Docs Page Component ───────────────────── */
export default function DocsPage() {
  const [activeId, setActiveId] = useState('introduction');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const content = DOC_CONTENT[activeId] || DOC_CONTENT['introduction'];
  const allItems = SECTIONS.flatMap(s => s.items);
  const currentIdx = allItems.findIndex(i => i.id === activeId);
  const prevItem = currentIdx > 0 ? allItems[currentIdx - 1] : null;
  const nextItem = currentIdx < allItems.length - 1 ? allItems[currentIdx + 1] : null;

  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Filtered search results
  const filteredItems = allItems.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return item.label.toLowerCase().includes(q) || (item.desc && item.desc.toLowerCase().includes(q)) || item.id.includes(q);
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--neu-base)', color: 'var(--text-primary)', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .sidebar-link:hover { color: #ffffff !important; background: var(--neu-hover) !important; }
        .nav-btn:hover { transform: translateY(-1px); box-shadow: var(--neu-flat) !important; }
        .search-result-item:hover { background: var(--neu-hover) !important; color: #ffffff !important; }
      `}</style>

      {/* Neumorphic Sticky Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--neu-border)',
        background: 'var(--neu-surface)',
        boxShadow: 'var(--neu-flat-xs)'
      }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--neu-sunken)',
              border: '1px solid var(--neu-border)',
              boxShadow: 'var(--neu-pressed-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img src="/logo.jpg" alt="JBSnap" width={22} height={22} style={{ objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              JB<span style={{ color: '#a1a1aa' }}>Snap</span>
            </span>
            <span style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--text-muted)',
              background: 'var(--neu-sunken)',
              border: '1px solid var(--neu-border)',
              boxShadow: 'var(--neu-pressed-sm)',
              padding: '2px 8px',
              borderRadius: 6,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              marginLeft: 4
            }}>Docs</span>
          </Link>

          {/* Interactive Search Bar Trigger */}
          <div
            onClick={() => setSearchOpen(true)}
            style={{
              flex: 1,
              maxWidth: 380,
              marginLeft: 16,
              background: 'var(--neu-sunken)',
              border: '1px solid var(--neu-border)',
              boxShadow: 'var(--neu-pressed-sm)',
              borderRadius: 10,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              gap: 10,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Search size={15} color="var(--text-muted)" />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Search documentation...</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: 10,
              color: 'var(--text-faint)',
              background: 'var(--neu-surface)',
              border: '1px solid var(--neu-border)',
              padding: '2px 6px',
              borderRadius: 4,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700
            }}>CTRL K</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              href="/"
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                padding: '7px 16px',
                borderRadius: 9,
                background: 'var(--neu-grad-convex)',
                border: '1px solid var(--neu-border-bevel)',
                boxShadow: 'var(--neu-flat-xs)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = 'var(--neu-flat-sm)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.boxShadow = 'var(--neu-flat-xs)';
              }}
            >
              Back to Home
            </Link>
            <Link
              href="/register"
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: '#000000',
                background: '#ffffff',
                textDecoration: 'none',
                padding: '7px 18px',
                borderRadius: 9,
                boxShadow: 'var(--neu-flat-xs)',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = 'var(--neu-flat-sm)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'var(--neu-flat-xs)';
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Documentation Grid Layout */}
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 60px)' }}>
        {/* Neumorphic Sidebar */}
        <aside style={{
          borderRight: '1px solid var(--neu-border)',
          padding: '32px 0',
          position: 'sticky',
          top: 60,
          height: 'calc(100vh - 60px)',
          overflowY: 'auto'
        }}>
          {SECTIONS.map(sec => (
            <div key={sec.id} style={{ marginBottom: 28, padding: '0 20px' }}>
              <div style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: 'var(--text-faint)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                marginBottom: 10
              }}>{sec.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sec.items.map(item => {
                  const isActive = activeId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        className="sidebar-link"
                        onClick={() => { setActiveId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        style={{
                          all: 'unset',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#ffffff' : 'var(--text-muted)',
                          background: isActive ? 'var(--neu-sunken)' : 'transparent',
                          border: isActive ? '1px solid var(--neu-border)' : '1px solid transparent',
                          boxShadow: isActive ? 'var(--neu-pressed-sm)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxSizing: 'border-box' as const
                        }}>
                        <span>{item.label}</span>
                        {item.badge && (
                          <span style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: item.badge === 'AI' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: item.badge === 'AI' ? '#c084fc' : '#34d399',
                            border: '1px solid ' + (item.badge === 'AI' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(16, 185, 129, 0.4)')
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Documentation Content Area */}
        <main style={{ padding: '48px 64px 96px 64px', maxWidth: 880 }}>
          {content}

          {/* Previous / Next Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            marginTop: 72,
            paddingTop: 32,
            borderTop: '1px solid var(--neu-border)'
          }}>
            {prevItem ? (
              <button
                className="nav-btn"
                onClick={() => { setActiveId(prevItem.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '16px 22px',
                  borderRadius: 14,
                  border: '1px solid var(--neu-border-bevel)',
                  background: 'var(--neu-surface)',
                  boxShadow: 'var(--neu-flat-sm)',
                  transition: 'all 0.18s ease'
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Previous</span>
                <span style={{ fontSize: 14.5, color: '#ffffff', fontWeight: 700 }}>{prevItem.label}</span>
              </button>
            ) : <div />}
            {nextItem ? (
              <button
                className="nav-btn"
                onClick={() => { setActiveId(nextItem.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '16px 22px',
                  borderRadius: 14,
                  border: '1px solid var(--neu-border-bevel)',
                  background: 'var(--neu-surface)',
                  boxShadow: 'var(--neu-flat-sm)',
                  textAlign: 'right' as const,
                  transition: 'all 0.18s ease'
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next</span>
                <span style={{ fontSize: 14.5, color: '#ffffff', fontWeight: 700 }}>{nextItem.label}</span>
              </button>
            ) : <div />}
          </div>
        </main>
      </div>

      {/* Interactive Search Modal (Ctrl+K) */}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '15vh'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 580,
              background: 'var(--neu-surface)',
              border: '1px solid var(--neu-border-bevel)',
              boxShadow: 'var(--neu-flat-lg)',
              borderRadius: 16,
              overflow: 'hidden'
            }}
          >
            {/* Modal Search Input Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              borderBottom: '1px solid var(--neu-border)'
            }}>
              <Search size={18} color="#ffffff" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search documentation, node types, security, export..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: 15,
                  fontFamily: 'inherit'
                }}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                style={{
                  background: 'var(--neu-sunken)',
                  border: '1px solid var(--neu-border)',
                  boxShadow: 'var(--neu-pressed-sm)',
                  borderRadius: 6,
                  padding: '4px 6px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 11
                }}
              >
                ESC
              </button>
            </div>

            {/* Search Results List */}
            <div style={{ maxHeight: 380, overflowY: 'auto', padding: 8 }}>
              {filteredItems.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No matching documentation topics found for &quot;{searchQuery}&quot;.
                </div>
              ) : (
                filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="search-result-item"
                    onClick={() => {
                      setActiveId(item.id);
                      setSearchOpen(false);
                      setSearchQuery('');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>{item.label}</span>
                      {item.badge && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: item.badge === 'AI' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: item.badge === 'AI' ? '#c084fc' : '#34d399',
                          border: '1px solid ' + (item.badge === 'AI' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(16, 185, 129, 0.4)')
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.desc && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
