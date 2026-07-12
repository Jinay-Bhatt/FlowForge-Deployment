# Software Requirements Specification (SRS) - FlowForge

## 1. Introduction

### 1.1 Purpose
This document details the Software Requirements Specification (SRS) for the **FlowForge** platform. It outlines functional, data, interface, and performance specifications for developers, engineers, and QA teams.

### 1.2 System Scope
FlowForge consists of a Next.js visual frontend client, a Fastify backend server running a workflow compiler/runner, and a PostgreSQL database. It targets API building, gateway management, and standardized Node.js/TypeScript code compilation.

---

## 2. Functional Requirements Reference

### 2.1 User Management & Security
* **FR-1 Registration**: Allow users to register with an email, username, and password.
* **FR-2 Login**: Authenticate credentials and return signed JWT tokens.
* **FR-3 Authorization**: Enforce JWT checks on all administrative endpoints `/api/projects/*`, `/api/workflows/*`, and `/api/git/*`.
* **FR-4 Password Hashing**: Enforce standard secure hashing (bcrypt/argon2) of passwords.

### 2.2 Project & Workflow Management
* **FR-5 Project CRUD**: Create, read, update, list, and delete projects.
* **FR-6 Visual Board Canvas**: State management of node layouts (React Flow compatible JSON).
* **FR-7 Node Definitions**: Maintain distinct schemas and variables configuration for:
  * **HTTP Request**: Method (GET, POST, PUT, DELETE, PATCH), route path (`/items`, `/users/:id`), headers, query parameters, and schema structures.
  * **PostgreSQL Query**: Custom raw queries or SQL helpers (SELECT, INSERT, UPDATE, DELETE) binding outputs of previous steps.
  * **Conditional Logic**: Evaluate expressions and branch flows.
  * **Custom JavaScript**: Rich text editor for writing ES6 JavaScript with input parameters.
  * **JSON Response**: HTTP response status codes, headers, and body definitions.
* **FR-8 Versioning & Rollbacks**: Save snapshots of workflows and allow users to revert to a previous working commit.

### 2.3 Workflow Execution Engine (Managed Runtime)
* **FR-9 Execution Cycle**:
  1. Catch incoming client requests on gateway endpoints.
  2. Parse the DAG execution paths.
  3. Resolve variables across node execution.
  4. Securely run code blocks inside isolated V8 scopes.
  5. Commit data structures to the database.
  6. Return HTTP responses matching configuration.
* **FR-10 Logs & Performance Metrics**: Save execution logs detailing node execution timings, output parameters, and errors to DB.

### 2.4 Code Compiler & Exporter
* **FR-11 TypeScript Generator**: Compile JSON DAG files into typescript project structure:
  * Route registrations conforming to Fastify patterns.
  * Controllers processing query configurations and variables.
  * Prisma client queries replacing visual database blocks.
* **FR-12 Docker Configurations**: Generate a standard multi-stage `Dockerfile` and a `docker-compose.yml` defining services, databases, and variables.
* **FR-13 OpenAPI Spec Generator**: Generate a swagger/openapi compliant specification (`swagger.json`) containing paths, request bodies, parameters, and responses.
* **FR-14 ZIP Packaging**: Archive generated configs and code into a single `backend.zip` file.

### 2.5 Integrations & API Tester
* **FR-15 GitHub/GitLab Connect**: OAuth flow retrieving write-access tokens.
* **FR-16 Push to Repository**: Commit compiles direct to remote branches using GitHub API endpoints.
* **FR-17 Interactive API Tester**: Interactive UI sending custom parameters, query payloads, body structures, and authentication tokens to active API endpoints.

---

## 3. System Interfaces

### 3.1 User Interfaces (UI)
The frontend application requires a Next.js interface structured with the following primary views:
* **Dashboard View**: Grid of active projects, overall performance charts (latencies, errors), and user settings.
* **Workflow Builder Canvas**: Node registry side-panel, infinite-scroll canvas workspace (React Flow), node parameter settings sidebar, dynamic terminal log footer, and deployment control panel.
* **Git Integration Panel**: Configuration of repository names, OAuth link statuses, commit logs, and deploy logs.
* **Built-in API Tester**: Interactive pane to dispatch requests and view raw response payloads, header maps, and execution timelines.

### 3.2 Software Interfaces
* **Database Access**: Prisma ORM interfacing with PostgreSQL.
* **Custom Code Sandbox**: Node.js `vm` or `isolated-vm` engine.
* **OAuth Integrations**: GitHub Developer Applications API.
* **Event Pipeline**: BullMQ running behind Redis to process heavy tasks like project ZIP building and Git commit pushes.
* **Real-time Engine**: Socket.IO streaming active gateway logs directly to the browser builder console.

---

## 4. Key Architectural Constraints

### 4.1 Memory & Sandbox Constraints
* Custom code execution must be constrained to **200ms CPU execution time** and **64MB RAM limit** per run inside the dynamic sandbox engine to prevent loop locks.

### 4.2 Code Generation Structure
* Standard exported app structures must be generated without external custom dependencies. They must run using raw `@fastify/cors`, `@fastify/jwt`, `prisma`, and `dotenv`.
```
exported-project/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── routes/
│   │   └── api.ts
│   ├── index.ts
│   └── types.ts
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## 5. Security Requirements
* **Input Sanitization**: Database SQL queries generated by database nodes must be prepared/parameterized to prevent SQL injection.
* **Access Isolation**: Tenant database credentials must be encrypted in the PostgreSQL database using AES-256-GCM.
* **CORS Policies**: Visual gateway routes must support wildcards or explicit origin configurations set in project settings.
* **Rate Limits**: IP-based rate limiting configurations stored in the gateway config must run before route execution using Fastify plugins or Redis counters.
