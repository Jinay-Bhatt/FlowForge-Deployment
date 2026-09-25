# 🧪 JBSnap — Complete Testing Guide

> **Scope**: End-to-end manual test coverage for every feature, page, API endpoint, WebSocket stream, and edge case in the JBSnap platform.
>
> **Stack**: Next.js 14 Frontend (port 3000) · Fastify Backend (port 5000) · Neon PostgreSQL · BullMQ/Mock Queue · Socket.IO
>
> **Last Updated**: 2026-07-11

---

## 📋 Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Health & Public Endpoints](#2-health--public-endpoints)
3. [Authentication](#3-authentication)
4. [Landing Page](#4-landing-page)
5. [Dashboard](#5-dashboard)
6. [Project Management](#6-project-management)
7. [Workflow Builder](#7-workflow-builder)
8. [Services Registry](#8-services-registry)
9. [Gateway Configuration](#9-gateway-configuration)
10. [Live Monitor](#10-live-monitor)
11. [Analytics Page](#11-analytics-page)
12. [API Gateway Execution (Core Engine)](#12-api-gateway-execution-core-engine)
13. [Export & Compilation](#13-export--compilation)
14. [Settings Page](#14-settings-page)
15. [WebSocket Real-Time Stream](#15-websocket-real-time-stream)
16. [AI Workflow Generation](#16-ai-workflow-generation)
17. [Security & Edge Cases](#17-security--edge-cases)
18. [Rate Limiting](#18-rate-limiting)
19. [Docs Page](#19-docs-page)
20. [Other Static Pages](#20-other-static-pages)

---

## 1. Environment Setup

### 1.1 Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | ≥ 18 | `node -v` |
| npm | ≥ 9 | `npm -v` |
| Redis (optional) | any | `redis-cli ping` → `PONG` |

### 1.2 Environment Variables

Confirm `.env` at root and `backend/.env` contain:

```env
PORT=5000
DATABASE_URL=<neon-postgres-url>
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=<any-32-char-string>
ENCRYPTION_KEY=<64-char-hex>
AI_PROVIDER=auto
GROQ_API_KEY=<your-groq-key>
FRONTEND_URL=http://localhost:3000
```

### 1.3 Starting the Stack

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# Expected: "🚀 JBSnap API server ready at http://localhost:5000"
# Look for: "✅ Database connection established successfully"

# Terminal 2 — Frontend
cd frontend && npm run dev
# Expected: "✓ Ready on http://localhost:3000"
```

### 1.4 Startup Verification Checklist

- [ ] Backend logs show `✅ Database connection established successfully`
- [ ] Backend logs show `📦 Compilation queue worker initialized`
- [ ] If Redis is **offline**: logs show `⚠ Redis offline — using Mock In-Memory Queue`
- [ ] If Redis is **online**: logs show `✅ Redis connected`
- [ ] Frontend compiles without errors at `http://localhost:3000`

---

## 2. Health & Public Endpoints

> **Tool**: Browser address bar or `curl`

### 2.1 Health Check

```
GET http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-11T...",
  "message": "JBSnap Backend Template is connected and running!"
}
```
- [ ] Status code: `200`
- [ ] `status` field equals `"ok"`
- [ ] `timestamp` is a valid ISO 8601 date

### 2.2 Public Stats

```
GET http://localhost:5000/api/public-stats
```

**Expected Response:**
```json
{
  "status": "success",
  "totalProjects": <number>,
  "totalWorkflows": <number>,
  "totalRequests": <number>,
  "avgLatency": <number>
}
```
- [ ] Status code: `200`
- [ ] All numeric fields are ≥ 0
- [ ] This is the data source for the landing page stats section

---

## 3. Authentication

### 3.1 Registration

**URL**: `http://localhost:3000/register`

#### 3.1.1 Happy Path
- [ ] Navigate to `/register`
- [ ] Enter a **new** email: `testuser@jbsnap.dev`
- [ ] Enter username: `TestUser`
- [ ] Enter password: `SecurePass123!`
- [ ] Click **Create Account**
- [ ] **Expected**: Redirected to `/dashboard`
- [ ] **Expected**: JWT token stored in `localStorage` as `ff_token`
- [ ] **Expected**: User object stored in `localStorage` as `ff_user`

#### 3.1.2 Duplicate Email
- [ ] Attempt to register again with the **same email**
- [ ] **Expected**: Error message shown (`"User already exists"` or similar)
- [ ] **Expected**: No redirect, stays on `/register`

#### 3.1.3 API Validation
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json
Body: {}   ← empty
```
- [ ] **Expected**: `400 Bad Request`

#### 3.1.4 Rate Limit
- [ ] Attempt to register 6 times rapidly (the rate limiter kicks in)
- [ ] **Expected**: Eventually receives `429 Too Many Requests`

---

### 3.2 Login

**URL**: `http://localhost:3000/login`

#### 3.2.1 Happy Path
- [ ] Enter previously registered email and password
- [ ] Click **Sign In**
- [ ] **Expected**: Redirected to `/dashboard`
- [ ] **Expected**: `ff_token` present in `localStorage`

#### 3.2.2 Wrong Password
- [ ] Enter correct email, wrong password
- [ ] **Expected**: Error shown (`"Invalid credentials"`)
- [ ] **Expected**: No redirect

#### 3.2.3 Non-existent Email
- [ ] Enter `nobody@jbsnap.dev`
- [ ] **Expected**: Error shown

#### 3.2.4 Empty Fields
- [ ] Leave email empty and click Sign In
- [ ] **Expected**: HTML5 `required` validation or error message

---

### 3.3 Protected Routes (Auth Guard)

- [ ] Open incognito browser (no token)
- [ ] Navigate to `http://localhost:3000/dashboard` directly
- [ ] **Expected**: Redirected to `/login`
- [ ] Navigate to `http://localhost:3000/settings` directly
- [ ] **Expected**: Redirected to `/login`

---

### 3.4 Get Current User (API)

```
GET http://localhost:5000/api/auth/me
Authorization: Bearer <your-jwt-token>
```
- [ ] **Expected**: `200` with `{ id, email, username, ... }`
- [ ] Without token → **Expected**: `401 Unauthorized`

---

## 4. Landing Page

**URL**: `http://localhost:3000`

### 4.1 Hero Section
- [ ] Page loads without errors
- [ ] JBSnap logo visible in the header/title tab (favicon)
- [ ] **"Get Started Free"** CTA button → navigates to `/register`
- [ ] **"Watch Demo"** CTA button → scrolls to demo section and auto-plays the animation
- [ ] GitHub link in navbar → opens `https://github.com/Jinay-Bhatt/Backend-Api` in a new tab

### 4.2 Live Stats (Real Data)
- [ ] Stats cards (Total Projects, Workflows, Requests, Avg Latency) show real numbers fetched from `/api/public-stats`
- [ ] Numbers animate on first load (counter animation)
- [ ] Numbers are **not** hardcoded zeros

### 4.3 Real-Time Analytics Bento Card
- [ ] "Active Connections" counter in the bento section updates in real time via Socket.IO
- [ ] Bar chart in the bento card animates/updates when API gateway requests are made
- [ ] When no requests are made for 8 seconds, bars gently simulate idle movement

### 4.4 Capabilities Grid
- [ ] All 6 capability cards render without empty slots or layout breaks
- [ ] Grid is responsive: on narrow viewport the cards stack vertically

### 4.5 Footer Links
- [ ] **Documentation** → navigates to `/docs`
- [ ] **GitHub** → opens `https://github.com/Jinay-Bhatt/Backend-Api`
- [ ] **About** → navigates to `/about`
- [ ] **Changelog** → navigates to `/changelog`
- [ ] **Contact** → navigates to `/contact`

---

## 5. Dashboard

**URL**: `http://localhost:3000/dashboard` (requires login)

### 5.1 Stat Cards
- [ ] **Active Pipelines** shows correct count of published workflows across all projects
- [ ] **Live Endpoints** shows count of live endpoints
- [ ] **Projects** shows correct total project count
- [ ] **Uptime** shows uptime percentage
- [ ] AnimCounter counts smoothly from 0 to real value (uses `requestAnimationFrame`)

### 5.2 Project List
- [ ] All projects belonging to the logged-in user are displayed
- [ ] Each project card shows: name, description, endpoint/workflow count badge
- [ ] Clicking a project card navigates to `/projects/[id]/builder`

### 5.3 Create Project Modal
- [ ] Click **+ New Project** button
- [ ] Modal opens with Name and Description fields
- [ ] Both **Cancel** and **Create Project** buttons have proper height (≥38px)
- [ ] **Cancel** closes the modal without creating a project
- [ ] Leave name empty, click Create — **Expected**: validation error / button disabled
- [ ] Fill name `My Test API` and description, click **Create Project**
- [ ] **Expected**: Modal closes, new project card appears in list immediately
- [ ] **Expected**: Success toast or feedback shown

### 5.4 System Health Panel
- [ ] CPU, Memory, Uptime metrics display (via scheduler heartbeat)
- [ ] Latency and request aggregate stats visible

---

## 6. Project Management

### 6.1 API — Create Project

```
POST http://localhost:5000/api/projects
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "My Test Project",
  "description": "Testing JBSnap"
}
```
- [ ] **Expected**: `201` with `{ id, name, description, ownerId, ... }`

### 6.2 API — List Projects

```
GET http://localhost:5000/api/projects
Authorization: Bearer <token>
```
- [ ] **Expected**: `200` with array of projects
- [ ] Each project includes `workflows` array (for pipeline count)

### 6.3 API — Get Single Project

```
GET http://localhost:5000/api/projects/:id
Authorization: Bearer <token>
```
- [ ] **Expected**: `200` with project object
- [ ] With wrong `id` → **Expected**: `404`

### 6.4 API — Delete Project

```
DELETE http://localhost:5000/api/projects/:id
Authorization: Bearer <token>
```
- [ ] **Expected**: `200` or `204`
- [ ] Project no longer appears in list

### 6.5 Authorization Isolation
- [ ] Log in as **User A**, create a project → note its `id`
- [ ] Log in as **User B**, attempt `GET /api/projects/:id` with User B's token
- [ ] **Expected**: `403 Forbidden` or `404 Not Found` (no cross-user access)

---

## 7. Workflow Builder

**URL**: `http://localhost:3000/projects/[id]/builder`

> **Overview**: The Workflow Builder is a visual, node-based API pipeline editor.
> Each workflow = one HTTP route. Nodes are connected left-to-right as a Directed Acyclic Graph (DAG).
> The execution engine traverses the DAG in topological order at runtime.

---

### 7.1 Canvas Load

- [ ] Navigate to `http://localhost:3000/projects/[id]/builder`
- [ ] The React Flow canvas renders with a dark background grid
- [ ] Left sidebar shows a list of existing workflows (empty on first visit)
- [ ] Node palette panel is visible (left side or collapsible panel)
- [ ] Top bar shows: **+ New Workflow**, **✨ AI Generate**, **Save**, **Publish**, **Test** buttons

---

### 7.2 Create a New Workflow (Manual)

- [ ] Click **+ New Workflow**
- [ ] Modal appears with 3 fields:
  - **Name**: `User Profile API`
  - **Route**: `/profile`
  - **Method**: `GET`
- [ ] Click **Deploy Workflow**
- [ ] **Expected**: Workflow `User Profile API` appears in sidebar list
- [ ] Canvas clears, ready for nodes to be added
- [ ] API call: `POST /api/projects/:id/workflows`

---

### 7.3 Complete Workflow A — "Secure User Lookup" (Covers 9 Node Types)

This is the **primary end-to-end workflow test**. Build it from scratch using every available node.

> **Workflow Name**: `Secure User Lookup`
> **Route**: `/users/:id`
> **Method**: `GET`
> **Goal**: Validate JWT → Check API Key → Query DB → Transform result → Respond

#### Step 1 — Create the Workflow

- [ ] Click **+ New Workflow**
- [ ] Name: `Secure User Lookup`
- [ ] Route: `/users`
- [ ] Method: `GET`
- [ ] Click **Deploy Workflow**

---

#### Step 2 — Add: HTTP Trigger Node (triggerNode)

**Category**: Triggers → **HTTP Trigger**

- [ ] In the node palette, under **Triggers**, click **HTTP Trigger**
- [ ] Node appears on canvas labelled `HTTP Trigger`
- [ ] Click the node to select it → config panel opens on the right
- [ ] Set the following fields in the config panel:

| Field | Value |
|-------|-------|
| `method` | `GET` |
| `path` | `/users` |

- [ ] **Expected**: Node preview in canvas updates to show `GET /users`
- [ ] Node has one **output handle** on its right side (no input handle — it is the start)

> ✅ **Rule**: Only one `triggerNode` is allowed per workflow. Adding a second triggers an alert.

---

#### Step 3 — Add: JWT Validate Node (jwtValidateNode)

**Category**: Security → **JWT Validate**

- [ ] Click **JWT Validate** in the node palette
- [ ] Node appears on canvas labelled `JWT Validate`
- [ ] Select it → config panel opens
- [ ] Set the following fields:

| Field | Value |
|-------|-------|
| `secret` | *(leave blank — uses `env.JWT_SECRET` automatically)* |

- [ ] **Expected**: Node preview shows `Secret: env.JWT_SECRET`
- [ ] Node has: **input handle** (left) + **output handle** (right)

**Connect**: Drag from `HTTP Trigger` output → `JWT Validate` input

- [ ] A cyan animated edge appears between the two nodes
- [ ] **Expected**: Arrow points HTTP Trigger → JWT Validate

---

#### Step 4 — Add: API Key Node (apiKeyNode)

**Category**: Security → **API Key**

- [ ] Click **API Key** in the node palette
- [ ] Node appears labelled `API Key`
- [ ] Select it → config panel opens
- [ ] Set the following fields:

| Field | Value |
|-------|-------|
| `headerName` | `x-api-key` |

- [ ] **Expected**: Node preview shows `Header: x-api-key`

**Connect**: Drag from `JWT Validate` output → `API Key` input

---

#### Step 5 — Add: Database Node (databaseNode)

**Category**: Data → **Database**

- [ ] Click **Database** in the node palette
- [ ] Node appears labelled `Database`
- [ ] Select it → config panel opens
- [ ] Set the following fields:

| Field | Value |
|-------|-------|
| `query` | `SELECT id, name, email, created_at FROM users WHERE id = $request.params.id;` |

> **Note on variable interpolation**: `$request.params.id` is automatically resolved from the incoming request at runtime. You can also use `$request.body.field`, `$request.query.field`, and `$steps.nodeId.field`.

- [ ] **Expected**: Node preview shows the SQL query truncated

**Connect**: Drag from `API Key` output → `Database` input

---

#### Step 6 — Add: Transform Node (transformNode)

**Category**: Logic → **Transform**

- [ ] Click **Transform** in the node palette
- [ ] Node appears labelled `Transform`
- [ ] Select it → config panel opens
- [ ] Set the following fields:

| Field | Value |
|-------|-------|
| `mapping` | `({ id: steps['node_DB'].id, name: steps['node_DB'].name, email: steps['node_DB'].email })` |

> **Note**: To find the actual Database node ID, click on the **Database** node on the canvas and look at the right-side configuration panel (`⚙️ NODE CONFIG`) under the box labeled **`NODE TELEMETRY KEY`** (e.g., `node_1783858654585`). Copy that ID and replace `node_DB` with it in the Transform mapping code. The transform expression is evaluated inside a secure JS sandbox. `steps` refers to `context.steps`.

- [ ] **Expected**: Node preview shows the mapping expression

**Connect**: Drag from `Database` output → `Transform` input

---

#### Step 7 — Add: Response Node (responseNode)

**Category**: Response → **Response**

- [ ] Click **Response** in the node palette
- [ ] Node appears labelled `Response`
- [ ] Select it → config panel opens
- [ ] Set the following fields:

| Field | Value |
|-------|-------|
| `statusCode` | `200` |
| `body` | `$steps.TRANSFORM_NODE_ID` |

> Replace `TRANSFORM_NODE_ID` with the actual node ID of the Transform node (visible in the config panel header or node label).

- [ ] **Expected**: Node preview shows `Status: 200` and `Body: $steps.…`
- [ ] This node has **input handle only** (no output — it terminates the workflow)

**Connect**: Drag from `Transform` output → `Response` input

---

#### Step 8 — Full Workflow Canvas State

After all 6 nodes are connected, verify:

```
[HTTP Trigger] → [JWT Validate] → [API Key] → [Database] → [Transform] → [Response]
```

- [ ] All 5 edges (arrows) are visible and animated (cyan color)
- [ ] No disconnected/orphaned nodes exist
- [ ] Node count in canvas: **6 nodes**
- [ ] Edge count: **5 edges**

---

#### Step 9 — Save the Workflow

- [ ] Click the **Save** button in the top toolbar
- [ ] **Expected**: Button shows a loading spinner briefly, then reverts to `Save`
- [ ] API call: `PUT /api/workflows/:id` with `{ nodes: [...], edges: [...] }`
- [ ] Refresh the page → workflow reloads with the same nodes and edges intact

---

#### Step 10 — Publish the Workflow

- [ ] Click **Publish** button
- [ ] **Expected**: Button label changes to **Unpublish** (or toggle state)
- [ ] API call: `POST /api/workflows/:id/publish` with `{ isPublished: true }`
- [ ] Sidebar shows a green **●** published indicator next to `Secure User Lookup`

---

#### Step 11 — Test Execution via Built-in API Sandbox

- [ ] Click the **Test** (⚡ or terminal) button in the top toolbar
- [ ] Test panel slides open with:
  - **Query String** field
  - **Headers** field (JSON)
  - **Body** field (JSON, disabled for GET)
**Before filling the headers, you need two values:**

**1. Getting your `<your_jwt_token>`:**
> - Open your browser's **DevTools** → **Application** tab → **Local Storage** → `http://localhost:3000`
> - Look for the key `ff_token` — copy its value. This is your JWT token, generated automatically when you logged in or registered.
> - Alternatively, call the login API directly:
>   ```bash
>   curl -X POST http://localhost:5000/api/auth/login \
>     -H "Content-Type: application/json" \
>     -d '{"email": "testuser@jbsnap.dev", "password": "SecurePass123!"}'
>   ```
>   Copy the `token` value from the response.

**2. Getting your `<your_api_key>`:**
> - Navigate to `http://localhost:3000/projects/[id]/gateway`
> - Find the **Secure User Lookup** workflow in the dropdown
> - Toggle **Require API Key** → ON
> - Type any key you want in the **API Key** field (e.g. `myapikey123`) and click **Save Config**
> - Use that exact same value in the header below

| Field | Value |
|-------|-------|
| Query String | *(leave blank)* |
| Headers | `{ "Authorization": "Bearer <paste_ff_token_here>", "x-api-key": "myapikey123" }` |
| Body | *(disabled — GET request)* |

- [ ] Click **Run Test**
- [ ] **Expected**: Response panel shows:
  - Status: `200 OK`
  - Latency: `< 500ms`
  - Body: `{ "id": "...", "name": "...", "email": "..." }`
- [ ] In the **Live Logs** section of the builder, a new log entry appears with `200` status

---

### 7.4 Complete Workflow B — "Order Processing" (Covers If/Else + Switch Case + HTTP Client)

> **Workflow Name**: `Order Processor`
> **Route**: `/orders`
> **Method**: `POST`
> **Goal**: Receive order → Check status → Route to payment/fulfillment → Call external API → Respond

#### Step 1 — Create the Workflow

- [ ] Click **+ New Workflow**
- [ ] Name: `Order Processor`
- [ ] Route: `/orders`
- [ ] Method: `POST`

---

#### Step 2 — Add: HTTP Trigger Node

**Category**: Triggers → **HTTP Trigger**

| Field | Value |
|-------|-------|
| `method` | `POST` |
| `path` | `/orders` |

---

#### Step 3 — Add: If / Else Node (ifElseNode)

**Category**: Logic → **If / Else**

- [ ] Click **If / Else** in the palette
- [ ] Select → config panel opens
- [ ] Set:

| Field | Value |
|-------|-------|
| `condition` | `context.request.body.active === true` |

- [ ] **Expected**: Node shows two output handles:
  - **`true` handle** (top-right) — executes when condition is `true`
  - **`false` handle** (bottom-right) — executes when condition is `false`

**Connect**: HTTP Trigger → If/Else

---

#### Step 4 — Add: Switch Case Node (switchCaseNode)

**Category**: Logic → **Switch Case**

- [ ] Click **Switch Case** in the palette
- [ ] Select → config panel opens
- [ ] Set:

| Field | Value |
|-------|-------|
| `expression` | `context.request.body.status` |
| `cases` | `paid, pending, default` |

- [ ] **Expected**: Node shows output handles for each case: `paid`, `pending`, `default`

**Connect**: If/Else `true` handle → Switch Case

---

#### Step 5 — Add: HTTP Client Node (httpClientNode)

**Category**: Integrations → **HTTP Client**

- [ ] Click **HTTP Client** in the palette
- [ ] Select → config panel opens
- [ ] Set:

| Field | Value |
|-------|-------|
| `method` | `POST` |
| `url` | `https://httpbin.org/post` |
| `headers` | `{ "Content-Type": "application/json", "User-Agent": "JBSnap-Platform" }` |
| `body` | `$request.body` |

> **Variable interpolation**: `$request.body` passes the entire incoming request body to the external API. `$steps.nodeId.field` passes data from a previous step.

**Connect**: Switch Case `paid` handle → HTTP Client

---

#### Step 6 — Add: JavaScript Node (customCodeNode)

**Category**: Custom → **JavaScript**

- [ ] Click **JavaScript** in the palette
- [ ] Select → config panel opens
- [ ] Set the code editor to:

```javascript
// Access context
const { body } = context.request;
const orderId = body.orderId || 'unknown';
const amount = body.amount || 0;

// Business logic
const tax = amount * 0.18;
const total = amount + tax;

// Return output (accessible as $steps.<nodeId> in subsequent nodes)
return {
  orderId,
  amount,
  tax: Math.round(tax * 100) / 100,
  total: Math.round(total * 100) / 100,
  processedAt: new Date().toISOString()
};
```

- [ ] **Expected**: Code editor accepts multiline JS with syntax highlighting
- [ ] Node preview shows `⚡ JavaScript`

**Connect**: Switch Case `pending` handle → JavaScript

---

#### Step 7 — Add Two Response Nodes

Add one `Response` node for the `paid` branch and one for the `pending` branch.

**Response Node A (for paid branch)**:

| Field | Value |
|-------|-------|
| `statusCode` | `200` |
| `body` | `$steps.HTTP_CLIENT_NODE_ID` |

**Connect**: HTTP Client → Response A

**Response Node B (for pending branch)**:

| Field | Value |
|-------|-------|
| `statusCode` | `202` |
| `body` | `$steps.JS_NODE_ID` |

**Connect**: JavaScript → Response B

**Response Node C (for false/inactive branch)**:

| Field | Value |
|-------|-------|
| `statusCode` | `400` |
| `body` | `{ "error": "Order is not active" }` |

**Connect**: If/Else `false` handle → Response C

---

#### Step 8 — Full Canvas Layout

```
                                    ┌─[HTTP Client]──→[Response A: 200]
[HTTP Trigger]→[If/Else]→[Switch]──┤
                    │               └─[JavaScript]───→[Response B: 202]
                    │
                    └──→[Response C: 400]
```

- [ ] Canvas shows **8 nodes**, **7 edges**
- [ ] All Switch Case branches have edges
- [ ] If/Else has both `true` and `false` handles connected

---

#### Step 9 — Save & Test Execution

- [ ] Save the workflow
- [ ] Publish the workflow
- [ ] Open the Test panel

**Test 1 — Active order, paid status (hits HTTP Client → Response 200)**:

| Field | Value |
|-------|-------|
| Headers | `{ "Content-Type": "application/json" }` |
| Body | `{ "active": true, "status": "paid", "orderId": "ORD-001", "amount": 500 }` |

- [ ] **Expected**: `200 OK`, response body from `httpbin.org/post`

**Test 2 — Active order, pending status (hits JavaScript → Response 202)**:

| Field | Value |
|-------|-------|
| Body | `{ "active": true, "status": "pending", "orderId": "ORD-002", "amount": 300 }` |

- [ ] **Expected**: `202 Accepted`, body with `{ "orderId": "ORD-002", "total": 354, ... }`

**Test 3 — Inactive order (hits If/Else false → Response 400)**:

| Field | Value |
|-------|-------|
| Body | `{ "active": false, "orderId": "ORD-003" }` |

- [ ] **Expected**: `400 Bad Request`, body `{ "error": "Order is not active" }`

---

### 7.5 Complete Workflow C — "Scheduled Health Check" (Covers Scheduled + Webhook Nodes)

> **Workflow Name**: `Health Monitor`
> **Method**: `GET`
> **Goal**: Test Scheduled and Webhook trigger node types

#### Scheduled Node

- [ ] Click **+ New Workflow** → Name: `Health Monitor`, Route: `/health-check`, Method: `GET`
- [ ] In palette → **Triggers** → click **Scheduled**
- [ ] Config panel:

| Field | Value |
|-------|-------|
| `cron` | `0 * * * *` *(every hour)* |
| `timezone` | `UTC` |

- [ ] Add a **Response** node → `{ "status": "healthy" }` → status `200`
- [ ] Connect: Scheduled → Response
- [ ] Save

#### Webhook Node

- [ ] Click **+ New Workflow** → Name: `GitHub Webhook`, Route: `/github-webhook`, Method: `POST`
- [ ] In palette → **Triggers** → click **Webhook**
- [ ] Config panel:

| Field | Value |
|-------|-------|
| `path` | `/github-webhook` |
| `secret` | `my-webhook-secret` *(optional HMAC validation)* |

- [ ] Add a **JavaScript** node with:
```javascript
const { body } = context.request;
return {
  event: body.action || 'unknown',
  repo: body.repository?.name || 'unknown',
  receivedAt: new Date().toISOString()
};
```
- [ ] Add a **Response** node → `$steps.JS_NODE_ID` → status `200`
- [ ] Connect: Webhook → JavaScript → Response
- [ ] Save & Publish

---

### 7.6 AI Workflow Generation

> The **✨ AI Generate** button sends a natural language prompt to the backend AI service (`GROQ_API_KEY` required), which returns a complete workflow with nodes and edges already configured.

#### 7.6.1 Basic AI Generation

- [ ] Click the **✨ AI Generate** (Sparkles icon) button in the top toolbar
- [ ] AI panel slides open with a text input
- [ ] Enter the following prompt:

```
Create a workflow that validates a JWT token, fetches a user from the database
by ID from the request params, and returns the user profile as a JSON response
```

- [ ] Click **Generate**
- [ ] **Expected**: Loading spinner appears
- [ ] **Expected** (within 5–15 seconds): Canvas populates with auto-generated nodes:
  - `triggerNode` with `method: GET, path: /users/:id`
  - `jwtValidateNode`
  - `databaseNode` with a `SELECT` query using `$request.params.id`
  - `responseNode` pointing to the DB result
- [ ] **Expected**: Workflow automatically appears in the sidebar list with the AI-generated name
- [ ] AI panel closes automatically on success

#### 7.6.2 AI Generation — Complex Prompt

- [ ] Open AI panel again
- [ ] Enter:

```
Build a payment processing workflow with POST /payments route.
It should check an API key header, validate the payment amount is greater
than 0 using an if/else condition, call an external payment gateway at
https://api.stripe.com/v1/charges with the amount in the body,
and return 200 with the charge ID or 400 if amount is invalid.
```

- [ ] Click **Generate**
- [ ] **Expected**: Canvas shows:
  - `triggerNode (POST /payments)`
  - `apiKeyNode`
  - `ifElseNode` (condition: `context.request.body.amount > 0`)
  - `httpClientNode` (url: `https://api.stripe.com/v1/charges`)
  - `responseNode` (200) on true branch
  - `responseNode` (400) on false branch

#### 7.6.3 AI Generation — Error Cases

- [ ] Clear the prompt and click **Generate** with empty input
- [ ] **Expected**: Nothing happens (button disabled or validation message)
- [ ] Enter a nonsensical prompt: `asdfghjkl xyz`
- [ ] **Expected**: Either a graceful error message or a minimal workflow is generated

#### 7.6.4 AI Generation — No API Key (Edge Case)

- [ ] Remove `GROQ_API_KEY` from `.env` temporarily and restart backend
- [ ] Attempt to generate a workflow
- [ ] **Expected**: Error message: `AI service not configured` or `500` response
- [ ] Restore `GROQ_API_KEY` before continuing

---

### 7.7 Individual Node Config Validation

Test that every node field is correctly editable and saved:

#### triggerNode
- [ ] Click node → panel shows `method` dropdown and `path` text input
- [ ] Change `method` to `POST` → canvas node preview updates
- [ ] Change `path` to `/new-path` → preview updates

#### webhookNode
- [ ] Panel shows `path` and `secret` fields
- [ ] Enter `secret: abc123` → preview shows `Secret: ••••••••` (masked)

#### scheduledNode
- [ ] Panel shows `cron` and `timezone` fields
- [ ] Enter `cron: */5 * * * *` → preview updates

#### databaseNode
- [ ] Panel shows `query` textarea (multi-line)
- [ ] Enter SQL with variables: `SELECT * FROM orders WHERE user_id = $request.body.userId;`
- [ ] Preview shows truncated query

#### customCodeNode (JavaScript)
- [ ] Panel shows a code editor
- [ ] Enter multiline JS — editor accepts tabs and newlines
- [ ] Syntax errors do not crash the UI (they error at execution time only)

#### ifElseNode
- [ ] Panel shows `condition` text input
- [ ] Enter: `context.request.body.age >= 18`
- [ ] Node on canvas shows **two output handles** (true/false)

#### switchCaseNode
- [ ] Panel shows `expression` and `cases` fields
- [ ] `cases` is a comma-separated list: `active, inactive, pending, default`
- [ ] Node shows one output handle per case

#### httpClientNode
- [ ] Panel shows: `method` (dropdown), `url`, `headers` (JSON), `body`
- [ ] Enter URL with variable: `https://api.github.com/users/$request.body.username`
- [ ] Headers: `{ "Accept": "application/vnd.github.v3+json" }`

#### transformNode
- [ ] Panel shows `mapping` field (JS expression)
- [ ] Enter: `({ userId: steps['db_node'].id, fullName: steps['db_node'].name })`

#### jwtValidateNode
- [ ] Panel shows `secret` field
- [ ] Leave blank → uses `env.JWT_SECRET`
- [ ] Enter custom secret → preview shows `Secret: ••••••••`

#### apiKeyNode
- [ ] Panel shows `headerName` field
- [ ] Change to `Authorization` → preview updates
- [ ] Change back to `x-api-key`

#### responseNode
- [ ] Panel shows `statusCode`, `body`, `headers`, `redirectUrl` fields
- [ ] Set `statusCode: 201`, `body: { "created": true }` → preview shows green `201`
- [ ] Set `statusCode: 404` → preview shows red `404`
- [ ] Set `redirectUrl: https://example.com` → preview shows `Redirect: https://example.com`

---

### 7.8 Edge / Connection Behavior

- [ ] Drag from a node's **output handle** (right side) to another node's **input handle** (left side)
- [ ] A cyan animated edge with an arrowhead appears
- [ ] **Cannot** connect a node's output to its own input (self-loop)
- [ ] Clicking an existing edge selects it (highlighted)
- [ ] Press **Delete** or **Backspace** key to remove a selected edge
- [ ] After edge deletion, clicking **Save** persists the removal

**If/Else specific**:
- [ ] `ifElseNode` has **two named output handles**: `true` (top) and `false` (bottom)
- [ ] Connect `true` handle to one node and `false` handle to another
- [ ] Both edges appear with correct labels

**Switch Case specific**:
- [ ] `switchCaseNode` has one output handle per case (including `default`)
- [ ] Each handle can connect to a different downstream node

---

### 7.9 Save, Publish & Delete

#### Save
- [ ] After building any workflow, click **Save**
- [ ] API call: `PUT /api/workflows/:id` with `{ nodes, edges, method, path }`
- [ ] **Expected**: `200 OK` from backend
- [ ] Refresh the page → workflow reloads with the same layout

#### Publish / Unpublish
- [ ] Click **Publish** (workflow must be saved first)
- [ ] API call: `POST /api/workflows/:id/publish` with `{ isPublished: true }`
- [ ] Sidebar indicator turns green (**●**)
- [ ] Click **Unpublish** → `{ isPublished: false }` → indicator disappears
- [ ] An unpublished workflow returns `404` when called via the gateway

#### Delete Workflow
- [ ] Right-click a workflow in sidebar, or click the trash icon
- [ ] Confirmation dialog appears: `"Delete 'WorkflowName'? This cannot be undone."`
- [ ] Click **Confirm** → API call: `DELETE /api/workflows/:id`
- [ ] Workflow removed from sidebar
- [ ] If deleted workflow was active → canvas clears

---

### 7.10 Live Logs Panel (Real-Time WebSocket Metrics)

- [ ] Builder page connects to Socket.IO room: `join-project` event with `projectId`
- [ ] Execute a published workflow via the Test panel or `curl`
- [ ] **Expected**: A log entry appears in the **Live Logs** section within the builder **without page refresh**
- [ ] Log entry shows: `method`, `path`, `status`, `latencyMs`, `timestamp`
- [ ] Up to 50 log entries are retained (oldest are removed automatically)
- [ ] Disconnect test: Stop backend → reconnect after restart → logs resume streaming

---

### 7.11 Gateway API Execution Tests (All Nodes End-to-End via curl)

After publishing `Secure User Lookup` (`GET /users`), execute it via the gateway:

**Test — No Auth (JWT required)**:
```bash
curl http://localhost:5000/api/<projectId>/users
```
- [ ] **Expected**: `500` — `Missing or invalid Authorization Bearer header`

**Test — Invalid JWT**:
```bash
curl -H "Authorization: Bearer invalid.token.here" \
     http://localhost:5000/api/<projectId>/users
```
- [ ] **Expected**: `500` — `JWT node validation failed: ...`

**Test — Valid JWT, No API Key**:
```bash
curl -H "Authorization: Bearer <valid_token>" \
     http://localhost:5000/api/<projectId>/users
```
- [ ] **Expected**: `500` — `Missing required API Key header 'x-api-key'`

**Test — Full valid request**:
```bash
curl -H "Authorization: Bearer <valid_token>" \
     -H "x-api-key: <your_key>" \
     http://localhost:5000/api/<projectId>/users
```
- [ ] **Expected**: `200 OK` with user data from DB

---

### 7.12 Node Palette UI Tests

- [ ] Node palette is grouped by category: **Triggers**, **Logic**, **Data**, **Integrations**, **Security**, **Custom**, **Response**
- [ ] Each category has a colored header matching its node accent color
- [ ] Hovering a palette item shows a tooltip or description
- [ ] Clicking a palette item adds the node to canvas at a cascaded position (no overlap)
- [ ] Attempting to add a second `triggerNode` shows: `"Only one trigger node per workflow"`
- [ ] All 12 node types are present:

| # | Node | Type Key | Category |
|---|------|----------|----------|
| 1 | HTTP Trigger | `triggerNode` | Triggers |
| 2 | Webhook | `webhookNode` | Triggers |
| 3 | Scheduled | `scheduledNode` | Triggers |
| 4 | If / Else | `ifElseNode` | Logic |
| 5 | Switch Case | `switchCaseNode` | Logic |
| 6 | Transform | `transformNode` | Logic |
| 7 | Database | `databaseNode` | Data |
| 8 | HTTP Client | `httpClientNode` | Integrations |
| 9 | JWT Validate | `jwtValidateNode` | Security |
| 10 | API Key | `apiKeyNode` | Security |
| 11 | JavaScript | `customCodeNode` | Custom |
| 12 | Response | `responseNode` | Response |

---

## 8. Services Registry

**URL**: `http://localhost:3000/projects/[id]/services`

### 8.1 List Services
- [ ] Page loads and fetches existing services from `GET /api/projects/:id/services`
- [ ] Each service card shows: name, base URL, description, registered routes

### 8.2 Register a New Service (Modal)
- [ ] Click **+ Register Service** button
- [ ] Modal opens with fields: Name, Base URL, Description
- [ ] **Cancel** button has `height: 38px` and `border-radius: 8px`
- [ ] **Register Service** button has `height: 38px` and `border-radius: 8px`
- [ ] Fill: Name `User Service`, Base URL `http://localhost:4001`, Description `Handles users`
- [ ] Click **Register Service**
- [ ] **Expected**: Service card appears in list, modal closes

### 8.3 Add Route to a Service
- [ ] Click **+ Add Route** on a service card
- [ ] Enter route path `/users` and method `GET`
- [ ] Click save
- [ ] **Expected**: Route appears inside the service card

### 8.4 Delete Service Route
- [ ] Click delete/trash icon on a route
- [ ] **Expected**: Route removed from the service
- [ ] API call: `DELETE /api/projects/:id/services/:serviceId/routes/:routeId`

### 8.5 Delete Service
- [ ] Click delete on a service card
- [ ] **Expected**: Service removed from list
- [ ] API call: `DELETE /api/projects/:id/services/:serviceId`

### 8.6 API Validation
```
POST http://localhost:5000/api/projects/:id/services
Authorization: Bearer <token>
Body: {} ← empty
```
- [ ] **Expected**: `400 Bad Request`

---

## 9. Gateway Configuration

**URL**: `http://localhost:3000/projects/[id]/gateway`

### 9.1 Load Config for a Workflow
- [ ] Page loads and populates the workflow selector dropdown with available workflows
- [ ] Selecting a workflow loads its current gateway config
- [ ] API call: `GET /api/workflows/:workflowId/gateway-config`

### 9.2 JWT Protection Toggle
- [ ] Toggle **Require JWT** to ON
- [ ] Click **Save Config**
- [ ] API call: `PUT /api/workflows/:workflowId/gateway-config`
- [ ] **Expected**: `{ requireJwt: true }` saved
- [ ] Re-select the workflow → toggle should still be ON (persisted)

### 9.3 API Key Protection Toggle
- [ ] Toggle **Require API Key** to ON
- [ ] Set API Key value in the text field
- [ ] Save
- [ ] **Expected**: API key saved (encrypted in DB)

### 9.4 Rate Limiting Config
- [ ] Set **Rate Limit** to `10` requests per `60` seconds
- [ ] Save
- [ ] **Expected**: Config saved with `rateLimitLimit: 10, rateLimitWindow: 60`
- [ ] Verified by sending >10 requests to the gateway in 60s → should get `429`

### 9.5 CORS Config
- [ ] Toggle **CORS Enabled** OFF
- [ ] Save
- [ ] **Expected**: `corsEnabled: false` in DB
- [ ] Toggle **CORS Enabled** ON, set **Allowed Origins** to `https://myapp.com`
- [ ] Save and verify persistence

---

## 10. Live Monitor

**URL**: `http://localhost:3000/projects/[id]/monitor`

### 10.1 Historical Logs (from DB)
- [ ] Page loads and fetches existing execution logs from `GET /api/projects/:id/logs`
- [ ] Log entries show: timestamp, method, route, status code, latency
- [ ] Status colors: green (2xx), amber (4xx), red (5xx)

### 10.2 Live Stream (Socket.IO)
- [ ] Log entries arrive in real time as gateway requests are made (see Section 12)
- [ ] New logs appear at the top of the list without page refresh
- [ ] Live pulse bar (shimmer animation) runs while not paused

### 10.3 Pause / Resume
- [ ] Click **Pause** button
- [ ] Trigger a gateway request
- [ ] **Expected**: No new log entries appear while paused
- [ ] Click **Resume**
- [ ] **Expected**: Live stream resumes and new logs appear

### 10.4 Filter Controls
- [ ] Select filter: **Success** → only 2xx logs shown
- [ ] Select filter: **Error** → only 4xx/5xx logs shown
- [ ] Select filter: **All** → all logs shown

### 10.5 Clear Logs
- [ ] Click **Clear** button
- [ ] **Expected**: Log display cleared (local UI clear, does not delete DB records)

### 10.6 Animated Counters
- [ ] Stat counters (Total Requests, Avg Latency, Error Rate) animate from 0 to real values
- [ ] Counters update in real time as new requests come in

---

## 11. Analytics Page

**URL**: `http://localhost:3000/projects/[id]/analytics`

### 11.1 Data Load
- [ ] Page loads and fetches analytics from `GET /api/projects/:id/analytics`
- [ ] Charts/graphs appear with real data

### 11.2 Metrics Displayed
- [ ] Total request count
- [ ] Latency distribution (if charted)
- [ ] Error rate
- [ ] Requests over time breakdown by workflow/route

### 11.3 No Data State
- [ ] If no execution logs exist for the project, empty/zero state is shown cleanly (no crash)

---

## 12. API Gateway Execution & Canvas Node Integration

> This section covers step-by-step UI actions, node placement, configuration parameters, and exact API validations for every node type in the JBSnap visual engine.

---

### 12.1 Node Placement & Connecting (General Canvas Rules)
- **Spawn Node**: Click any node block in the left sidebar palette under `NODE TELEMETRY` (e.g., Click `HTTP CLIENT`, `DATABASE QUERY`, etc.). It spawns at a default offset on the canvas.
- **Select Node**: Click on the spawned node to open its configuration form on the right sidebar panel (`⚙️ NODE CONFIG`).
- **Connect Nodes**: Click and drag from the circular circular handle on the right side of the source node (`Output`) to the circular handle on the left side of the target node (`Input`). A light blue, animated dynamic link line will connect them.
- **Save Work**: Click the white **SAVE** button in the top center toolbar.
- **Publish Work**: Click the **INITIALIZE** button in the top center toolbar. The label will change to a red **SUSPEND** button and display a green `● LIVE` badge.

---

### 12.2 Setup Workspace Project
1. Go to the dashboard (`http://localhost:3000/dashboard`).
2. Click **+ New Project**. Enter name: `Gateway Test`, description: `End-to-End Node Testing`, click **Create Project**.
3. In the project sidebar/builder canvas page (`http://localhost:3000/projects/[id]/builder`), click the `+` button next to `ACTIVE ROUTES` in the left sidebar.
4. Enter Name: `Test Pipeline`, Route: `/run-test`, select Method: `POST` (or GET as needed), then click **Deploy Workflow**.

---

### 12.3 Testing Node: Response Node (Base Workflow)
*Verify the canvas can receive a basic mock JSON response.*

1. **Add Nodes**: Click `RESPONSE` under `UTILITY NODES` in the palette.
2. **Setup Route Method**: Select the default `TRIGGER` node. In `⚙️ NODE CONFIG`, ensure Method is `POST` and Path is `/run-test`.
3. **Connect Nodes**: Connect the `TRIGGER` node output to the `RESPONSE` node input.
4. **Configure Response Node**:
   - Click the `RESPONSE` node.
   - Set **Status Code** input: `200`
   - Set **Body (use $steps.nodeId to reference)**:
     ```json
     {
       "status": "success",
       "message": "Response Node executed successfully",
       "received": "$request.body"
     }
     ```
   - Leave **Headers** and **Redirect URL** blank.
5. **Save & Publish**: Click **SAVE**, then click **INITIALIZE**.
6. **Trigger Validation API**:
   ```bash
   curl -X POST http://localhost:5000/api/<projectId>/run-test \
     -H "Content-Type: application/json" \
     -d '{"testKey": "testVal"}'
   ```
   **Expected Response (200 OK)**:
   ```json
   {
     "status": "success",
     "message": "Response Node executed successfully",
     "received": {
       "testKey": "testVal"
     }
   }
   ```
- [ ] Status code is 200.
- [ ] Output displays the sent payload under the `received` attribute.
- [ ] Request shows up on the [Live Monitor](file:///c:/Users/bhavy/OneDrive/Documents/Backend-Api/frontend/src/app/projects/%5Bid%5D/monitor/page.tsx) telemetry list.

---

### 12.4 Testing Node: HTTP Request (HTTP Client) Node
*Verify that the engine can route and proxy upstream third-party APIs.*

1. **Delete Existing Response Link**: Click the link line between `TRIGGER` and `RESPONSE` node. Press `Delete` key on your keyboard to clear it, or click the `Delete` button next to the node (if selecting a node).
2. **Add Node**: Click `HTTP CLIENT` under `INTEGRATION NODES` in the palette.
3. **Configure HTTP Client Node**:
   - Click the new `httpClientNode` on canvas.
   - Set Method: `GET`
   - Set **URL**: `https://jsonplaceholder.typicode.com/posts/1`
   - Set **Headers**:
     ```json
     {
       "Accept": "application/json"
     }
     ```
   - Leave **Body** empty.
4. **Connect Nodes**:
   - Link `TRIGGER` output $\rightarrow$ `httpClientNode` input.
   - Link `httpClientNode` output $\rightarrow$ `RESPONSE` node input.
5. **Update Response Node**:
   - Note the telemetry ID of the HTTP client node (e.g. `node_171540...` shown in the top blue header of the config panel). Let's call it `<httpNodeId>`.
   - Click `RESPONSE` node. Change the **Body** field to:
     ```json
     {
       "proxyData": "$steps.<httpNodeId>.body"
     }
     ```
6. **Save & Publish**: Click **SAVE**, then click **INITIALIZE** (or ensure it is active).
7. **Trigger Validation API**:
   ```bash
   curl -X POST http://localhost:5000/api/<projectId>/run-test
   ```
   **Expected Response (200 OK)**:
   ```json
   {
     "proxyData": {
       "userId": 1,
       "id": 1,
       "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
       "body": "quia et suscipit\nsuscipit recusandae..."
     }
   }
   ```
- [ ] The API successfully proxies the title and body attributes from JSONPlaceholder.
- [ ] Upstream API duration is tracked as part of the total latency inside the Live Monitor logs.

---

### 12.5 Testing Node: JavaScript Transform Node
*Verify that the virtual machine sandbox handles mapping scripts correctly.*

1. **Delete Link**: Remove the link going from `httpClientNode` to `RESPONSE` node.
2. **Add Node**: Click `TRANSFORM` under `PROCESSING NODES` in the palette.
3. **Configure Transform Node**:
   - Click the transform node.
   - Note its ID: `<transformNodeId>` (e.g., `node_transform_abc`).
   - Paste mapping script in **Mapping (JS object)**:
     ```javascript
     {
       id: steps.<httpNodeId>.body.id,
       titleUppercase: steps.<httpNodeId>.body.title.toUpperCase(),
       timestamp: Date.now()
     }
     ```
4. **Connect Nodes**:
   - Connect `httpClientNode` output $\rightarrow$ Transform node input.
   - Connect Transform node output $\rightarrow$ `RESPONSE` node input.
5. **Configure Response Node**:
   - Click `RESPONSE` node. Update the **Body** configuration to:
     ```json
     "$steps.<transformNodeId>"
     ```
6. **Save & Publish**: Click **SAVE**, then click **INITIALIZE**.
7. **Trigger Validation API**:
   ```bash
   curl -X POST http://localhost:5000/api/<projectId>/run-test
   ```
   **Expected Response (200 OK)**:
   ```json
   {
     "id": 1,
     "titleUppercase": "SUNT AUT FACERE REPELLAT PROVIDENT OCCAECATI EXCEPTURI OPTIO REPREHENDERIT",
     "timestamp": 1715404800000
   }
   ```
- [ ] Title is completely uppercase.
- [ ] Timestamp is generated by the JS runtime.

---

### 12.6 Testing Node: SQL Query Node
*Verify database adapters can execute custom queries.*

1. **Clear Intermediate Nodes**: Delete `httpClientNode` and `transformNode` from the canvas using the **DELETE** button in their settings panel.
2. **Add Node**: Click `SQL QUERY` under `DATA NODES` in the palette.
3. **Configure SQL Node**:
   - Click the database node. Note its ID: `<dbNodeId>`.
   - Set **SQL Query**:
     ```sql
     SELECT 
       $request.body.val as value_provided,
       NOW() as db_time
     ```
4. **Connect Nodes**:
   - Connect `TRIGGER` output $\rightarrow$ SQL node input.
   - Connect SQL node output $\rightarrow$ `RESPONSE` node input.
5. **Update Response Node**:
   - Click `RESPONSE` node. Set **Body**:
     ```json
     {
       "dbResult": "$steps.<dbNodeId>.rows[0]"
     }
     ```
6. **Save & Publish**: Click **SAVE**, then click **INITIALIZE**.
7. **Trigger Validation API**:
   ```bash
   curl -X POST http://localhost:5000/api/<projectId>/run-test \
     -H "Content-Type: application/json" \
     -d '{"val": 999}'
   ```
   **Expected Response (200 OK)**:
   ```json
   {
     "dbResult": {
       "value_provided": 999,
       "db_time": "2026-07-11T..."
     }
   }
   ```
- [ ] Database returns rows matching parameter replacement query inputs.
- [ ] Dynamic database dates display standard ISO output.

---

### 12.7 Testing Node: Condition (If/Else) Node
*Verify conditional branching logic.*

1. **Remove Link**: Disconnect SQL Node from `RESPONSE` node.
2. **Add Node**: Click `CONDITION (IF/ELSE)` under `CONTROL FLOW` in the palette.
3. **Configure Condition Node**:
   - Click the condition node.
   - In **Condition (JS expression)** field, enter:
     ```javascript
     context.request.body.score >= 50
     ```
4. **Add a second Response Node**:
   - Click `RESPONSE` in palette to spawn another response node. Let's call it `RESPONSE_TRUE` and `RESPONSE_FALSE`.
   - Click `RESPONSE_TRUE` (connected to True branch handle) $\rightarrow$ Set Body:
     ```json
     { "outcome": "PASS" }
     ```
   - Click `RESPONSE_FALSE` (connected to False branch handle) $\rightarrow$ Set Body:
     ```json
     { "outcome": "FAIL" }
     ```
5. **Connect Nodes**:
   - Link `TRIGGER` output $\rightarrow$ Condition input handle.
   - Link Condition `True` handle (usually labeled/color-coded or the top/bottom branch pin) $\rightarrow$ `RESPONSE_TRUE` input.
   - Link Condition `False` handle $\rightarrow$ `RESPONSE_FALSE` input.
6. **Save & Publish**: Click **SAVE**, then click **INITIALIZE**.
7. **Trigger Validation API (Condition: True)**:
   ```bash
   curl -X POST http://localhost:5000/api/<projectId>/run-test \
     -H "Content-Type: application/json" \
     -d '{"score": 85}'
   ```
   **Expected Response**: `{ "outcome": "PASS" }`

8. **Trigger Validation API (Condition: False)**:
   ```bash
   curl -X POST http://localhost:5000/api/<projectId>/run-test \
     -H "Content-Type: application/json" \
     -d '{"score": 30}'
   ```
   **Expected Response**: `{ "outcome": "FAIL" }`

- [ ] Route forks correctly between separate response payloads based on body values.

---

### 12.8 Dynamic Route Parameter Support
1. Select the `TRIGGER` node.
2. Change the Path property in `⚙️ NODE CONFIG` to: `/users/:userId/details`
3. Click `RESPONSE` node, configure **Body** to:
   ```json
   {
     "requestedUser": "$request.params.userId"
   }
   ```
4. **Save & Publish**.
5. Trigger:
   ```bash
   curl -X GET http://localhost:5000/api/<projectId>/users/1024/details
   ```
   **Expected Response**: `{ "requestedUser": "1024" }`
- [ ] Router maps URL segments to `$request.params` namespace values correctly.

---

### 12.9 Rate Limiting Node
1. Spawn the `RATE LIMITER` node from `CONTROL FLOW`.
2. Connect `TRIGGER` $\rightarrow$ `RATE LIMITER` $\rightarrow$ `RESPONSE`.
3. Select `RATE LIMITER`. In configuration sidebar, enter limit: `2` and window (seconds): `5`.
4. Save and initialize.
5. Trigger calls rapidly. The 3rd request must return `429 Too Many Requests`.

---

---

## 13. Export & Compilation

**URL**: `http://localhost:3000/settings` (Export tab) or API directly

### 13.1 Trigger Export (API)

```
POST http://localhost:5000/api/projects/:id/export
Authorization: Bearer <token>
Content-Type: application/json
{ "pushToGit": false }
```
- [ ] **Expected**: `202 Accepted` with `{ jobId: "...", message: "Compilation exporter task queued successfully" }`

### 13.2 Check Export Status

```
GET http://localhost:5000/api/projects/:id/export/status/:jobId
Authorization: Bearer <token>
```
- [ ] **Expected**: `{ id, state, progress, ... }`
- [ ] `state` cycles: `waiting` → `active` → `completed`
- [ ] After completion, `state === "completed"`

### 13.3 Download Compiled ZIP

```
GET http://localhost:5000/api/projects/:id/export/download
Authorization: Bearer <token>
```
- [ ] **Expected**: File download begins
- [ ] File extension: `.zip`
- [ ] ZIP contains a generated Fastify backend project

### 13.4 Download Before Compile (Error Case)

- [ ] Try to download before triggering export
- [ ] **Expected**: `404` with `"ZIP codebase package has not been compiled yet"`

### 13.5 Push to Git (with Git Config set)

```
POST http://localhost:5000/api/projects/:id/export
Authorization: Bearer <token>
{ "pushToGit": true }
```
- [ ] If Git config is set (see Section 14.3), compiled code is pushed to GitHub
- [ ] **Expected**: `202` with job queued

### 13.6 Unauthorized Export

- [ ] Use User B's token on User A's project
- [ ] **Expected**: `404` (not found / unauthorized)

---

## 14. Settings Page

**URL**: `http://localhost:3000/settings`

### 14.1 Profile Tab

- [ ] Tab shows current `username` and `email` pre-filled
- [ ] Change username to `UpdatedUser`, click **Save Profile**
- [ ] **Expected**: Success message shown
- [ ] API call: `PUT /api/auth/update`
- [ ] Reload page — username should still be `UpdatedUser`

#### 14.1.1 Password Change

- [ ] Enter current password in **Old Password** field
- [ ] Enter `NewSecurePass456!` in **New Password** field
- [ ] Click **Save Profile**
- [ ] **Expected**: Success
- [ ] Log out, log in with **new** password
- [ ] **Expected**: Login works with new password

#### 14.1.2 Wrong Old Password

- [ ] Enter incorrect old password
- [ ] **Expected**: Error message, password not changed

### 14.2 Avatar Upload

- [ ] Click avatar area to upload an image
- [ ] Select a PNG/JPG file
- [ ] **Expected**: Avatar preview updates immediately (stored in localStorage)

### 14.3 Git Integration Tab

> **Connection between Settings and Export**: 
> - **Settings tab** is the control panel where you securely configure and store your GitHub credentials (your repository name and access token).
> - **Export page** is where you run the compiler and choose to **Push to GitHub**. When you push from the Export page, it uses the configuration stored here in Settings. If you haven't linked a repository in Settings, clicking Push on the Export page will automatically redirect you here.

#### 14.3.1 How to get your GitHub Personal Access Token (PAT)
To securely connect JBSnap to your GitHub repository, you need to generate a Personal Access Token (Classic). Follow these steps:
1. Log in to your account on [GitHub](https://github.com).
2. Click your profile picture in the top-right corner → select **Settings**.
3. In the left sidebar, scroll to the bottom and click **Developer settings**.
4. Click **Personal access tokens** → select **Tokens (classic)**.
5. Click the **Generate new token** dropdown → select **Generate new token (classic)**.
6. **Note**: Give it a descriptive name (e.g. `JBSnap Exporter Dev`).
7. **Expiration**: Select your preferred expiration (e.g. `30 days` or `No expiration` for dev).
8. **Select Scopes**: Check the following permissions:
   - [x] **`repo`** (Full control of private and public repositories - *this is required so the backend can push your compiled branch/files*).
9. Scroll to the bottom and click **Generate token**.
10. **CRITICAL**: Copy the generated token immediately. GitHub will never show it to you again.

---

#### 14.3.2 Testing Git Integration Setup
- [ ] Switch to **Git** tab in Settings (`http://localhost:3000/settings`)
- [ ] Fill in the fields:
  - **Repository Name**: Use the pattern `<username_or_org>/<repo_name>` (e.g., `Jinay-Bhatt/Backend-Api` or your own test repository)
  - **Access Token**: Paste your copied GitHub Personal Access Token (PAT)
  - **Provider**: Select `GITHUB` from the dropdown
- [ ] Click **Save Git Config**
- [ ] **Expected**: Success alert message appears
- [ ] API call triggered: `POST /api/git-config`
- [ ] Reload/Refresh the page:
  - [ ] **Expected**: Git settings are preloaded
  - [ ] The **Repository Name** and **Provider** are correctly shown
  - [ ] The **Access Token** field is masked or blank for security (it is encrypted at rest in the DB and never returned back to the client)

#### 14.3.3 Fetch Git Config

```
GET http://localhost:5000/api/git-config
Authorization: Bearer <token>
```
- [ ] **Expected**: `{ config: { provider, repositoryName, repositoryUrl, isActive } }`
- [ ] Access token is **not** returned (encrypted at rest)

#### 14.3.4 Missing Fields

```
POST http://localhost:5000/api/git-config
Authorization: Bearer <token>
{ "repositoryName": "test" }  ← missing accessToken and provider
```
- [ ] **Expected**: `400 Bad Request`

### 14.4 Export Page

Navigate to the project and select the **Export** tab (pink Package icon) in the secondary navigation bar.

#### 14.4.1 In-Memory Code Preview
- [ ] **Verify Load**: Upon loading the page, a loading skeleton state appears briefly.
- [ ] **File Tree**: A file explorer sidebar list appears on the left showing compiled project assets:
  - `package.json`
  - `tsconfig.json`
  - `prisma.config.ts`
  - `prisma/schema.prisma`
  - `src/index.ts`
  - `src/swagger.ts`
  - `Dockerfile`
  - `docker-compose.yml`
- [ ] **File Loading**: Click on a file in the sidebar list (e.g. `src/index.ts`).
  - [ ] **Expected**: Code content is rendered instantly in the right-side editor panel with monospace typography and line numbers.
- [ ] **Copy Code**: Click the **Copy Code** button in the top right of the code panel.
  - [ ] **Expected**: Button changes color, shows a Check mark, and displays `"Copied!"`. Verify the exact file content is copied to your system clipboard.

#### 14.4.2 Download ZIP Codebase
- [ ] Click the **Download ZIP Codebase** button in the header.
- [ ] **Verify Job Queue**: The status indicator displays `"Queuing compilation task on server..."` followed by `"Compiling source files, configurations, and schemas..."`.
- [ ] **Verify Status Check**: Every 1.5 seconds, the status checks update.
- [ ] **Expected**: The compilation completes, status shows `✓ Codebase successfully compiled!`, and the browser automatically initiates download of the generated `.zip` archive.
- [ ] Open the ZIP archive and verify it contains the full project file tree.

#### 14.4.3 Push to GitHub Repository
- [ ] If no Git provider is configured:
  - [ ] Click the **Link GitHub Repository** button.
  - [ ] **Expected**: Frontend redirects you directly to the workspace settings page configuration panel.
- [ ] If a Git provider is configured:
  - [ ] Click the **Push to <repoName>** button.
  - [ ] **Expected**: The job status updates sequentially indicating compilation, git sync packaging, and successful upload: `✓ Codebase compiled and pushed to Git repo successfully!`.

---

## 15. WebSocket Real-Time Stream

### 15.1 Connection Verification

```javascript
// Open browser DevTools → Console
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('Connected:', socket.id));
```
- [ ] `connect` event fires immediately
- [ ] No errors in console

### 15.2 Global Connections Count

```javascript
socket.on('global-connections', (count) => console.log('Active sockets:', count));
```
- [ ] **Expected**: Fires immediately with current connection count (e.g. `1`)
- [ ] Open a second tab → counter increments
- [ ] Close the second tab → counter decrements

### 15.3 Global Metrics Stream

```javascript
socket.on('global-metrics', (data) => console.log('Metric:', data));
```
- [ ] Make a gateway call (Section 12)
- [ ] **Expected**: A `global-metrics` event fires with `{ latency, status, route, ... }` within seconds

### 15.4 Landing Page Live Data

- [ ] Navigate to `http://localhost:3000`
- [ ] Open DevTools → Network → WS tab
- [ ] Verify a WebSocket connection is established to `http://localhost:5000`
- [ ] Make a gateway request → observe the bento card bar chart update
- [ ] Active Connections counter should show live count

---

## 16. AI Workflow Generation

**URL**: `http://localhost:3000/projects/[id]/builder`

---

### 16.1 UI Synthesis Action Flow
1. Navigate to the project builder canvas.
2. In the top toolbar, locate and click the **✨ AI SYNTHESIZE** button (which uses a yellow Sparkles icon).
3. **Verify Modal**: The **AI Workflow Synthesizer** modal window should fade into view.
4. **Inspect Button Formatting**:
   - Both the **Cancel** button and the **✨ Synthesize Workflow** button must have a height of `38px` and a border-radius of `8px`.
5. **Add Input**: Inside the prompt textbox, type or copy-paste:
   ```text
   Create a workflow that fetches currency exchange rates from an external public HTTP JSON endpoint and returns the USD rate as the body.
   ```
6. **Submit**: Click the white **✨ Synthesize Workflow** button.
7. **Verify Loading State**:
   - The button should display a loading indicator and change its label to `"Synthesizing..."`.
   - The modal remains visible during prompt execution.
8. **Verify Generation & Canvas Render**:
   - The modal automatically closes on success.
   - A new workflow is created and selected in the active sidebar.
   - **Canvas Verification**:
     - Locate the generated nodes. There should be a `TRIGGER` node, an `httpClientNode` (configured to query an exchange rates API), and a `RESPONSE` node.
     - Verify they are interconnected with blue link arrows in sequence: `TRIGGER` $\rightarrow$ `httpClientNode` $\rightarrow$ `RESPONSE`.
9. **Verify Code Editor Parameters**:
   - Click the generated `httpClientNode`.
   - Verify that its **URL** field contains a valid mock URL (e.g. `https://api.exchangerate-api.com/v4/latest/USD` or similar).
   - Click the `RESPONSE` node.
   - Verify that its **Body** field contains a reference resolving the upstream HTTP request data (e.g., `$steps.node_httpClientNodeId.body`).

---

### 16.2 API Call Verification

```bash
curl -X POST http://localhost:5000/api/ai/generate-workflow \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a workflow that queries users and filters by active status"}'
```
**Expected Response (200 OK)**:
```json
{
  "success": true,
  "workflow": {
    "name": "Query Active Users",
    "path": "/active-users",
    "method": "GET",
    "nodes": [
      { "id": "triggerNode", "type": "triggerNode", "data": { "method": "GET", "path": "/active-users" } },
      { "id": "db_query", "type": "databaseNode", "data": { "query": "SELECT * FROM users WHERE active = true;" } },
      { "id": "response", "type": "responseNode", "data": { "statusCode": 200, "body": "$steps.db_query" } }
    ],
    "edges": [
      { "source": "triggerNode", "target": "db_query" },
      { "source": "db_query", "target": "response" }
    ]
  },
  "message": "Workflow generated successfully by AI"
}
```
- [ ] Response status is 200.
- [ ] Contains a valid JSON object structure with `nodes` and `edges` arrays.

---

### 16.3 Prompt Too Short (Validation Case)
1. Open the AI Synthesize modal.
2. Enter `"test"` (4 characters).
3. Click **✨ Synthesize Workflow**.
4. **Expected**: The frontend shows an error message or fails cleanly, or:
   ```bash
   curl -X POST http://localhost:5000/api/ai/generate-workflow \
     -H "Authorization: Bearer <your-jwt-token>" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test"}'
   ```
   **Expected Response (400 Bad Request)**:
   ```json
   {
     "error": "Bad Request: prompt must be at least 5 characters"
   }
   ```

---

### 16.4 Prompt Too Long (Validation Case)
1. Send a request with a prompt longer than 1000 characters:
   ```bash
   curl -X POST http://localhost:5000/api/ai/generate-workflow \
     -H "Authorization: Bearer <your-jwt-token>" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "<insert 1001 characters here>"}'
   ```
   **Expected Response (400 Bad Request)**:
   ```json
   {
     "error": "Bad Request: prompt must be under 1000 characters"
   }
   ```

---

### 16.5 Request Without Authorization Header
```bash
curl -X POST http://localhost:5000/api/ai/generate-workflow \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a simple API endpoint workflow"}'
```
- **Expected Response (401 Unauthorized)**

---

### 16.6 AI Provider Heartbeat & Fallback
- [ ] Open `.env` file under backend folder. Set `GROQ_API_KEY=""`.
- [ ] Restart backend.
- [ ] Run the prompt synthesis.
- [ ] **Expected**: Backend log output displays fallback initialization statements, attempting connection to Ollama at `http://127.0.0.1:11434`.
- [ ] If Ollama is offline, verification returns an error payload to the client interface cleanly without server crashes.

---

## 17. Security & Edge Cases

### 17.1 Security Headers

```
GET http://localhost:5000/api/health
```
Inspect response headers:
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: no-referrer`
- [ ] `Content-Security-Policy` header present

### 17.2 Invalid JWT Token

```
GET http://localhost:5000/api/auth/me
Authorization: Bearer invalid.token.here
```
- [ ] **Expected**: `401 Unauthorized`

### 17.3 Expired JWT Token

- [ ] Manually forge a token with `exp` in the past (or wait for token TTL)
- [ ] **Expected**: `401 Unauthorized` (token rejected)

### 17.4 SQL Injection Attempt in Body

```
POST http://localhost:5000/api/auth/login
{ "email": "'; DROP TABLE users; --", "password": "any" }
```
- [ ] **Expected**: `400` or `401` — NOT a server error
- [ ] Database is NOT corrupted
- [ ] Server does not crash

### 17.5 Extremely Large Request Body

```
POST http://localhost:5000/api/<projectId>/hello
Content-Type: application/json
Body: <10MB JSON payload>
```
- [ ] **Expected**: `413 Payload Too Large` or graceful rejection
- [ ] Server does NOT crash

### 17.6 Cross-User Project Access

- [ ] User A creates project, gets `projectId`
- [ ] User B tries `PUT /api/projects/:projectId` with User B's token
- [ ] **Expected**: `403` or `404` (not authorized)

---

## 18. Rate Limiting

### 18.1 Auth Endpoint Rate Limit

- [ ] Send 6 login requests in rapid succession (within 1 minute)
- [ ] **Expected**: 6th request returns `429 Too Many Requests`
- [ ] Wait the window period → rate limit resets

### 18.2 Gateway Rate Limiting (Workflow Level)

1. In Gateway Config, set Rate Limit: 3 requests per 10 seconds
2. Send 4 rapid gateway requests

```
GET http://localhost:5000/api/<projectId>/<route>
GET http://localhost:5000/api/<projectId>/<route>
GET http://localhost:5000/api/<projectId>/<route>
GET http://localhost:5000/api/<projectId>/<route>  ← 4th
```
- [ ] First 3: `200`
- [ ] 4th: `429 Too Many Requests`

### 18.3 Rate Limit Reset

- [ ] Wait 10+ seconds
- [ ] Send another request
- [ ] **Expected**: `200` (window reset)

---

## 19. Docs Page

**URL**: `http://localhost:3000/docs`

- [ ] Page loads without errors
- [ ] JBSnap logo in tab title / header
- [ ] Navigation sidebar present with section links
- [ ] All documentation sections render properly (no blank content)
- [ ] Code blocks render with syntax highlighting
- [ ] Internal page anchor links work (jump to sections)

---

## 20. Other Static Pages

### 20.1 About Page

**URL**: `http://localhost:3000/about`

- [ ] Page loads without errors
- [ ] JBSnap logo in page header
- [ ] Content renders properly

### 20.2 Changelog Page

**URL**: `http://localhost:3000/changelog`

- [ ] Page loads without errors
- [ ] Version history entries visible

### 20.3 Contact Page

**URL**: `http://localhost:3000/contact`

- [ ] Page loads without errors
- [ ] Contact form or contact details visible

### 20.4 404 Page

**URL**: `http://localhost:3000/this-page-does-not-exist`

- [ ] **Expected**: Custom 404 page (not blank screen)
- [ ] Link to go back to home/dashboard

---

## ✅ Full Test Completion Checklist

Before declaring the platform ready:

- [ ] All backend endpoints return correct HTTP status codes
- [ ] All frontend pages load without console errors
- [ ] Auth token lifecycle (register → login → use → logout) works
- [ ] Gateway correctly routes to the right workflow node chain
- [ ] Socket.IO delivers real-time updates to the monitor and landing page
- [ ] Export compiles and produces a downloadable ZIP
- [ ] AI generates a valid workflow JSON from a prompt
- [ ] Rate limiting blocks excess requests at both auth and gateway levels
- [ ] Cross-user data access is blocked (authorization isolation)
- [ ] Security headers are present on all API responses
- [ ] All modal buttons have proper height and are not too small
- [ ] All footer links resolve to correct destinations

---

## 21. Dynamic API Testing Sandbox

**URL**: `http://localhost:3000/projects/[id]/builder` → Select any workflow

### 21.1 Canvas Test Button Trigger
- [ ] Click on any active workflow from the **ACTIVE ROUTES** sidebar.
- [ ] Observe the toolbar header next to the **✨ AI SYNTHESIZE** button.
- [ ] **Expected**: A blue **⚡ TEST API** button appears.
- [ ] Click the **⚡ TEST API** button.
- [ ] **Expected**: The **⚡ API Sandbox Test Runner** modal window fades into view with a blurred backdrop.

### 21.2 Warning Banner Validation
- [ ] Select a workflow that is **unpublished** (doesn't have the green `● LIVE` badge on the canvas toolbar).
- [ ] Open the Test Sandbox.
- [ ] **Expected**: A yellow warning banner is visible: `"Workflow is suspended/unpublished. Please click Initialize on the canvas toolbar to publish the route..."`.
- [ ] Close the sandbox, click **Initialize** (button changes to **SUSPEND** and shows `● LIVE`).
- [ ] Open the Test Sandbox again.
- [ ] **Expected**: The yellow warning banner is no longer visible.

### 21.3 Dynamic Gateway Request Execution
1. Select a published workflow (e.g. `/products` GET).
2. Open the Test Sandbox.
3. Observe the Request Parameters panel:
   - Displays correct method (e.g. `GET`) and relative gateway path (e.g., `/api/[projectId]/products`).
4. **Query Params**: Enter `?limit=1` in the Query Params input.
5. **Headers**: Enter standard JSON headers (e.g. `{"Content-Type": "application/json"}`).
6. Click **Execute Gateway Request**.
7. **Expected**:
   - The button enters a loading state displaying `Executing Request...` with a loading spinner.
   - The sandbox executes the query directly against the live Fastify gateway endpoint.
   - The **RESPONSE CONSOLE** updates displaying:
     - `STATUS: 200 OK` (Green badge)
     - `LATENCY: <duration> ms` (Amber badge)
     - `RESPONSE BODY (JSON)` showing the returned JSON array (e.g. list of products).
8. Close the sandbox.

---

## 🐛 Common Issues & Fixes

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Backend won't start | Missing `.env` variables | Copy `.env.example` and fill values |
| `401` on all API calls | Token missing or wrong format | Re-login, check `ff_token` in localStorage |
| Gateway returns `404` for published workflow | Cache stale | Restart backend (cache is in-memory) |
| Export job stuck in `waiting` | Redis offline + Mock Queue issue | Check backend log for `Mock Queue` confirmation |
| AI returns `500` | No GROQ key + Ollama offline | Set a valid `GROQ_API_KEY` in `.env` |
| Socket.IO not connecting | CORS blocked | Ensure `FRONTEND_URL` in `.env` matches port 3000 |
| `429` immediately on login | Rate limit window still active | Wait 60 seconds and retry |
| Stats on landing page are zeros | Backend offline / DB empty | Run seed: `npx prisma db seed` in `backend/` |
