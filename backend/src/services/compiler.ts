import { orderNodes } from "./dag.js";

function parsePathAndParams(path: string) {
  const params: any[] = [];
  const openApiPath = path.replace(/:([a-zA-Z0-9_]+)/g, (match, paramName) => {
    params.push({
      name: paramName,
      in: "path",
      required: true,
      schema: { type: "string" },
    });
    return `{${paramName}}`;
  });
  return { openApiPath, params };
}

/**
 * Compiles a visual project and its workflows into a standalone Fastify + TypeScript + Prisma codebase.
 * Returns a Record mapping absolute project file paths to their string contents.
 */
export function compileProject(
  projectName: string,
  workflows: any[]
): Record<string, string> {
  const fileTree: Record<string, string> = {};

  // 1. package.json
  fileTree["package.json"] = JSON.stringify(
    {
      name: projectName.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
      version: "1.0.0",
      type: "module",
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        start: "node dist/index.js",
        dev: "tsx watch src/index.ts",
      },
      dependencies: {
        fastify: "^5.8.5",
        "@fastify/cors": "^11.2.0",
        "@fastify/jwt": "^10.1.0",
        "@fastify/swagger": "^9.4.2",
        "@fastify/swagger-ui": "^4.1.1",
        "@prisma/client": "^7.8.0",
        "@prisma/adapter-pg": "^7.8.0",
        pg: "^8.13.1",
        dotenv: "^17.4.2",
      },
      devDependencies: {
        typescript: "^6.0.3",
        "@types/node": "^25.9.3",
        "@types/pg": "^8.11.10",
        tsx: "^4.22.4",
        prisma: "^7.8.0",
      },
    },
    null,
    2
  );

  // 2. tsconfig.json
  fileTree["tsconfig.json"] = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        outDir: "./dist",
      },
      include: ["src/**/*"],
    },
    null,
    2
  );

  // 3. prisma.config.ts (Prisma 7 style)
  fileTree["prisma.config.ts"] = `import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
`;

  // 4. prisma/schema.prisma
  fileTree["prisma/schema.prisma"] = `datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

// Default placeholder product table to support database CRUD nodes testing
model Product {
  id          String   @id @default(uuid())
  name        String
  price       Float
  category    String
  createdAt   DateTime @default(now())
}
`;

  // 4.5 Generate Swagger Spec
  const swaggerSpecPaths: Record<string, any> = {};
  for (const w of workflows) {
    const routeMethod = w.method.toLowerCase();
    const { openApiPath, params } = parsePathAndParams(w.path);
    if (!swaggerSpecPaths[openApiPath]) {
      swaggerSpecPaths[openApiPath] = {};
    }
    swaggerSpecPaths[openApiPath][routeMethod] = {
      summary: w.name || `${w.method} ${w.path}`,
      description: `Visual pipeline execution for workflow: ${w.name}`,
      parameters: params.length > 0 ? params : undefined,
      responses: {
        "200": {
          description: "Successful Execution Response",
          content: {
            "application/json": {
              schema: { type: "object" }
            }
          }
        },
        "500": {
          description: "Internal Server Error"
        }
      }
    };
    if (["post", "put", "patch"].includes(routeMethod)) {
      swaggerSpecPaths[openApiPath][routeMethod].requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: { type: "object", additionalProperties: true }
          }
        }
      };
    }
  }

  const swaggerSpec = {
    openapi: "3.0.0",
    info: {
      title: projectName,
      version: "1.0.0",
      description: `REST API Documentation for ${projectName} compiled by FlowForge.`,
    },
    paths: swaggerSpecPaths,
  };

  fileTree["src/swagger.ts"] = `export const swaggerSpec = ${JSON.stringify(swaggerSpec, null, 2)};\n`;

  // 5. .env.example
  fileTree[".env.example"] = `PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/flowforge_exported?sslmode=require"
JWT_SECRET="exported-application-super-secret-jwt-key"
`;

  // 6. Dockerfile (multi-stage lightweight deploy build)
  fileTree["Dockerfile"] = `# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY src ./src
RUN npx prisma generate
RUN npm run build

# Production Stage
FROM node:22-alpine
WORKDIR /app
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000
CMD ["npm", "start"]
`;

  // 7. docker-compose.yml (Local application stack runner)
  fileTree["docker-compose.yml"] = `version: "3.8"
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - DATABASE_URL=postgresql://postgres:password@db:5432/flowforge_exported?sslmode=require
      - JWT_SECRET=compose-jwt-secret-key-1234
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=flowforge_exported
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`;

  // 8. src/services/db.ts (Prisma 7 connector singleton)
  fileTree["src/services/db.ts"] = `import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
`;

  // 9. src/index.ts (Bootstrapper entrypoint)
  fileTree["src/index.ts"] = `import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import dotenv from "dotenv";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { swaggerSpec } from "./swagger.js";
import { registerRoutes } from "./routes/api.js";
import { prisma } from "./services/db.js";

dotenv.config();

const fastify = Fastify({ logger: true });

// Register CORS
await fastify.register(cors, { origin: true });

// Register JWT Verification
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || "fallback-jwt-signing-secret-key-999",
});

// Register Swagger OpenAPI Spec and UI docs
await fastify.register(swagger, {
  mode: "static",
  specification: {
    document: swaggerSpec,
  },
});

await fastify.register(swaggerUi, {
  routePrefix: "/docs",
});

// Register API Routes
await fastify.register(registerRoutes, { prefix: "/api" });

const start = async () => {
  try {
    await prisma.$connect();
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log("🚀 Standalone API Gateway active on port " + port);
    console.log("📖 API documentation available at http://localhost:" + port + "/docs");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
`;

  // 10. src/routes/api.ts (Compiled Visual Workflows)
  let apiFileContent = `import { FastifyInstance } from "fastify";
import { prisma } from "../services/db.js";

// Helper to safely extract nested context properties
function resolveVariable(path: string, context: any): any {
  if (!path) return undefined;
  const parts = path.split(".");
  let current = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

// Helper to parameterize queries for prepared statement SQL execution
function parameterizeSqlQuery(query: string, context: any): { sql: string; values: any[] } {
  const variableRegex = /\\$([a-zA-Z0-9_\\.]+)/g;
  const values: any[] = [];
  let index = 1;
  const sql = query.replace(variableRegex, (match, path) => {
    const val = resolveVariable(path, context);
    values.push(val !== undefined ? val : null);
    return "$" + (index++);
  });
  return { sql, values };
}

export async function registerRoutes(fastify: FastifyInstance) {
`;

  for (const workflow of workflows) {
    const nodes = (workflow.nodes as any[]) || [];
    const edges = (workflow.edges as any[]) || [];

    let orderedNodes: any[] = [];
    try {
      orderedNodes = orderNodes(nodes, edges);
    } catch (err) {
      // Fallback in case DAG has circular dependencies
      orderedNodes = nodes;
    }

    const routeMethod = workflow.method.toLowerCase();
    const routePath = workflow.path;

    apiFileContent += `
  // Route: ${workflow.method} ${workflow.path}
  fastify.${routeMethod}("${routePath}", async (request, reply) => {
    const context = {
      request: {
        body: request.body,
        query: request.query,
        params: request.params,
        headers: request.headers,
      },
      steps: {} as Record<string, any>,
    };

    const skipped = new Set<string>();

    try {`;

    for (const node of orderedNodes) {
      if (
        node.type === "triggerNode" ||
        node.type === "httpTrigger" ||
        node.type === "trigger" ||
        node.type === "webhookNode" ||
        node.type === "webhook" ||
        node.type === "scheduledNode" ||
        node.type === "scheduled"
      ) {
        continue;
      }

      // Add a wrapper to skip node execution if it is in the skipped Set
      apiFileContent += `
      // Node: ${node.id} (${node.type})
      if (skipped.has("${node.id}")) {
        ${edges
          .filter((e) => e.source === node.id)
          .map((e) => `skipped.add("${e.target}");`)
          .join("\n        ")}
      } else {`;

      if (node.type === "databaseNode" || node.type === "database") {
        const rawSql = node.data?.query || "";
        const escapedSql = rawSql.replace(/`/g, "\\`").replace(/\$/g, "\\$");

        apiFileContent += `
        const query_${node.id} = \\\`${escapedSql}\\\`;
        const { sql: sql_${node.id}, values: values_${node.id} } = parameterizeSqlQuery(query_${node.id}, context);
        const db_${node.id} = await prisma.\\$queryRawUnsafe(sql_${node.id}, ...values_${node.id});
        context.steps["${node.id}"] = db_${node.id};
`;
      }

      else if (node.type === "customCodeNode" || node.type === "code") {
        const codeScript = node.data?.code || "";

        apiFileContent += `
        context.steps["${node.id}"] = (function(context) {
          ${codeScript}
        })(context);
`;
      }

      else if (node.type === "ifElseNode" || node.type === "ifelse") {
        const conditionExpr = node.data?.condition || "false";
        apiFileContent += `
        const cond_${node.id} = Boolean(${conditionExpr});
        context.steps["${node.id}"] = cond_${node.id};
        if (cond_${node.id}) {
          // skip false branch targets
          ${edges
            .filter((e) => e.source === node.id && e.sourceHandle === "false")
            .map((e) => `skipped.add("${e.target}");`)
            .join("\n          ")}
        } else {
          // skip true branch targets
          ${edges
            .filter((e) => e.source === node.id && e.sourceHandle === "true")
            .map((e) => `skipped.add("${e.target}");`)
            .join("\n          ")}
        }
`;
      }

      else if (node.type === "switchCaseNode" || node.type === "switchcase" || node.type === "switchCase") {
        const expr = node.data?.expression || "undefined";
        const cases = node.data?.cases || ["default"];
        
        apiFileContent += `
        const val_${node.id} = String(${expr});
        context.steps["${node.id}"] = val_${node.id};
        
        switch (val_${node.id}) {
`;
        
        const specificCases = cases.filter((c: string) => c !== "default");
        for (const c of specificCases) {
          apiFileContent += `          case "${c}":
            // skip other branches
            ${edges
              .filter((e) => e.source === node.id && e.sourceHandle !== c)
              .map((e) => `skipped.add("${e.target}");`)
              .join("\n            ")}
            break;
`;
        }

        apiFileContent += `          default:
            // skip specific case branches
            ${edges
              .filter((e) => e.source === node.id && e.sourceHandle !== "default")
              .map((e) => `skipped.add("${e.target}");`)
              .join("\n            ")}
            break;
        }
`;
      }

      else if (node.type === "httpClientNode" || node.type === "httpclient" || node.type === "httpClient") {
        const urlTemp = node.data?.url || "";
        const clientMethod = node.data?.method || "GET";
        const headersTemp = node.data?.headers || "{}";
        const bodyTemp = node.data?.body || "";

        // Escape backticks and variables
        const escapedUrl = urlTemp.replace(/`/g, "\\`").replace(/\$/g, "\\$");
        const escapedHeaders = headersTemp.replace(/`/g, "\\`").replace(/\$/g, "\\$");

        apiFileContent += `
        const url_${node.id} = \\\`${escapedUrl}\\\`.replace(/\\\\\\$([a-zA-Z0-9_\\\\.]+)/g, (match, path) => {
          const val = resolveVariable(path, context);
          return val !== undefined ? String(val) : "";
        });

        let headers_${node.id} = {};
        try {
          const rawHeaders = \\\`${escapedHeaders}\\\`.replace(/\\\\\\$([a-zA-Z0-9_\\\\.]+)/g, (match, path) => {
            const val = resolveVariable(path, context);
            return val !== undefined ? String(val) : "";
          });
          headers_${node.id} = JSON.parse(rawHeaders);
        } catch (err) {
          headers_${node.id} = {};
        }

        let body_${node.id}: any = undefined;
`;

        if (typeof bodyTemp === "string" && bodyTemp.startsWith("$") && !bodyTemp.includes(" ")) {
          apiFileContent += `        body_${node.id} = resolveVariable("${bodyTemp.slice(1)}", context);\n`;
        } else {
          const escapedBody = bodyTemp.replace(/`/g, "\\`").replace(/\$/g, "\\$");
          apiFileContent += `        body_${node.id} = \\\`${escapedBody}\\\`.replace(/\\\\\\$([a-zA-Z0-9_\\\\.]+)/g, (match, path) => {
            const val = resolveVariable(path, context);
            return val !== undefined ? String(val) : "";
          });\n`;
        }

        apiFileContent += `
        try {
          const fetchOpts_${node.id}: any = {
            method: "${clientMethod}",
            headers: {
              "Content-Type": "application/json",
              ...headers_${node.id}
            }
          };
          if (["POST", "PUT", "PATCH", "DELETE"].includes("${clientMethod.toUpperCase()}") && body_${node.id} !== undefined) {
            fetchOpts_${node.id}.body = typeof body_${node.id} === "string" ? body_${node.id} : JSON.stringify(body_${node.id});
          }

          const res_${node.id} = await fetch(url_${node.id}, fetchOpts_${node.id});
          let data_${node.id}: any = null;
          const cType_${node.id} = res_${node.id}.headers.get("content-type") || "";
          if (cType_${node.id}.includes("application/json")) {
            data_${node.id} = await res_${node.id}.json();
          } else {
            data_${node.id} = await res_${node.id}.text();
          }

          context.steps["${node.id}"] = {
            status: res_${node.id}.status,
            statusText: res_${node.id}.statusText,
            data: data_${node.id}
          };
        } catch (err: any) {
          throw new Error(\\\`HTTP Client Request failed for node ${node.id}: \\\${err.message}\\\`);
        }
`;
      }

      else if (node.type === "transformNode" || node.type === "transform") {
        const mappingExpr = node.data?.mapping || "{}";
        apiFileContent += `
        context.steps["${node.id}"] = (${mappingExpr});
`;
      }

      else if (node.type === "jwtValidateNode" || node.type === "jwtValidate") {
        apiFileContent += `
        try {
          const authHeader = request.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new Error("Missing or invalid Bearer token");
          }
          const token = authHeader.split(" ")[1];
          const decoded = fastify.jwt.verify(token);
          context.steps["${node.id}"] = decoded;
        } catch (err: any) {
          return reply.status(401).send({ error: "Unauthorized", message: err.message });
        }
`;
      }

      else if (node.type === "apiKeyNode" || node.type === "apiKey") {
        const headerName = (node.data?.headerName || "x-api-key").toLowerCase();
        const expectedVal = node.data?.keyValue || "";
        apiFileContent += `
        const headerName = "${headerName}";
        const apiKey = request.headers[headerName];
        if (!apiKey || ("${expectedVal}" && apiKey !== "${expectedVal}")) {
          return reply.status(401).send({ error: "Unauthorized: Invalid API Key" });
        }
        context.steps["${node.id}"] = { valid: true };
`;
      }

      else if (node.type === "responseNode" || node.type === "response") {
        const status = node.data?.statusCode || 200;
        const bodyValue = node.data?.body;
        const headersTemp = node.data?.headers;
        const redirectUrlTemp = node.data?.redirectUrl;

        // 1. Compile custom response headers if set
        if (headersTemp) {
          const escapedHeaders = headersTemp.replace(/`/g, "\\`").replace(/\$/g, "\\$");
          apiFileContent += `
        try {
          const rawHeaders = \\\`${escapedHeaders}\\\`.replace(/\\\\\\$([a-zA-Z0-9_\\\\.]+)/g, (match, path) => {
            const val = resolveVariable(path, context);
            return val !== undefined ? String(val) : "";
          });
          const parsedHeaders = JSON.parse(rawHeaders);
          reply.headers(parsedHeaders);
        } catch (err) {
          // ignore parsing error
        }
`;
        }

        // 2. Compile redirect if set
        if (redirectUrlTemp) {
          if (typeof redirectUrlTemp === "string" && redirectUrlTemp.startsWith("$") && !redirectUrlTemp.includes(" ")) {
            apiFileContent += `
        const redirectUrl_${node.id} = resolveVariable("${redirectUrlTemp.slice(1)}", context);
        return reply.status(${status === 200 ? 302 : status}).redirect(redirectUrl_${node.id});
`;
          } else {
            const escapedRedirect = redirectUrlTemp.replace(/`/g, "\\`").replace(/\$/g, "\\$");
            apiFileContent += `
        const redirectUrl_${node.id} = \\\`${escapedRedirect}\\\`.replace(/\\\\\\$([a-zA-Z0-9_\\\\.]+)/g, (match, path) => {
          const val = resolveVariable(path, context);
          return val !== undefined ? String(val) : "";
        });
        return reply.status(${status === 200 ? 302 : status}).redirect(redirectUrl_${node.id});
`;
          }
        } else {
          // Normal body response
          if (typeof bodyValue === "string" && bodyValue.startsWith("$")) {
            apiFileContent += `
        const response_${node.id} = resolveVariable("${bodyValue.slice(1)}", context);
        return reply.status(${status}).send(response_${node.id});
`;
          } else {
            apiFileContent += `
        return reply.status(${status}).send(${JSON.stringify(bodyValue)});
`;
          }
        }
      }

      // Close the skipped else block
      apiFileContent += `      }\n`;
    }

    apiFileContent += `
      // Default fallback return
      return reply.status(200).send({ message: "Workflow executed successfully" });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: err.message,
      });
    }
  });
`;
  }

  apiFileContent += `}\n`;
  fileTree["src/routes/api.ts"] = apiFileContent;

  return fileTree;
}
