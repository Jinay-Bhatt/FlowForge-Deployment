# Prerequisite Backend Guide: Understanding the System

This guide outlines the core concepts of backend development, web architecture, and directory patterns. It is designed to prepare you for building, reviewing, and understanding the **FlowForge** platform code.

---

## 1. Core Backend Concepts

### 1.1 What is a Backend?
While the frontend (Client) is the interface that users see and interact with (buttons, text, styles), the **Backend (Server)** is the engine behind the scenes. It handles:
* **Business Logic**: Calculations, authorization, data validation, and workflows.
* **Data Storage**: Communicating with databases to save, edit, or delete records.
* **Integrations**: Communicating with third-party APIs (like GitHub, Stripe, or email services).
* **Security**: Enforcing user authentication (logging in) and resource access policies.

### 1.2 The Client-Server Model
Web applications run on a **Request-Response cycle**:

```
 ┌──────────────┐                  HTTP Request                  ┌──────────────┐
 │    Client    ├───────────────────────────────────────────────►│    Server    │
 │  (Browser)   │◄───────────────────────────────────────────────┤ (Fastify App)│
 └──────────────┘                  HTTP Response                 └──────┬───────┘
                                                                        │ Read/Write
                                                                        ▼
                                                                 ┌──────────────┐
                                                                 │   Database   │
                                                                 │ (PostgreSQL) │
                                                                 └──────────────┘
```

1. **Client sends a Request**: When you click a button or fetch data, the client sends an HTTP request containing a URL, method, headers, and optional payload.
2. **Server processes the request**: The server intercepts the request, runs authentication checks, processes database queries, executes logic, and prepares the output.
3. **Server sends a Response**: The server returns an HTTP response consisting of a status code (e.g. `200 OK`) and a data payload (usually formatted as JSON).

---

## 2. HTTP and REST API Basics

An API (Application Programming Interface) is a set of rules that allows software systems to talk to each other. FlowForge compiles visually designed workflows into standard **REST (Representational State Transfer) APIs**.

