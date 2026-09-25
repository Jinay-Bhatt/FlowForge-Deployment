# JBSnap Backend Development TODO List

This file tracks the implementation progress of the JBSnap backend server.

---

## Progress Overview

- **Phase 1: Environment & Database Schema Setup** - `[x]` Completed
- **Phase 2: Authentication & Project/Workflow Management** - `[x]` Completed
- **Phase 3: Dynamic API Gateway & Sandbox execution** - `[x]` Completed
- **Phase 4: AST Compiler & Code Exporter (BullMQ/Redis)** - `[x]` Completed
- **Phase 5: WebSocket & Metrics Stream** - `[x]` Completed
- **Phase 6: Analytics & Logs Backend** - `[x]` Completed
- **Phase 7: Services & Gateway Config** - `[x]` Completed
- **Phase 8: AI Workflow Generator (Groq/Ollama)** - `[x]` Completed
- **Phase 9: Frontend — Auth Pages** - `[x]` Completed
- **Phase 10: Frontend — Dashboard** - `[x]` Completed
- **Phase 11: Frontend — Builder (React Flow + AI Modal)** - `[x]` Completed
- **Phase 12: Frontend — Monitor (Live Logs)** - `[x]` Completed
- **Phase 13: Frontend — Analytics (Recharts)** - `[x]` Completed
- **Phase 14: Frontend — Gateway Settings** - `[x]` Completed
- **Phase 15: Frontend — Service Mesh** - `[x]` Completed
- **Phase 16: Frontend — Settings (Git Config)** - `[x]` Completed

---

## Detailed Checklist

### ✅ Phase 1: Environment & Database Schema Setup
- [x] `.env` config file with DB URLs, Redis URL, JWT Secret, Encryption Key
- [x] Environment variable validation in `src/config/index.ts`
- [x] `prisma/schema.prisma` — all 9 models defined
- [x] **NEW** `Analytics`, `Service`, `ServiceRoute` models added
- [x] **NEW** `GatewayConfig` extended with `requireApiKey`, `apiKeyValue`, `corsEnabled`, `allowedOrigins`
- [x] `npx prisma db push` — DB synced to Neon PostgreSQL ✅
- [x] Prisma client helper in `src/services/db.ts`

### ✅ Phase 2: Auth & Project/Workflow Management
- [x] Register / Login controllers with bcrypt + JWT
- [x] JWT middleware in `src/middlewares/auth.ts`
- [x] Projects CRUD
- [x] Workflows CRUD + versioning + publish/unpublish

### ✅ Phase 3: Dynamic API Gateway
- [x] Wildcard `ALL /api/:projectId/*` route
- [x] In-memory rate limiting
- [x] JWT enforcement per gateway config
- [x] VM sandbox executor (`node:vm`)
- [x] DAG topological sort + sequential node executor
- [x] **NEW** Switch Case branching node execution
- [x] **NEW** Outgoing HTTP Client node execution (REST API Integration)
- [x] **NEW** Live Background Cron Scheduler Engine (matchCron worker)
- [x] **NEW** Dynamic Response Headers & HTTP Redirects configuration
- [x] Execution audit log → `ExecutionLog` table
- [x] Socket.IO metrics stream

### ✅ Phase 4: AST Compiler & Code Export
- [x] `src/services/compiler.ts` — workflow JSON → Fastify TypeScript code
- [x] BullMQ export queue + Redis worker
- [x] ZIP archiver
- [x] GitHub push via Octokit
- [x] OpenAPI (Swagger) Spec dynamic generation (`swagger.ts` / `@fastify/swagger`)

### ✅ Phase 5: WebSocket Metrics Stream
- [x] Socket.IO attached to Fastify in `src/websocket.ts`
- [x] Project-scoped rooms
- [x] Metrics broadcast on every gateway request

### ✅ Phase 6: Analytics & Logs Backend
- [x] `src/controllers/analytics.ts` — daily trend, hourly heatmap, top routes, summary stats
- [x] `src/routes/analytics.ts`
- [x] `GET /projects/:id/analytics?range=7d|30d|24h`
- [x] `GET /projects/:id/logs?limit=&page=&status=`

### ✅ Phase 7: Services & Gateway Config
- [x] `src/controllers/services.ts` — Service CRUD, ServiceRoute CRUD, GatewayConfig upsert
- [x] `src/routes/services.ts`
- [x] `GET/POST/PUT/DELETE /projects/:id/services`
- [x] `POST /projects/:id/services/:serviceId/routes`
- [x] `GET/PUT /workflows/:workflowId/gateway-config`

