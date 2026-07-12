# System Design & Architecture Specification - FlowForge

## 1. High-Level System Architecture

```
                       ┌────────────────────────┐
                       │   Visual Web Client    │
                       │   (Next.js / React)    │
                       └───────────┬────────────┘
                                   │ HTTPS / WebSockets
                                   ▼
                       ┌────────────────────────┐
                       │    FlowForge Gateway   │
                       │    (Fastify Engine)    │
                       └─────┬────────────┬─────┘
                             │            │
             ┌───────────────┘            └────────────────┐
             ▼                                             ▼
┌────────────────────────┐                    ┌────────────────────────┐
│    Execution Engine    │                    │     Compiler Engine    │
│   (Managed Runtime)    │                    │     (Code Exporter)    │
└────────────┬───────────┘                    └────────────┬───────────┘
             │                                             │
      ┌──────┴──────┐                               ┌──────┴──────┐
      ▼             ▼                               ▼             ▼
┌───────────┐ ┌───────────┐                   ┌───────────┐ ┌───────────┐
│Secure Code│ │PostgreSQL │                   │ ZIP Pack  │ │GitHub/Git │
│VM Sandbox │ │ Database  │                   │ (Archiver)│ │  Push API │
└───────────┘ └───────────┘                   └───────────┘ └───────────┘
```

The system splits responsibilities into two distinct core tracks:
1. **Dynamic Execution Loop (Managed Runtime)**: Operates like a microservice orchestrator, catching wildcards on the Gateway, translating visual JSON definitions into state steps, and running user-written JavaScript inside isolated sandboxes.
2. **Static Compilation Loop (Code Exporter)**: A traditional graph-to-code compiler that builds structured, standard, non-proprietary TypeScript/Fastify backends.

---

## 2. Gateway Pipeline & Route Registration

To handle visually published APIs dynamically, the FlowForge Gateway registers a wildcard handler in Fastify:

```
Client Request ──► [Wildcard Match: /api/:projectId/*]
                         │
                         ▼
             [Extract Route & Method]
                         │
                         ▼
             [Match Workflow in Database] ──(No Match)──► [404 Not Found]
                         │ (Found)
                         ▼
             [Execute Rate Limiting Middleware] ────────► [429 Too Many Requests]
                         │ (Under Limit)
                         ▼
             [Execute JWT / Auth Middleware] ───────────► [401 Unauthorized]
                         │ (Authenticated)
                         ▼
             [Run Workflow Execution Engine]
                         │
                         ▼
             [Write Performance Audit Log]
                         │
                         ▼
              Client HTTP Response
```

* **Wildcard Route**: Fastify listens on `ALL /api/:projectId/*`.
* **Dynamic Resolution**: The path and request method are queried against the database index `idx_workflow_route`.
* **Context Loading**: The database returns the serialized React Flow Graph (nodes and edges) along with middleware credentials.

---

## 3. Secure VM Sandbox Execution Model
Custom JavaScript code nodes run user-defined scripting. In the managed runtime, we execute this script inside a secure VM context to isolate CPU loops, memory consumption, and network access.

```typescript
import vm from 'node:vm';

export interface SandboxResult {
  success: boolean;
  data: any;
  error?: string;
}

export function runInSandbox(code: string, contextData: any, timeoutMs = 200): SandboxResult {
  try {
    // 1. Establish isolated variables scope
    const sandbox = {
      context: JSON.parse(JSON.stringify(contextData)), // Deep copy inputs
      result: {},
      console: {
        log: (...args: any[]) => { /* Capture console prints for task debugging logs */ }
      }
    };

    // 2. Create context
    const context = vm.createContext(sandbox);

    // 3. Compile and execute script with constraints
    const script = new vm.Script(code);
    script.runInContext(context, {
      timeout: timeoutMs,           // Max milliseconds execution time
      breakOnSigint: true,          // Support manual terminations
    });

    return {
      success: true,
      data: context.result
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error.message || 'Execution error'
    };
  }
}
```

* **Timeout Enforcement**: The Node.js VM thread automatically interrupts the runner if runtime exceeds `timeoutMs` to prevent infinite loops (e.g. `while(true){}`).
* **Context Cleansing**: Objects like `process`, `require`, `module`, and system variables are omitted from the sandbox.

---

## 4. Compiler Engine: Graph-to-Code Transformation
The visual compiler runs topological parses on the DAG nodes to generate standard, formatted, and readable code.

```
                    [Workflow Graph JSON]
                              │
                              ▼
                  [Validate Connection Paths]
                              │ (Ensure 1 Trigger, 1 Response)
                              ▼
                  [Topological Sort of DAG]
                              │
                              ▼
            [Iterate Nodes & Append Source Code]
              ├─ Trigger  ──► Fastify Route Definition
              ├─ Custom JS──► Inline JS module wrapper
              ├─ Database ──► Prisma query templates
              └─ Response ──► `reply.status().send()`
                              │
                              ▼
            [Generate Static Project File Tree]
```

### 4.1 Node to Code Templates

#### A. Trigger Node (GET /products)
Compiles to the route declaration:
```typescript
fastify.get('/products', async (request, reply) => {
  const context: Record<string, any> = {
    request: {
      body: request.body,
      query: request.query,
      params: request.params,
      headers: request.headers
    }
  };
  
  // Sequential steps follow here...
```

#### B. Database Node (PostgreSQL SELECT)
Compiles into standard Prisma syntax:
```typescript
  // Step 2: PostgreSQL Select products
  let step_selectProducts;
  try {
    step_selectProducts = await prisma.product.findMany({
      where: { category: context.request.query.category }
    });
    context.step_selectProducts = step_selectProducts;
  } catch (dbError: any) {
    return reply.status(500).send({ error: 'Database execution failed', details: dbError.message });
  }
```

#### C. Custom Code Node
Compiles directly into wrapped JS function executions:
```typescript
  // Step 3: Custom JS Transformer
  let step_jsTransformer;
  try {
    const runJS = (context: any) => {
      // User custom javascript:
      const items = context.step_selectProducts;
      return items.map((x: any) => ({ name: x.name, price: x.price * 1.1 }));
    };
    step_jsTransformer = runJS(context);
    context.step_jsTransformer = step_jsTransformer;
  } catch (scriptError: any) {
    return reply.status(500).send({ error: 'Script error', details: scriptError.message });
  }
```

#### D. Response Node
Compiles directly into a response send:
```typescript
  // Step 4: JSON Response
  return reply.status(200).send(context.step_jsTransformer);
});
```

---

## 5. Exporter Output Artifacts
The ZIP generator packages files according to these structures:

* **Prisma Schema**: Generated from database nodes and relation fields.
* **OpenAPI Specs**: Built by scanning Trigger HTTP configurations (Paths, Methods) and Response payload schemas, converting them into standard Swagger format.
* **Docker Packaging**:
  * **Dockerfile**: Multi-stage lightweight compilation utilizing `node:22-alpine`.
  * **docker-compose.yml**: Automatically pairs the Fastify app with a local PostgreSQL server container.