### 2.1 HTTP Methods (Verbs)
HTTP requests use specific verbs to state their intent:
* **`GET`**: Retrieve data from the server (e.g. fetch a list of users). Should never modify state.
* **`POST`**: Submit new data to the server (e.g. register a user or create an invoice).
* **`PUT`**: Replace an existing resource completely with new data.
* **`PATCH`**: Make partial updates to an existing resource (e.g. change just a user's email).
* **`DELETE`**: Remove a resource from the server.

### 2.2 HTTP Status Codes
The server uses 3-digit status codes to inform the client of the outcome:
* **`200 OK`**: Request succeeded, returning payload.
* **`201 Created`**: Request succeeded and a new resource was created (commonly returned by `POST` routes).
* **`400 Bad Request`**: Client input is invalid (e.g., missing a required form field).
* **`401 Unauthorized`**: Authentication is missing or invalid (e.g., expired log-in token).
* **`403 Forbidden`**: Authenticated user lacks permission to access the resource.
* **`404 Not Found`**: The requested URL path does not exist.
* **`429 Too Many Requests`**: Client rate limit exceeded.
* **`500 Internal Server Error`**: Server-side error (bug, database failure, unhandled crash).

### 2.3 Anatomy of an HTTP Exchange
```http
-- REQUEST --
POST /api/products HTTP/1.1
Host: api.flowforge.com
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "name": "Mechanical Keyboard",
  "price": 120
}

-- RESPONSE --
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "e305e94b-483a-44fe-a28a-4c28fe95a49a",
  "name": "Mechanical Keyboard",
  "price": 120,
  "createdAt": "2026-06-14T02:00:00.000Z"
}
```

---

## 3. Tech Stack Deep-Dive: Node.js, Fastify & TypeScript

### 3.1 Node.js
Historically, JavaScript could only run inside web browsers (like Chrome or Safari). Node.js is a runtime that lets us run JavaScript code on our servers.
* **Asynchronous & Non-Blocking**: Node.js does not block operations while waiting for slow queries (like database lookups or file reads). Instead, it schedules them and processes other incoming requests, making it highly scalable for APIs.

### 3.2 Fastify
Fastify is a web framework for Node.js (similar to Express, but much faster and written with modern architecture).
* **Why Fastify?** It features ultra-low overhead, built-in support for TypeScript, automatic schema-based response serialization (which accelerates JSON formatting), and a clean plugin ecosystem.

### 3.3 TypeScript
JavaScript is dynamically typed, meaning a variable can hold a string, then a number, then an object, which often leads to runtime bugs.
* **TypeScript** is a typed superset of JavaScript. It enforces type-checking at write-time (e.g. declaring that a parameter *must* be a string).
* **Compilation**: Node.js cannot run TypeScript directly. During build, TypeScript is compiled into standard JavaScript (`.js` files) that Node.js executes.

---

## 4. Databases and ORMs (Prisma)

### 4.1 SQL Relational Databases (PostgreSQL)
PostgreSQL stores data in structured tables consisting of rows and columns.
* **Primary Key (PK)**: A unique identifier for a row (e.g., user ID).
* **Foreign Key (FK)**: A link establishing a relation between tables (e.g., `projectId` in the Workflows table links to the `id` of the Projects table).
* **Indexes**: Specialized data structures created on columns (like route paths) to speed up database search queries.

### 4.2 What is an ORM (Prisma)?
Normally, developers communicate with databases using raw SQL strings:
```sql
SELECT * FROM "Workflow" WHERE "projectId" = '123-abc';
```
An **ORM (Object-Relational Mapping)** maps database tables directly to object-oriented code objects. Instead of raw SQL, we use helper methods:
```typescript
const workflows = await prisma.workflow.findMany({
  where: { projectId: '123-abc' }
});
```

### 4.3 Database Migrations: Why do we need them?
As your application grows, your database structure changes (e.g., adding a `requireJwt` column to a table).
* A **Migration** is an incremental SQL script that modifies the live database schema safely.
* ORMs like Prisma auto-generate these scripts to ensure your local database, production database, and codebase models are identical.

---

## 5. Standard Backend Repository Architecture

To keep backends clean, reusable, and easy to maintain, we divide the codebase into folders with single responsibilities. Here is a breakdown of the standard structure that FlowForge builds and exports:

```
src/
├── config/             # Environment variables and configurations
├── middlewares/        # Security, validation, and global hooks
├── routes/             # URL path endpoints and route switches
├── controllers/        # Business logic controllers
├── services/           # External API integrations and engine components
├── types/              # Reusable TypeScript type definitions
├── prisma/             # Database schemas and migration files
└── index.ts            # Entrypoint file that bootstraps the server
```

### 5.1 Directory Purposes

#### `src/index.ts` (The Entrypoint)
* **Purpose**: Instantiates the Fastify server instance, connects to the PostgreSQL database via Prisma, registers global plugins (CORS, JWT, Rate Limiting), registers the routes, and binds the server to a network port (e.g., `localhost:3000`).

#### `src/config/` (Config and Env)
* **Purpose**: Loads and parses `.env` files (e.g. database URLs, secrets) using validation schemas to ensure the application fails immediately if critical configuration variables are missing.

#### `src/middlewares/` (Hooks/Guards)
* **Purpose**: Executes *before* the request reaches the main database logic. Middlewares handle gatekeeping:
  * Checking if the request contains a valid JWT token.
  * Checking if the IP is making too many requests (rate limiting).
  * Validating that the request body shape is correct.

#### `src/routes/` (URL Routing)
* **Purpose**: Connects URL paths to code controllers.
  * E.g., tells the application that a `GET /api/products` request should trigger the `listProducts` function inside the products controller.

#### `src/controllers/` (Business Logic Handlers)
* **Purpose**: The "brain" of the endpoints. Controllers extract inputs from request bodies, URL params, or headers, execute calculations, request database tables via Prisma, and return HTTP payloads.

#### `src/services/` (Core Tools / External APIs)
* **Purpose**: Houses standalone tools that are not tied directly to HTTP routing. E.g., the sandbox script VM executor, or the GitHub OAuth committing client.

---

## 6. How Data Flows Through the Codebase

Let's look at the lifecycle of a request (`GET /api/project1/products`) as it travels through our directories:

```
[ Client Request ]
       │ (Sends GET /api/project1/products)
       ▼
[ src/index.ts ] ──► (Server catches request, routes it)
       │
       ▼
[ src/middlewares/auth.ts ] ──► (Validates Bearer token headers)
       │ (Success)
       ▼
[ src/routes/products.ts ] ──► (Matches path and forwards to controller)
       │
       ▼
[ src/controllers/products.ts ] ──► (Main function runs)
       │
       ├─► Calls [ Prisma client ] ──► [ PostgreSQL ] (Fetches product list)
       │                                     │
       │◄── Returns rows ◄───────────────────┘
       │
       ▼
[ Controller formats JSON ] ──► Sends `reply.code(200).send(data)`
       │
       ▼
[ Client Response ]
```

---

## 7. Custom Platform Prerequisites (FlowForge Specific)

### 7.1 Visual JSON Graphs to Code Compiler
In FlowForge, users do not write code directly; they connect visual block nodes. The frontend translates these boxes into JSON:
```json
{
  "id": "node-db",
  "type": "databaseNode",
  "data": { "query": "SELECT * FROM users" }
}
```
The **Compiler Engine** acts as a translator. It takes this visual JSON data structure, determines the execution order, and generates actual TypeScript text containing loops, database client calls, and routes.

### 7.2 Sandboxing
A **Sandbox** is an isolated runtime box. FlowForge uses sandboxing to execute user-written JavaScript inside dynamic workflows without risking server compromise, credential leaking, or infinite CPU-locking loops.