### ✅ Phase 8: AI Workflow Generator
- [x] `src/services/ai.ts` — Groq / local Ollama integrations
- [x] `src/routes/ai.ts`
- [x] `POST /api/ai/generate-workflow`
- [x] Returns structured nodes + edges + metadata JSON

### ✅ Phase 9–16: Frontend (Next.js App Router)
- [x] Global CSS design system (`globals.css`)
- [x] Root layout + redirect page (redirects unauthenticated users to `/landing` first)
- [x] Landing page (`/landing`) — scroll-triggered animated Pipeline Reactor
- [x] Login page (`/login`) — connected glass pipeline inputs, no cards
- [x] Register page (`/register`) — matching glass pipeline inputs, no cards
- [x] Dashboard page (`/dashboard`) — API Constellation Orbit Map, orbital satellites, HUD panel, no cards
- [x] Project layout with tab navigation (`/projects/[id]/layout.tsx`)
- [x] Builder page with React Flow, AI modal, node palette (`/projects/[id]/builder`)
- [x] Monitor page with live Socket.IO log stream, row flashing, live pulse, and animated counters (`/projects/[id]/monitor`)
- [x] Analytics page with Recharts and animated metrics loaders (`/projects/[id]/analytics`)
- [x] Gateway config page with spring physics switches (`/projects/[id]/gateway`)
- [x] Service mesh page with ReactFlow graph (`/projects/[id]/services`)
- [x] Settings page with Git config + profile (`/settings`)
- [x] All 12 custom node components in `customNodes.tsx` (including Switch Case & HTTP Client)
- [x] Complete API client in `services/api.ts`

### ✅ Phase 17: Layout Spacing, Logo Redesign & Branding
- [x] Adjusted hero and section top padding/margin to reduce spacing by 128px for a tight, professional scroll experience.
- [x] Standardized "JBSnap" logo rendering with silver gradient (`linear-gradient(135deg,#ffffff,#a1a1aa)`) across all layout headers and footer.
- [x] Generated a new visual double-'F' high-tech logo (`JBSnap.png`) representing connected visual nodes.
- [x] Cleaned up footer: removed non-functional mockup subdomains, removed duplicate API reference link, and centered the footer copyright text.

### ✅ Phase 18: Profile Settings & User Validation
- [x] Implemented `/auth/me` and `/auth/update` endpoints on the backend.
- [x] Made user profile fields fully editable on Settings page, syncing updates back to local state and localStorage context.
- [x] Secured email field on Settings (read-only / disabled).
- [x] Implemented current password verification using bcrypt before accepting new password changes.
- [x] Synchronized account creation date (fresh load from `/auth/me`) onto settings panel.

### ✅ Phase 19: Real-time Telemetry Dashboard
- [x] Integrated real-time Socket.IO logs aggregation directly into the dashboard console metrics stream.
- [x] Fluctuated CPU, memory, throughput, and cache hit meters dynamically.
- [x] Dynamically computed latency rolling average and active workers load on UI stats panels.

### ✅ Phase 20: Performance Optimizations & Security Hardening
- [x] Optimized topological node sorting algorithm (BFS Kahn's traversal) from O(N^2) to O(N) using pre-built Map lookups.
- [x] Optimized route parameter matching by pre-splitting URL paths outside the routing loop.
- [x] Hardened Node.js VM Sandbox by statically checking and blocking prototype escapes (restricted keywords: constructor, prototype, process, require, global, etc.).
- [x] Added brute-force rate-limiting middleware to protect login/signup endpoints.
- [x] Added global secure HTTP headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Content-Security-Policy).
- [x] Created `Docs/testing_guide.md` covering all project features and workflow tests.
- [x] Pre-checks Redis connectivity on startup via non-blocking TCP socket check (`src/queue/redisCheck.ts`), automatically falling back to Mock In-Memory Job Queue mode to run code compilations without error spam if Redis is offline.

