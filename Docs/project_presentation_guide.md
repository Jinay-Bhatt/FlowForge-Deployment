# JBSnap Presentation & Onboarding Guide

This document is designed to help you onboard a teammate to the **JBSnap** codebase and explain the system's core concepts, starting from the basic foundations of backend engineering to our custom visual compiler architecture.

---

## 0. Prerequisite Developer Onboarding: What is a Backend & Why JBSnap?

When onboarding a new teammate, start with these conceptual foundations to align on the core mission of the project.

### Concept A: What is a Backend & How is it Normally Built?
* **The Foundation**: A backend is the engine of a web application. It runs on a remote server, connects to a database, runs business logic (validations, calculations), secures access (authentication, rate-limiting), and exposes endpoints (REST, GraphQL) for client apps to consume.
* **The Traditional Process**: To build a backend normally, a developer must:
  1. Boot a server framework (e.g., Node/Express, Fastify, Python/Django).
  2. Write code to handle routes (e.g., `app.post('/register', handler)`).
  3. Write database adapters and connection pools (e.g., Prisma, Knex).
  4. Manually write business logic, error catchers, and validation middleware.
  5. Deploy this code, set up servers, and configure logging tools.

### Concept B: The Pain Points of Traditional Coding (Why JBSnap?)
* **Boilerplate Overload**: Setting up routing, CORS, DB connections, and JWT validation is repetitive and time-consuming.
* **Syntax & Integration Errors**: A developer can spend hours debugging a misplaced bracket, type mismatch, or database connection timeout.
* **Slow Feedback Loops**: Modifying an API route requires rewriting code, waiting for build systems, restarting servers, and testing via external clients (like Postman).
* **Vendor Lock-in of Low-Code**: Visual tools like Make.com, Zapier, or Retool let you build fast but lock you into their hosting platforms. You cannot download your code, meaning you are stuck paying their monthly subscription fees forever.

### Concept C: How JBSnap Changes the Game (The Paradigm Shift)
JBSnap introduces a hybrid low-code approach that operates differently from normal coding:

| Feature | Traditional Coding | JBSnap Visual Builder |
| :--- | :--- | :--- |
| **Development Speed** | Slow; writing files, importing modules, config setups. | Fast; dragging nodes, selecting HTTP triggers, writing quick SQL lines. |
| **Logic Construction** | Abstract text files (nested loops, file exports). | Visual DAG (Directed Acyclic Graph) showing data pathways step-by-step. |
| **Testing Feedback** | Requires server hot-reloading and external Postman setups. | Instant; built-in API tester running queries on the live gateway sandbox. |
| **Deployment Execution** | Cloud deployment files, Docker configurations. | Auto-compiled to standalone production-ready code with **zero vendor lock-in**. |
| **Safety / Security** | Developer must manually sanitize SQL, handle rate limits. | Built-in prepared SQL parameterization, sandbox VM locks, and automatic rate-limiting. |

---

## 1. The Elevator Pitch (The "Why")

### The Problem
* Building a backend usually requires writing repetitive boilerplate code (routers, rate-limiters, DB connection pooling, validations).
* Existing No-Code / Low-Code API builders are often "black boxes"—they lock your data in, make custom coding hard, and don't allow you to download or own your actual code.

### The JBSnap Solution
* **JBSnap** is a hybrid visual node-based API developer orchestrator. 
* It allows developers to build backend routing pipelines visually, test them in real-time on a hot gateway sandbox, inspect execution live over WebSockets, and then **export a 100% standalone, compiled production Node.js/Fastify server codebase** (via ZIP download or direct GitHub push).
* It bridges the speed of visual builders with the flexibility and control of manual coding.

---

## 2. System Architecture & Tech Stack

Explain the project as a modern decoupled system separated into four core layers:

```
┌────────────────────────────────────────────────────────┐
│               Frontend visual Console                  │
│   Next.js 16 (SPA) • @xyflow/react • SVG Dashboards   │
└─────────────────────────┬──────────────────────────────┘
                          │ (REST HTTP / JWT / Websockets)
                          ▼
┌────────────────────────────────────────────────────────┐
│                 Backend API Gateway                    │
│      Fastify Server (Port 5000) • Socket.IO            │
└───────┬─────────────────────────┬──────────────────────┘
        │                         │
        ▼                         ▼
┌──────────────┐         ┌───────────────────────────────┐
│ Database     │         │ Exporter Code Compiler        │
│ Neon Postgres│         │ BullMQ Queue • Redis          │
│ (Prisma 7)   │         │ AST Transpilation Engine      │
└──────────────┘         └──────────────┬────────────────┘
                                        │
                                        ▼
                                 [Standalone Code]
                              (ZIP / GitHub Commits)
```

### The Tech Stack
* **Frontend**: Next.js 16, React 19 (using strict `'use client'` hydration wraps), Tailwind CSS (glassmorphism theme), `@xyflow/react` (interactive node canvas), and Socket.IO-client.
* **Backend**: Fastify (lightweight HTTP server), `@fastify/jwt` (authentication), `@fastify/cors` (access control), and Socket.IO (live metrics).
* **Database**: Neon Serverless PostgreSQL, queried via the new Prisma 7 client utilizing native serverless connection pooling drivers.
* **Background Processing**: Redis Server, BullMQ (distributed job queues), `archiver` (zipping), and Octokit Rest API (GitHub integrations).

---

## 3. Five Core Technical Highlight Features

When presenting, focus on these five advanced engineering components:

### ① Kahn's Topological Sort DAG Engine
* **How it works**: When a request hits the gateway, the server retrieves the visual node graph and compiles the visual connections. It runs a topological sort (Kahn's Algorithm) to order nodes linearly based on dependencies while detecting circular references.
* **Talking Point**: *"The engine automatically understands that data must flow from the HTTP Trigger, to the Database Query, to the Custom Script, and finally to the JSON Response, blocking loop exploits immediately."*
* **Core File**: [src/services/dag.ts](file:///c:/Users/jinay/OneDrive/Desktop/Backend-api/src/services/dag.ts)

### ② Secure V8 VM Sandbox Execution
* **How it works**: Custom JavaScript scripts entered by the developer run inside isolated Node `node:vm` Script context runs.
* **Talking Point**: *"We isolate variables by deep-copying data. To prevent system hijacking, global objects like `process`, `require`, and `module` are completely purged from the scope. We also enforce a strict CPU time execution limit of 200ms to block event-loop locking and DDOS attacks."*
* **Core File**: [src/services/sandbox.ts](file:///c:/Users/jinay/OneDrive/Desktop/Backend-api/src/services/sandbox.ts)

### ③ Parameterized SQL Query Compiler
* **How it works**: The system parses user database queries and extracts context template inputs (e.g. `$request.body.name` or `$steps.code_node_id.price`).
* **Talking Point**: *"To secure visual databases against SQL Injection, the compiler automatically converts user templates into standard SQL prepared variables ($1, $2) and passes raw parameter arrays directly to Prisma's query adapters."*
* **Core File**: [src/services/dag.ts](file:///c:/Users/jinay/OneDrive/Desktop/Backend-api/src/services/dag.ts)

### ④ Background AST Exporter Queue
* **How it works**: The exporter compiles the visual graph JSON mappings into a physical file structure (routers, controller loops, sandbox VMs, configurations). It uses Redis and BullMQ queues to handle compiling in a separate worker process so the main server thread never blocks.
* **Talking Point**: *"The export isn't configuration meta-data. It is clean, standalone Fastify code. Developers can download a ZIP of their server or sync it directly to GitHub, letting them bypass vendor lock-in."*
* **Core File**: [src/services/compiler.ts](file:///c:/Users/jinay/OneDrive/Desktop/Backend-api/src/services/compiler.ts) and [src/queue/worker.ts](file:///c:/Users/jinay/OneDrive/Desktop/Backend-api/src/queue/worker.ts)

### ⑤ Real-Time WebSocket Metrics Streaming
* **How it works**: The gateway registers hooks during runtime execution. When a route executes, a metric broadcast is emitted over Socket.IO to the frontend client subscribed to the specific project room.
* **Talking Point**: *"Visual developer consoles receive live performance statistics (throughput, latencies, HTTP statuses) in a custom terminal log stream as they execute testing requests."*
* **Core File**: [src/websocket.ts](file:///c:/Users/jinay/OneDrive/Desktop/Backend-api/src/websocket.ts) and [src/routes/gateway.ts](file:///c:/Users/jinay/OneDrive/Desktop/Backend-api/src/routes/gateway.ts)

---

## 4. Database Schema Mappings ([schema.prisma](file:///c:/Users/jinay/OneDrive/Desktop/Backend-api/prisma/schema.prisma))

Explain how data structures map in Prisma:

* **`User`**: Developer account credentials and password hashes.
* **`Project`**: Scope container (grouping APIs, gateways, and configurations).
* **`Workflow`**: Stores visual graph metadata, holding the serialized representation of React Flow `nodes` and `edges` as JSON arrays.
* **`WorkflowVersion`**: Backs up read-only snapshots of nodes/edges configurations whenever a change is made.
* **`GitConfiguration`**: Stores encrypted GitHub access credentials (encrypted via AES-256-GCM in [crypto.ts](file:///c:/Users/jinay/OneDrive/Desktop/Backend-api/src/services/crypto.ts)) and repository paths.
* **`ExecutionLog`**: Gateway execution logs (stores request methods, paths, status codes, and execution latencies in ms).

---

## 5. Live Demo Script (Step-by-Step Walkthrough)

Use this script to demo the system to others:

### Step 1: Login & Dashboard Overview
1. Open the console at `http://localhost:3000`.
2. Enter the pre-seeded credentials:
   * **Email**: `test@jbsnap.com`
   * **Password**: `password123`
3. Point out the dashboard design: *"Here we have the E-Commerce Core API Gateway project selected. Below, you can see our historical request charts rendered using custom SVG paths, and a list of our active published gateway endpoints."*

### Step 2: The Visual Editor Canvas
1. Click the **Visual Canvas** tab.
2. Select the **Checkout Process** (POST `/checkout`) workflow on the left sidebar.
3. Show the React Flow layout: *"This represents our live execution pipeline. Let's inspect the nodes:"*
   * Click on the **HTTP Request Trigger** node: *"It listens for POST requests at /checkout."*
   * Click on the **PostgreSQL Query** node: *"It runs a SQL query looking up items. Notice the parameters template: `$request.body.itemName`."*
   * Click on the **Custom JS Sandbox** node: *"It runs Javascript logic to check stock levels and calculate prices. The process object is completely blocked here for security."*
   * Click on the **JSON Response** node: *"It returns status 200, referencing the JS node calculations pointer (`$steps.node_code`)."*

### Step 3: Interactive Endpoint Testing
1. Click the **API Tester** tab.
2. Select **Checkout Process** (POST `/checkout`).
3. Set the request body to buy an iPhone 15 Pro:
   ```json
   {
     "itemName": "iPhone 15 Pro",
     "quantity": 2
   }
   ```
4. Click **Send**! Show the response payload returning the total price calculations.
5. Next, test the inventory validation error. Change `quantity` to `200` (above the pre-seeded stock of 100). Click **Send**! Show the V8 sandbox returning the clean logic error: `"Insufficient inventory"`.

### Step 4: Real-Time Log Streaming
1. Point to the **Traffic Inspector** terminal log panel at the bottom of the screen.
2. Show the rolling lines: *"Every time I sent a request in the API Tester, the gateway broadcasted the metrics. We see the POST requests, the status codes (200, 500), and execution latencies in real-time."*

### Step 5: Git Deployment & Code Compilation
1. Click the **Git Deploy** tab.
2. Show the **GitHub Configuration**: *"We can connect a remote GitHub repo. The access token is fully encrypted in the Postgres database."*
3. Click **Run Build Compilation**:
   * Scroll through the compiler logs rolling live.
   * Once completed, click **Download Compiled ZIP Package**.
4. Open the downloaded ZIP file to show them: *"Look at the output. This is not a locked configuration file. It is a clean, standard Node.js server with routes, models, and controllers generated from our visual nodes, ready to run on any cloud platform!"*
