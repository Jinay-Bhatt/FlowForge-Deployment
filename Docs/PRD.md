# Product Requirements Document (PRD) - JBSnap

## 1. Document Overview
This document specifies the Product Requirements for **JBSnap**, an open visual backend development platform and gateway. It provides product context, core objectives, user personas, high-level features, and scope management.

---

## 2. Product Vision & Objectives
Traditional visual backend builders lock developers into their ecosystem by executing logic on proprietary runtimes. When a project outgrows the platform, developers face high migration costs and rewrite overhead.

**JBSnap** solves this vendor lock-in by acting as both a visual designer and an **application compiler**. It empowers developers to build APIs visually while retaining full code ownership through standard, deployable TypeScript code export.

### Core Objectives
* **API Assembly Speed**: Allow developers to visually construct standard REST endpoints in under 2 minutes.
* **Code Ownership**: Provide a one-click ZIP download and git repository push containing a standard, production-ready Fastify and Prisma application.
* **Extensibility**: Support custom JavaScript logic blocks without losing visual flow readability.
* **Gateway Reliability**: Provide an execution engine with sub-200ms latency, built-in JWT authentication, rate limiting, and real-time monitoring.

---

## 3. User Personas & Scenarios

### Persona A: The Indie Hacker (Alex)
* **Goal**: Build and validate a SaaS prototype in days.
* **Pain Point**: Setup time for routes, auth, database mapping, and environment configs slows validation.
* **Scenario**: Alex uses JBSnap to drag and drop database CRUD nodes, secures them with JWT, tests them inside the editor, and exports a code package to push to a private GitHub repo for hosting on Vercel/Render.

### Persona B: The Frontend Developer (Sarah)
* **Goal**: Focus on user experiences without writing custom Node/Prisma boilerplate.
* **Pain Point**: Relying on mock endpoints or coordinating with backend teams for simple CRUD features.
* **Scenario**: Sarah visually models the database schema and defines endpoints using the canvas. She writes custom JavaScript in code nodes to shape output formats, then deploys to JBSnap's managed runtime instantly.

---

## 4. Feature Scope

### 4.1 In Scope (MVP)

#### A. Visual API Builder Canvas
* Drag-and-drop workspace using React Flow.
* Supported Node Types:
  * **Trigger Nodes**: HTTP Request (Method, Path).
  * **Logic Nodes**: If/Else conditionals.
  * **Database Nodes**: PostgreSQL CRUD operations.
  * **Security Nodes**: JWT authentication checks and API Key verification.
  * **Custom Code Nodes**: Inline JavaScript code editor with input-output port mappings.
  * **Response Nodes**: Success (200 OK) or Error responses with body configurations.

#### B. Managed Dynamic Runtime Engine
* Centralized API Gateway routing requests dynamically matching `/api/:projectId/:endpointPath`.
* Dynamic execution of workflow JSON definitions sequentially.
* Secure execution of JavaScript code snippets inside custom logic nodes.
* Real-time metrics streaming (latency, error rate, throughput) to dashboard via WebSockets.

#### C. Code Export Engine
* Single-click code compiler compiling workflow graphs into a clean Node.js + Fastify + TypeScript project.
* Production configs generated: `Dockerfile`, `docker-compose.yml`, `prisma/schema.prisma`, and `.env.example`.
* Automatic generation of OpenAPI (Swagger) specifications mapping the endpoints.

#### D. Git & Collaboration Sync
* GitHub authentication (OAuth) linking user projects to repositories.
* One-click commit and push from visual workspace to remote branch.
* Version tracking and visual rollback to previous saves.

#### E. Native API Testing Tool
* Built-in client (similar to Postman) inside the visual builder to execute mock/published requests with custom headers, query params, and bodies.

---

### 4.2 Out of Scope (Future Roadmap)
* **Service Mesh Visualization**: Visualizing complex microservice dependency graphs.
* **Internal Service Registration & Routing**: Mapping external microservices on the gateway (focus remains on generated apps).
* **Multi-tenant Database Provisioning**: Automatic database creation per tenant (users bring their own PostgreSQL strings).
* **Automatic UI Generation**: Generating frontend pages from backend models.

---

## 5. Non-Functional Requirements

### 5.1 Performance
* **Runtime Latency**: Workflow engine request processing overhead must be under 50ms (excluding database query time). Total gateway roundtrip target is under 200ms.
* **Workspace Updates**: React Flow drag and layout sync times must be under 100ms.
* **Export Compilation**: Code generation and ZIP file packaging must complete in under 5 seconds.

### 5.2 Security
* **Sandbox Isolation**: Executing custom JavaScript code in the managed runner must not leak system credentials, block the main event loop, or allow access to files outside the VM.
* **Authentication**: Enforce HTTPS, hash user credentials with bcrypt, and protect gateway configurations using signed JWT tokens.

### 5.3 Reliability
* **Graceful Degradation**: If the WebSocket metrics server crashes, visual canvas saving and API gateway endpoints must remain fully operational.

---

## 6. Success Metrics
* **Time to Live API**: Users can deploy a secure, database-connected endpoint in under 3 minutes.
* **Code Cleanliness Index**: Exported code passes standard lint rules (`eslint:recommended`, `typescript-eslint`) with 0 warnings.
* **Platform Availability**: Managed runner maintains 99.9% uptime during load spikes.
