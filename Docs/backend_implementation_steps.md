# JBSnap Backend Implementation Guide

This guide provides a comprehensive, step-by-step roadmap to build the **JBSnap** backend server from scratch using Node.js, Fastify, TypeScript, Prisma, and BullMQ. 

---

## Technical Stack Overview
- **Runtime**: Node.js v22+ (Alpine for Docker production runtime)
- **Web Framework**: Fastify (low-overhead routing and schema serialization)
- **ORM & Database**: Prisma with PostgreSQL
- **Task Queue**: BullMQ (with Redis) for async compilation & GitHub sync jobs
- **Security & Sandbox**: `node:vm` for custom code sandboxing, `@fastify/jwt` for auth
- **Real-Time Communication**: Socket.io or Fastify WebSockets for dashboard metrics

---

## Folder Structure setup
Ensure your server follows a separation of concerns structure:
```text
backend/
├── Docs/                  # Project specifications and guides
├── prisma/                # Prisma schema definition and migration files
│   └── schema.prisma
├── src/
│   ├── config/            # Environment variable validation & global configs
│   ├── controllers/       # Business logic handlers (auth, projects, workflows)
│   ├── middlewares/       # JWT auth guards, rate limiters, validation hooks
│   ├── queue/             # BullMQ task queues, jobs, and worker registrations
│   ├── routes/            # REST and wildcard gateway endpoints mapping
│   ├── services/          # Core utilities (Sandbox VM, Graph Compiler, Git Sync)
│   ├── types/             # Reusable TypeScript typings
│   ├── index.ts           # Bootstrapping script (Fastify configuration)
│   └── websocket.ts       # Socket.io connection and metrics stream setup
├── tsconfig.json          # TypeScript compiler configurations
├── package.json
└── .env
```

---

## Step-by-Step Implementation Roadmap

### Phase 1: Environment & Project Setup
1. **Initialize Project Configs**:
   Ensure `package.json` specifies `"type": "module"`. Update `tsconfig.json` to target `ES2022` or `ESNext` and configure paths.
2. **Install Dependencies**:
   ```bash
   npm install fastify @fastify/cors @fastify/jwt @prisma/client archiver bullmq dotenv socket.io bcryptjs dotenv
   npm install -D typescript @types/node @types/archiver @types/bcryptjs prisma tsx
   ```
3. **Configure Environment Variables (`.env`)**:
   Add database URLs, JWT keys, and server configurations:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:password@localhost:5432/jbsnap?schema=public"
   REDIS_URL="redis://127.0.0.1:6379"
   JWT_SECRET="your-super-secret-jwt-key"
   ENCRYPTION_KEY="32-byte-hex-string-for-credentials"
   ```

---

### Phase 2: Database Schema & Prisma Configuration
1. **Initialize Prisma**:
   ```bash
   npx prisma init
   ```
2. **Define Database Entities (`prisma/schema.prisma`)**:
   Copy and format the models according to the system specification:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   generator client {
     provider = "prisma-client-js"
   }

   model User {
     id           String             @id @default(uuid())
     username     String
     email        String             @unique
     passwordHash String
     createdAt    DateTime           @default(now())
     updatedAt    DateTime           @updatedAt
     projects     Project[]
     gitConfigs   GitConfiguration[]
   }

   model Project {
     id          String     @id @default(uuid())
     name        String
     description String?
     ownerId     String
     owner       User       @relation(fields: [ownerId], references: [id], onDelete: Cascade)
     workflows   Workflow[]
     createdAt   DateTime   @default(now())
     updatedAt   DateTime   @updatedAt
   }

   model Workflow {
     id          String            @id @default(uuid())
     name        String
     path        String
     method      String            // GET, POST, PUT, DELETE, PATCH
     nodes       Json              // Serialized state of React Flow nodes
     edges       Json              // Serialized state of React Flow edges
     isPublished Boolean           @default(false)
     projectId   String
     project     Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
     versions    WorkflowVersion[]
     logs        ExecutionLog[]
     gatewayConfig GatewayConfig?
     createdAt   DateTime          @default(now())
     updatedAt   DateTime          @updatedAt

     @@unique([projectId, path, method])
   }

   model WorkflowVersion {
     id            String   @id @default(uuid())
     workflowId    String
     workflow      Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
     versionNumber Int
     nodes         Json
     edges         Json
     changelog     String?
     createdAt     DateTime @default(now())
   }

   model GitConfiguration {
     id             String   @id @default(uuid())
     userId         String
     user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     provider       String   // GITHUB, GITLAB
     accessToken    String   // Encrypted
     refreshToken   String?  // Encrypted
     repositoryName String
     repositoryUrl  String
     isActive       Boolean  @default(true)
     createdAt      DateTime @default(now())
     updatedAt      DateTime @updatedAt
   }

   model GatewayConfig {
     id               String   @id @default(uuid())
     workflowId       String   @unique
     workflow         Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
     requireJwt       Boolean  @default(false)
     jwtSecret        String?  // Encrypted
     rateLimitLimit   Int?
     rateLimitWindow  Int?
     updatedAt        DateTime @updatedAt
   }

   model ExecutionLog {
     id             String   @id @default(uuid())
     workflowId     String
     workflow       Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
     method         String
     path           String
     responseStatus Int
     latencyMs      Int
     errorDetails   String?
     requestPayload Json?
     createdAt      DateTime @default(now())
   }
   ```