### ✅ Phase 21: UI/UX Refining & Live Telemetry
- [x] Connected landing page's "Watch Demo" CTA button to scroll and auto-play visual simulation.
- [x] Balanced the Capabilities bento grid section with responsive CSS templates to avoid empty slots.
- [x] Integrated real-time Socket.IO global client listener on landing page to stream actual server connections and request latencies.
- [x] Replaced the default Vercel favicon with the JBSnap brand logo (configured as icon.png in the app router and fallback favicon.ico in the public folder), ensuring the original JBSnap logo displays properly next to the title on all page tabs.
- [x] Redesigned the authentication pages with high-tech glassmorphism, background glow mesh elements, interactive focus-triggered input highlighting, and Chrome autofill overrides to maintain sleek styling.
- [x] Removed the noisy "Gateway Stream" live log panel from the global workspace console dashboard to declutter the interface, leaving latency and request aggregates consolidated in the System Health metrics.
- [x] Fixed the dashboard stat counter bug where the AnimCounter component became stuck at 0. Refactored it to use requestAnimationFrame to respond dynamically when asynchronous data finishes loading.
- [x] Updated the listProjects database query in the backend controller to eagerly load project workflows, allowing the frontend to calculate and display the true count of active pipelines and live endpoints.

### ✅ Phase 22: Modal Button Size Consistency
- [x] Increased height to `38px` and rounded border-radius to `8px` on all Cancel and primary action buttons inside modal dialogs across: Services page (Register Service), Builder page (Deploy Workflow), and Builder AI Synthesize modal.
### ✅ Phase 23: Complete Testing Guide
- [x] Created [TESTING_GUIDE.md](file:///c:/Users/bhavy/OneDrive/Documents/Backend-Api/Docs/TESTING_GUIDE.md), a comprehensive end-to-end testing reference outlining all 20 verification scopes (auth guards, gateway nodes, websocket metrics, rate limiting, layout configurations, and security headers) complete with sample API curls and verification checklists.

### ✅ Phase 24: Codebase Export, Code Preview & Git Push
- [x] Added `GET /projects/:projectId/export/preview` endpoint to backend exporter routes — runs `compileProject()` in-memory and returns the full generated file tree as JSON.
- [x] Imported `compileProject` from `../services/compiler.js` into `backend/src/routes/exporter.ts`.
- [x] Added `getPreview(projectId)` to the frontend `api.exporter` service namespace in `frontend/src/services/api.ts`.
- [x] Added **Export** nav item (pink `#ec4899`, `Package` icon) to the project sidebar navigation in `frontend/src/app/projects/[id]/layout.tsx`.
- [x] Created `frontend/src/app/projects/[id]/export/page.tsx` — a full-featured code workspace featuring:
  - Left file-tree panel listing all generated source files (e.g., `package.json`, `tsconfig.json`, `prisma/schema.prisma`, `src/index.ts`, `src/swagger.ts`, `Dockerfile`).
  - Right code viewer with monospace font, line numbers, and a **Copy Code** button.
  - **Download ZIP Codebase** button — triggers compilation job, polls status, then downloads the ZIP archive.
  - **Push to GitHub** button — triggers compilation with `pushToGit: true`, shows live job status. Falls back to Settings redirect if no Git config is linked.
  - Polling loop monitors job status every 1.5 s and auto-triggers file download or shows success state on completion.
- [x] Fixed TypeScript error (`textStyle` → `textAlign`). Frontend and backend TypeScript checks pass clean.
- [x] Updated TESTING_GUIDE.md Section 14.4 (Export Tab) to reflect the new interactive Export page.

### ✅ Phase 25: Interactive API Testing Sandbox
- [x] Created `handleTestExecute` request dispatcher inside `builder/page.tsx` that maps parameters, query strings, headers, and request body before firing `fetch()` directly at the active workspace gateway.
- [x] Added `renderConsole` helper method to simplify template rendering and prevent nested conditional brackets syntax errors.
- [x] Added **⚡ TEST API** action trigger button (cyan border/glow, Play icon) to the main builder canvas header toolbar.
- [x] Created a high-end glassmorphic modal layout **⚡ API Sandbox Test Runner**:
  - Displays relative sandbox route path (`/api/:projectId/:workflowPath`) dynamically resolved.
  - Warns the developer with a yellow banner if the active route is not initialized/published.
  - Features dedicated text inputs for custom Query Params, Header JSON, and Body JSON properties.
  - Features real-time Response Console displaying returning Status Code (green/red badge), Latency speed (amber badge), and fully formatted response body plaintext/JSON array stream.
- [x] Confirmed TypeScript builds (`npx tsc --noEmit`) complete with zero errors.
- [x] Documented Test Sandbox procedures inside Section 21 of TESTING_GUIDE.md.

---

## Remaining Tasks
- [x] Add seed demo data for presentation (Seeded to Neon successfully via `prisma/seed.ts`)
- [ ] Configure GROQ_API_KEY or install local Ollama
- [ ] Deploy: Vercel (frontend) + Railway/Render (backend) + Neon (DB)
