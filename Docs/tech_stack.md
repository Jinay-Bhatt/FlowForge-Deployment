# JBSnap - Complete Technical Stack Architecture

The **JBSnap** platform is engineered as a high-performance, real-time visual API builder, DAG workflow compiler, and secure execution gateway.

---

## 🎨 1. Frontend Layer (User Interface & Visual Canvas)

| Technology | Version / Tool | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15+** (App Router, React 19) | Server-side rendering, routing, dynamic sitemaps, and Core Web Vitals optimization |
| **Language** | **TypeScript 5+** | Full strict type-safety across components and API contracts |
| **Styling** | **Vanilla CSS + Design Tokens** | High-performance CSS design system, dark mode, glassmorphism, responsive grid layouts |
| **Iconography** | **Lucide React** (`lucide-react`) | Lightweight vector UI icons |
| **Real-Time Client** | **Socket.IO Client** (`socket.io-client`) | Sub-millisecond WebSocket connection for live execution metrics & logs |
| **OAuth Authentication** | **Google Identity Services (GSI)** | Single Click Google OAuth 2.0 Sign-In |
| **SEO & Performance** | **Schema.org JSON-LD & Next Metadata** | Structured data (`SoftwareApplication`, `WebSite`, `Organization`), dynamic `sitemap.xml`, and `robots.txt` |

---

## ⚡ 2. Backend Engine & Gateway (Fastify Server)

| Technology | Version / Tool | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Fastify v5.8.5** | Low-overhead, high-performance Node.js web server handling gateway requests |
| **Runtime Engine** | **Node.js v20+** (ES Modules) | Asynchronous non-blocking event loop execution |
| **Language** | **TypeScript v6.0+** (`tsx` runner) | Strongly-typed backend API development |
| **Security Suite** | **`@fastify/helmet`** | OWASP HTTP Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, COOP) |
| **Anti-DDoS & Rate Limit** | **`@fastify/rate-limit`** | Global rate limiting (120 reqs/min) & automatic IP-banning DDoS firewall |
| **Input Protection** | **Custom Injection Guards** | Recursive request body & query sanitization blocking SQLi, XSS, and Path Traversal |
| **Payload Compression** | **`@fastify/compress`** | Response compression using Gzip and Brotli (shrinks payload size by ~80%) |
| **CORS Shield** | **`@fastify/cors`** | Strict domain origin whitelist verification |

---

## 🗄️ 3. Database & Caching Layer

| Technology | Version / Tool | Purpose |
| :--- | :--- | :--- |
| **Database Engine** | **PostgreSQL** (Neon Serverless Cloud) | Managed relational database for users, projects, workflows, and execution logs |
| **ORM & Driver Adapter** | **Prisma ORM** (`@prisma/client` v7.8.0) | Type-safe database queries and parameterized SQL execution |
| **Connection Pool** | **Tuned `pg` Pool** | High-throughput socket pooling (max 30 sockets, 15s idle recycling, 10s statement timeouts) |
| **In-Memory DAG Cache** | **Custom LRU & TTL RAM Cache** | Serves published visual workflows 100% in-memory from RAM in `< 0.2ms` without database load |

---

## 🔄 4. Asynchronous Queue & Real-Time Analytics

| Technology | Version / Tool | Purpose |
| :--- | :--- | :--- |
| **Queue Manager** | **BullMQ** (`bullmq` v5.78.0) | Background job queue for codebase compilation and ZIP exports |
| **In-Memory Store** | **Redis** (`redis://127.0.0.1:6379`) | Fast key-value datastore backing BullMQ job queues |
| **Worker Process** | **Compilation Worker** (`startWorker`) | Isolated background worker executing CPU-heavy workflow compilation tasks |
| **Real-Time Stream** | **Socket.IO** (`socket.io` v4.8.3) | Emits real-time node execution metrics, status codes, and latency heatmaps |
| **Scheduler** | **Node-Cron Engine** (`initScheduler`) | Automated background cron job runner for scheduled workflow triggers |

---

## 🛡️ 5. Authentication, Security & Cryptography

| Technology | Version / Tool | Purpose |
| :--- | :--- | :--- |
| **Session Security** | **`@fastify/jwt`** | Signed JSON Web Tokens for user session management |
| **Password Hashing** | **`bcryptjs` v3.0.3** | Secure password hashing with salt rounds |
| **Secrets Encryption** | **AES-256-GCM** (Node `crypto`) | Symmetric encryption for sensitive API keys and database connection strings |

---

## 🔒 6. Isolated VM Sandbox & Compiler Architecture

| Technology | Version / Tool | Purpose |
| :--- | :--- | :--- |
| **VM Sandbox** | **Node.js `node:vm` Context** | Sandboxed V8 JavaScript execution for custom code nodes |
| **Sandbox Immunization** | **AST & Global Constructor Locks** | Purges `Function`, `eval`, `process`, and `globalThis` inside VM contexts; blocks dangerous `require()` calls |
| **DAG Topological Sort** | **Kahn's Algorithm** (`orderNodes`) | Arranges visual workflow nodes sequentially and detects routing loops |
| **SQL Parameterization** | **`parameterizeSqlQuery`** | Converts `$variable` context paths into safe `$1`, `$2` PostgreSQL prepared statement parameters |

---

## 🤖 7. Multi-Provider AI Engine

| Provider | Supported Models | Purpose |
| :--- | :--- | :--- |
| **Groq API** | `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` | Instant plain-English to visual workflow DAG generation |
| **OpenAI API** | `gpt-4o-mini` | High-accuracy workflow generation |
| **Google Gemini API** | `gemini-1.5-flash` | Multimodal & large-context workflow generation |
| **Anthropic Claude API** | `claude-3-5-sonnet` | Complex logic graph generation |
| **Ollama Local** | `llama3` | 100% offline, free local AI generation fallback |

---

## 📦 8. Code Compilation & Git Integration

| Technology | Version / Tool | Purpose |
| :--- | :--- | :--- |
| **TypeScript Compiler** | **`compileProject` Engine** | Transpiles visual node graphs into standalone Fastify + Prisma + TypeScript codebases |
| **ZIP Archiver** | **`archiver` v8.0.0** | Bundles exported codebase into compressed downloadable `.zip` packages |
| **GitHub Integration** | **Octokit REST** (`@octokit/rest` v22.0.1) | Direct 1-click GitHub repository creation and code pushing |