3. **Execute Prisma Migrations**:
   Generate SQL migrations and sync your database:
   ```bash
   npx prisma migrate dev --name init
   ```

---

### Phase 3: Global Middlewares & Server Entrypoint
1. **Initialize Fastify Server (`src/index.ts`)**:
   Bootstrap the framework, plugins (CORS, JWT), and database clients:
   ```typescript
   import Fastify from 'fastify';
   import cors from '@fastify/cors';
   import jwt from '@fastify/jwt';
   import { PrismaClient } from '@prisma/client';
   import dotenv from 'dotenv';
   import { registerRoutes } from './routes/index.js';

   dotenv.config();

   export const prisma = new PrismaClient();
   const fastify = Fastify({ logger: true });

   // Register CORS
   await fastify.register(cors, { origin: true });

   // Register JWT Auth
   await fastify.register(jwt, {
     secret: process.env.JWT_SECRET || 'fallback-secret-key',
   });

   // Register Application Routes
   await fastify.register(registerRoutes);

   const start = async () => {
     try {
       await prisma.$connect();
       const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
       await fastify.listen({ port, host: '0.0.0.0' });
       console.log(`🚀 JBSnap server active on port ${port}`);
     } catch (err) {
       fastify.log.error(err);
       process.exit(1);
     }
   };

   start();
   ```
2. **Define JWT Authentication Guard (`src/middlewares/auth.ts`)**:
   Add a pre-handler hook that ensures API endpoints are secured:
   ```typescript
   import { FastifyRequest, FastifyReply } from 'fastify';

   export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
     try {
       await request.jwtVerify();
     } catch (err) {
       reply.status(401).send({ error: 'Unauthorized: Invalid token' });
     }
   }
   ```

---

### Phase 4: Dynamic API Gateway & Sandboxed Runner
The core execution engine is a Fastify wildcard handler capturing `/api/:projectId/*` which resolves published visual JSON graphs, parses routes dynamically, executes steps sequentially, and sends results back.

1. **Implement Secure VM Execution Sandbox (`src/services/sandbox.ts`)**:
   Use `node:vm` to safely run JS instructions without server compromise:
   ```typescript
   import vm from 'node:vm';

   export interface SandboxResult {
     success: boolean;
     data: any;
     error?: string;
   }

   export function runInSandbox(code: string, contextData: any, timeoutMs = 200): SandboxResult {
     try {
       const sandbox = {
         context: JSON.parse(JSON.stringify(contextData)),
         result: {},
         console: {
           log: (...args: any[]) => { /* optional debug logging */ }
         }
       };

       const context = vm.createContext(sandbox);
       const script = new vm.Script(code);
       script.runInContext(context, {
         timeout: timeoutMs,
         breakOnSigint: true,
       });

       return {
         success: true,
         data: context.result
       };
     } catch (error: any) {
       return {
         success: false,
         data: null,
         error: error.message || 'Execution timeout or error'
       };
     }
   }
   ```

2. **Implement Wildcard Route Gateway Controller (`src/routes/gateway.ts`)**:
   Set up dynamic matching and execution. Find the matching published workflow, trace node structures, perform dynamic database calls, execute sandboxed code, and send custom responses.
   *(Below is an abstract representation of the dynamic execution workflow logic)*:
   ```typescript
   import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
   import { prisma } from '../index.js';
   import { runInSandbox } from '../services/sandbox.js';

   export async function gatewayRoutes(fastify: FastifyInstance) {
     // Matches any dynamic route under the /api/:projectId namespace
     fastify.all('/api/:projectId/*', async (request: FastifyRequest, reply: FastifyReply) => {
       const { projectId } = request.params as { projectId: string };
       const wildPath = `/${(request.params as any)['*']}`;
       const method = request.method;

       const startTime = Date.now();

       // 1. Resolve active workflow
       const workflow = await prisma.workflow.findFirst({
         where: {
           projectId,
           path: wildPath,
           method,
           isPublished: true,
         },
         include: { gatewayConfig: true },
       });

       if (!workflow) {
         return reply.status(404).send({ error: `Route ${method} ${wildPath} not found for this project.` });
       }

       // 2. Validate Gateway Configs (JWT and Rate Limiting)
       if (workflow.gatewayConfig?.requireJwt) {
         try {
           await request.jwtVerify();
         } catch {
           return reply.status(401).send({ error: 'Unauthorized: JWT required' });
         }
       }

       // 3. Execution Context State Map
       const executionContext: Record<string, any> = {
         request: {
           body: request.body,
           query: request.query,
           params: request.params,
           headers: request.headers,
         },
         steps: {}
       };

       // 4. Sequential DAG node executor loop
       const nodes = workflow.nodes as any[];
       const edges = workflow.edges as any[];

       // Perform topological sort and execute each node (Trigger, Database, JS Code, Response)
       try {
         // Example execution logic of single nodes sequential mapping
         for (const node of nodes) {
           if (node.type === 'customCodeNode') {
             const sandboxCode = node.data.code;
             const result = runInSandbox(sandboxCode, executionContext);
             if (!result.success) throw new Error(`Script Error in ${node.id}: ${result.error}`);
             executionContext.steps[node.id] = result.data;
           }

           if (node.type === 'responseNode') {
             const status = node.data.statusCode || 200;
             const responseBody = executionContext.steps[node.data.sourceNodeId] || node.data.body;
             
             // Log latency audit trails
             const latency = Date.now() - startTime;
             await prisma.executionLog.create({
               data: {
                 workflowId: workflow.id,
                 method,
                 path: wildPath,
                 responseStatus: status,
                 latencyMs: latency,
                 requestPayload: JSON.stringify(request.body || {}),
               }
             });

             return reply.status(status).send(responseBody);
           }
         }
       } catch (err: any) {
         // Log errors and return 500
         const latency = Date.now() - startTime;
         await prisma.executionLog.create({
           data: {
             workflowId: workflow.id,
             method,
             path: wildPath,
             responseStatus: 500,
             latencyMs: latency,
             errorDetails: err.message,
           }
         });
         return reply.status(500).send({ error: 'Workflow execution aborted', details: err.message });
       }
     });
   }
   ```

---

### Phase 5: Code Exporter & Background Worker (BullMQ)
The Static Compilation module converts visual JSON configurations into native Fastify/Prisma TypeScript code. The exporter runs asynchronously using BullMQ to prevent slow packaging requests from blocking the event loop.

1. **Setup Task Queue (`src/queue/exportQueue.ts`)**:
   ```typescript
   import { Queue } from 'bullmq';

   const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

   export const exportQueue = new Queue('export-jobs', {
     connection: {
       url: REDIS_URL
     }
   });
   ```

2. **Define the Compiler Service (`src/services/compiler.ts`)**:
   Create a generator mapping Visual Nodes to clean TypeScript routes:
   - **Database nodes** generate typed Prisma operations (e.g. `await prisma.table.findMany()`).
   - **Code nodes** generate clean functions.
   - **Trigger nodes** generate standard route wrappers.
   - Outputs the main server configuration files, `Dockerfile`, and `prisma/schema.prisma`.

3. **Define Compilation Worker (`src/queue/worker.ts`)**:
   Register a worker that processes queue requests, compiles the project, bundles it via `archiver` into a ZIP, and uploads it or pushes it directly to a user's GitHub repository.

---

### Phase 6: WebSockets & Analytics Infrastructure
1. **Initialize WebSockets Handler (`src/websocket.ts`)**:
   Attach Socket.io to the server.
2. **Metrics Emission**:
   Whenever a dynamic API route finishes execution on the Gateway, capture the metrics event payload and broadcast it over Socket.io namespaces based on `projectId` to feed the frontend visual analytics charts in real-time.

---

### Phase 7: Branching Execution & OpenAPI (Swagger) Documentation Compilation
1. **Visual Branching & Skipping (If/Else logic)**:
   - Visual nodes are executed in topological sorted order.
   - To support conditional paths, a `skipped` Set tracks nodes that should not run.
   - When an `ifElseNode` condition evaluates to `true` or `false`, the targets of the alternate branch are added to the `skipped` Set.
   - Any skipped node propagates its skip status downstream to its children.
2. **OpenAPI Spec Generation (`swagger.ts`)**:
   - The project exporter dynamically builds an OpenAPI 3.0 specification (`swagger.ts`) representing all project endpoints, parameters, and payloads.
   - The compiled code registers `@fastify/swagger` and `@fastify/swagger-ui` to host dynamic API docs under `/docs`.

---

## Development Scripts
Add development and build controls inside `package.json`:
- **Run dev watch**: `npm run dev` (utilizes `tsx` to watch code files on change)
- **Compile files**: `npm run build` (invokes `tsc` compiler)
- **Prisma Client Generation**: `npx prisma generate` (invokes type bindings updates after schemas changes)
- **Database Studio**: `npx prisma studio` (provides a local database viewer)
