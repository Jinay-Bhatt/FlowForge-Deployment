import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../services/db.js";
import { runInSandbox } from "../services/sandbox.js";
import {
  orderNodes,
  resolveVariable,
  parameterizeSqlQuery,
} from "../services/dag.js";
import { getCachedWorkflows } from "../services/cache.js";
import { decrypt } from "../services/crypto.js";
import { queueExecutionLog } from "../services/logger.js";

// In-memory rate limiting store (key: IP + workflowId)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Periodically GC expired entries from the rateLimitStore map to prevent memory leaks under user load
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 120000); // Clean up every 2 minutes

/**
 * Checks and enforces rate limits for incoming gateway requests.
 */
function checkRateLimit(
  ip: string,
  workflowId: string,
  limit: number,
  windowSecs: number
): boolean {
  const now = Date.now();
  const key = `${ip}:${workflowId}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    if (record) {
      rateLimitStore.delete(key); // Actively cleanup expired item
    }
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowSecs * 1000,
    });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Helper to match a client's request path against a workflow pattern (supporting parameterized routes like :id).
 */
function matchPath(
  pattern: string,
  reqParts: string[]
): Record<string, string> | null {
  const routeParts = pattern.split("/").filter(Boolean);

  if (routeParts.length !== reqParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(":")) {
      const paramName = routeParts[i].slice(1);
      params[paramName] = reqParts[i];
    } else if (routeParts[i] !== reqParts[i]) {
      return null;
    }
  }
  return params;
}

export async function gatewayRoutes(fastify: FastifyInstance) {
  // wildcard catcher matching any dynamic route under the /api/:projectId namespace
  fastify.all(
    "/api/:projectId/*",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { projectId } = request.params as { projectId: string };
      const wildPath = `/${(request.params as any)["*"]}`;
      const method = request.method;
      const startTime = Date.now();

      let matchedWorkflow: any = null;
      let matchedParams: Record<string, string> = {};

      try {
        // Pre-split the request path once to optimize matches in loop
        const reqParts = wildPath.split("/").filter(Boolean);

        // Fetch all published workflows for the project from cache
        const workflows = await getCachedWorkflows(projectId);

        // Resolve path match
        for (const w of workflows) {
          // If the request is OPTIONS, we match the path regardless of method.
          // Otherwise, we match path AND HTTP method.
          if (method !== "OPTIONS" && w.method !== method) {
            continue;
          }
          const params = matchPath(w.path, reqParts);
          if (params !== null) {
            matchedWorkflow = w;
            matchedParams = params;
            break;
          }
        }

        if (!matchedWorkflow) {
          return reply.status(404).send({
            error: `Not Found: Route '${method} ${wildPath}' not found or not published`,
          });
        }

        const workflow = matchedWorkflow;

        // 1. Enforce CORS hook if enabled
        if (workflow.gatewayConfig?.corsEnabled) {
          const origin = workflow.gatewayConfig.allowedOrigins || "*";
          reply.header("Access-Control-Allow-Origin", origin);
          reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
          reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
          
          if (method === "OPTIONS") {
            return reply.status(204).send();
          }
        }

        // 2. Enforce JWT Security Hook
        if (workflow.gatewayConfig?.requireJwt) {
          try {
            await request.jwtVerify();
          } catch (jwtErr) {
            return reply.status(401).send({
              error: "Unauthorized: Access requires a valid JWT Bearer token",
            });
          }
        }

        // 3. Enforce API Key Security Hook
        if (workflow.gatewayConfig?.requireApiKey) {
          const clientApiKey = request.headers["x-api-key"] as string;
          if (!clientApiKey) {
            return reply.status(401).send({
              error: "Unauthorized: Access requires a valid 'x-api-key' header",
            });
          }

          if (workflow.gatewayConfig.apiKeyValue) {
            try {
              const decryptedApiKey = decrypt(workflow.gatewayConfig.apiKeyValue);
              if (clientApiKey !== decryptedApiKey) {
                return reply.status(401).send({
                  error: "Unauthorized: Invalid 'x-api-key' credentials",
                });
              }
            } catch (decErr) {
              request.log.error(decErr, "Failed to decrypt gateway API key");
              return reply.status(500).send({
                error: "Internal Server Error: Security validation failed",
              });
            }
          } else {
            return reply.status(401).send({
              error: "Unauthorized: API Key is required but not configured on gateway",
            });
          }
        }

        // 4. Enforce Rate Limiting Hook
        if (
          workflow.gatewayConfig?.rateLimitLimit &&
          workflow.gatewayConfig?.rateLimitWindow
        ) {
          const clientIp = request.ip || "unknown-ip";
          const underLimit = checkRateLimit(
            clientIp,
            workflow.id,
            workflow.gatewayConfig.rateLimitLimit,
            workflow.gatewayConfig.rateLimitWindow
          );

          if (!underLimit) {
            return reply.status(429).send({
              error: "Too Many Requests: Rate limit exceeded",
            });
          }
        }

        // 5. Establish Execution Context
        const executionContext = {
          request: {
            body: request.body,
            query: request.query,
            params: matchedParams,
            headers: request.headers,
          },
          steps: {} as Record<string, any>,
        };

        // 6. Trace and Sort Graph Nodes
        const nodes = (workflow.nodes as any[]) || [];
        const edges = (workflow.edges as any[]) || [];
        const orderedNodes = orderNodes(nodes, edges);

        // 7. Sequential execution loop
        const skippedNodeIds = new Set<string>();

        for (const node of orderedNodes) {
          // If this node is in the skipped set, propagate the skip to all its targets
          if (skippedNodeIds.has(node.id)) {
            for (const edge of edges) {
              if (edge.source === node.id) {
                skippedNodeIds.add(edge.target);
              }
            }
            continue;
          }

          // A. Trigger Nodes (No-op at runtime execution, just registers start)
          if (
            node.type === "triggerNode" ||
            node.type === "httpTrigger" ||
            node.type === "trigger" ||
            node.type === "webhookNode" ||
            node.type === "webhook" ||
            node.type === "scheduledNode" ||
            node.type === "scheduled"
          ) {
            executionContext.steps[node.id] = { status: "triggered" };
            continue;
          }

          // B. Database Query Nodes (PostgreSQL SQL execution)
          if (node.type === "databaseNode" || node.type === "database") {
            const queryTemplate = node.data?.query;
            if (!queryTemplate) {
              throw new Error(`Database node '${node.id}' missing SQL query query`);
            }

            const { sql, values } = parameterizeSqlQuery(
              queryTemplate,
              executionContext
            );

            // Execute raw SQL on Postgres using prepared variables
            const dbResult = await prisma.$queryRawUnsafe(sql, ...values);
            executionContext.steps[node.id] = dbResult;
            continue;
          }

          // C. Custom Code Script Nodes (vm sandbox execution)
          if (node.type === "customCodeNode" || node.type === "code") {
            const scriptCode = node.data?.code;
            if (!scriptCode) {
              throw new Error(`Code node '${node.id}' missing JavaScript script`);
            }

            const runResult = runInSandbox(scriptCode, executionContext);
            if (!runResult.success) {
              throw new Error(
                `Script Error in node '${node.id}': ${runResult.error}`
              );
            }

            // Await the result if sandbox returned a Promise (async code using require/fetch)
            const resolvedData = runResult.data && typeof runResult.data.then === "function"
              ? await runResult.data
              : runResult.data;

            executionContext.steps[node.id] = resolvedData;
            continue;
          }

          // D. If / Else Branching Nodes
          if (node.type === "ifElseNode" || node.type === "ifelse") {
            const conditionExpr = node.data?.condition || "false";
            // Evaluate condition inside sandbox
            const runResult = runInSandbox(`result = Boolean(${conditionExpr});`, executionContext);
            if (!runResult.success) {
              throw new Error(
                `Condition Evaluation Error in node '${node.id}': ${runResult.error}`
              );
            }
            const conditionValue = !!runResult.data;
            executionContext.steps[node.id] = conditionValue;

            // Determine which branches to skip based on the condition output
            for (const edge of edges) {
              if (edge.source === node.id) {
                const handle = edge.sourceHandle; // "true" or "false"
                if (handle === "true" && !conditionValue) {
                  skippedNodeIds.add(edge.target);
                } else if (handle === "false" && conditionValue) {
                  skippedNodeIds.add(edge.target);
                }
              }
            }
            continue;
          }

          // D.2 Switch Case Multi-branching Nodes
          if (node.type === "switchCaseNode" || node.type === "switchcase" || node.type === "switchCase") {
            const expr = node.data?.expression || "undefined";
            const cases = node.data?.cases || ["default"];
            
            // Evaluate expression inside sandbox
            const runResult = runInSandbox(`result = (${expr});`, executionContext);
            if (!runResult.success) {
              throw new Error(
                `Switch Expression Evaluation Error in node '${node.id}': ${runResult.error}`
              );
            }
            const matchedValue = String(runResult.data);
            executionContext.steps[node.id] = runResult.data;

            // Check if matchedValue matches any case (ignoring 'default' in direct check)
            const hasMatch = cases.filter((c: string) => c !== "default").includes(matchedValue);
            const activeBranch = hasMatch ? matchedValue : "default";

            // Skip all branches except the active one
            for (const edge of edges) {
              if (edge.source === node.id) {
                const handle = edge.sourceHandle || "default";
                if (handle !== activeBranch) {
                  skippedNodeIds.add(edge.target);
                }
              }
            }
            continue;
          }

          // D.3 Outgoing HTTP Client Nodes
          if (node.type === "httpClientNode" || node.type === "httpclient" || node.type === "httpClient") {
            const urlTemplate = node.data?.url;
            if (!urlTemplate) {
              throw new Error(`HTTP Client node '${node.id}' missing target URL`);
            }

            const clientMethod = node.data?.method || "GET";

            // Interpolate URL variables: e.g. https://api.com/$request.body.id
            const interpolatedUrl = urlTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
              const val = resolveVariable(path, executionContext);
              return val !== undefined ? String(val) : "";
            });

            // Interpolate Headers
            let headers: Record<string, string> = {};
            const headersTemplate = node.data?.headers;
            if (headersTemplate) {
              try {
                const interpolatedHeaders = headersTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
                  const val = resolveVariable(path, executionContext);
                  return val !== undefined ? String(val) : "";
                });
                headers = JSON.parse(interpolatedHeaders);
              } catch (headerErr: any) {
                throw new Error(`Failed to parse headers JSON in node '${node.id}': ${headerErr.message}`);
              }
            }

            // Interpolate Request Body
            let requestBody: any = undefined;
            const bodyTemplate = node.data?.body;
            if (bodyTemplate) {
              if (typeof bodyTemplate === "string") {
                if (bodyTemplate.startsWith("$") && !bodyTemplate.includes(" ")) {
                  // Direct reference
                  requestBody = resolveVariable(bodyTemplate.slice(1), executionContext);
                } else {
                  // Template string interpolation
                  requestBody = bodyTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
                    const val = resolveVariable(path, executionContext);
                    return val !== undefined ? String(val) : "";
                  });
                }
              } else {
                requestBody = bodyTemplate;
              }
            }

            // Perform outgoing fetch request
            try {
              const fetchOptions: any = {
                method: clientMethod,
                headers: {
                  "Content-Type": "application/json",
                  ...headers,
                },
              };

              if (
                ["POST", "PUT", "PATCH", "DELETE"].includes(clientMethod.toUpperCase()) &&
                requestBody !== undefined
              ) {
                fetchOptions.body = typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody);
              }

              const res = await fetch(interpolatedUrl, fetchOptions);
              let responseData: any = null;
              const contentType = res.headers.get("content-type") || "";

              if (contentType.includes("application/json")) {
                responseData = await res.json();
              } else {
                responseData = await res.text();
              }

              executionContext.steps[node.id] = {
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                data: responseData,
              };
            } catch (fetchErr: any) {
              throw new Error(`External API Call failed in node '${node.id}': ${fetchErr.message}`);
            }
            continue;
          }

          // E. Transform / Mapping Nodes
          if (node.type === "transformNode" || node.type === "transform") {
            const mappingExpr = node.data?.mapping || "{}";
            const runResult = runInSandbox(`result = (${mappingExpr});`, executionContext);
            if (!runResult.success) {
              throw new Error(
                `Data Transformation Error in node '${node.id}': ${runResult.error}`
              );
            }
            executionContext.steps[node.id] = runResult.data;
            continue;
          }

          // F. JWT Validate Nodes
          if (node.type === "jwtValidateNode" || node.type === "jwtValidate") {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
              throw new Error("Missing or invalid Authorization Bearer header");
            }
            const token = authHeader.split(" ")[1];
            const secret = node.data?.secret || workflow.gatewayConfig?.jwtSecret || process.env.JWT_SECRET;
            if (!secret) {
              throw new Error("JWT secret is not configured for validation node");
            }

            // Decrypt secret if it is stored encrypted in config
            let decryptedSecret = secret;
            if (workflow.gatewayConfig?.jwtSecret === secret && secret) {
              try {
                decryptedSecret = decrypt(secret);
              } catch {
                // Not encrypted
              }
            }

            try {
              const decoded = fastify.jwt.verify<any>(token, { key: decryptedSecret });
              executionContext.steps[node.id] = decoded;
            } catch (err: any) {
              throw new Error(`JWT node validation failed: ${err.message}`);
            }
            continue;
          }

          // G. API Key Validation Nodes
          if (node.type === "apiKeyNode" || node.type === "apiKey") {
            const headerName = (node.data?.headerName || "x-api-key").toLowerCase();
            const clientKey = request.headers[headerName] as string;
            if (!clientKey) {
              throw new Error(`Missing required API Key header '${headerName}'`);
            }

            const expectedKey = node.data?.keyValue || (workflow.gatewayConfig?.apiKeyValue ? decrypt(workflow.gatewayConfig.apiKeyValue) : null);
            if (expectedKey && clientKey !== expectedKey) {
              throw new Error("Invalid API Key credentials");
            }
            executionContext.steps[node.id] = { valid: true };
            continue;
          }

          // G.1 Gmail Node Execution
          if (node.type === "gmailNode" || node.type === "gmail") {
            const toTemplate = node.data?.to || "";
            const subjectTemplate = node.data?.subject || "Notification";
            const bodyTemplate = node.data?.body || "";
            const token = node.data?.accessToken;

            const interpolatedTo = toTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
              const val = resolveVariable(path, executionContext);
              return val !== undefined ? String(val) : "";
            });
            const interpolatedSubject = subjectTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
              const val = resolveVariable(path, executionContext);
              return val !== undefined ? String(val) : "";
            });
            const interpolatedBody = bodyTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
              const val = resolveVariable(path, executionContext);
              return val !== undefined ? String(val) : "";
            });

            if (token) {
              const rawMessage = `To: ${interpolatedTo}\r\nSubject: ${interpolatedSubject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${interpolatedBody}`;
              const encodedMessage = Buffer.from(rawMessage).toString("base64url");
              try {
                const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ raw: encodedMessage }),
                });
                const resData = await res.json();
                executionContext.steps[node.id] = { status: res.status, sent: res.ok, data: resData };
              } catch (err: any) {
                throw new Error(`Gmail API call failed in node '${node.id}': ${err.message}`);
              }
            } else {
              // Simulated delivery log if no token supplied
              executionContext.steps[node.id] = {
                status: 200,
                sent: true,
                simulated: true,
                to: interpolatedTo,
                subject: interpolatedSubject,
                body: interpolatedBody,
              };
            }
            continue;
          }

          // G.2 Google Sheets Node Execution
          if (node.type === "googleSheetsNode" || node.type === "googleSheets") {
            const action = node.data?.action || "APPEND_ROW";
            const spreadsheetId = node.data?.spreadsheetId || "";
            const range = node.data?.range || "Sheet1!A1";
            const rowDataTemplate = node.data?.rowData || "[]";
            const apiKey = node.data?.apiKey || "";

            let rowValues: any[] = [];
            try {
              const interpolatedRowData = rowDataTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
                const val = resolveVariable(path, executionContext);
                return val !== undefined ? JSON.stringify(val) : "";
              });
              rowValues = JSON.parse(interpolatedRowData);
            } catch {
              rowValues = [rowDataTemplate];
            }

            if (spreadsheetId && apiKey) {
              try {
                let url = "";
                let method = "GET";
                let body: any = undefined;

                if (action === "APPEND_ROW") {
                  url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&key=${apiKey}`;
                  method = "POST";
                  body = JSON.stringify({ values: [rowValues] });
                } else {
                  url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
                  method = "GET";
                }

                const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
                const resData = await res.json();
                executionContext.steps[node.id] = { status: res.status, data: resData };
              } catch (err: any) {
                throw new Error(`Google Sheets API call failed in node '${node.id}': ${err.message}`);
              }
            } else {
              executionContext.steps[node.id] = {
                status: 200,
                simulated: true,
                action,
                spreadsheetId,
                range,
                values: rowValues,
              };
            }
            continue;
          }

          // G.3 TXT File Node Execution
          if (node.type === "txtFileNode" || node.type === "txtFile") {
            const action = node.data?.action || "WRITE_FILE";
            const rawPath = node.data?.filePath || "output.txt";
            const contentTemplate = node.data?.content || "";

            const interpolatedContent = typeof contentTemplate === "string"
              ? contentTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, pathStr: string) => {
                  const val = resolveVariable(pathStr, executionContext);
                  return val !== undefined ? (typeof val === "object" ? JSON.stringify(val) : String(val)) : "";
                })
              : JSON.stringify(contentTemplate);

            try {
              const fs = await import("node:fs/promises");
              const path = await import("node:path");

              const dataRootDir = path.resolve("data");
              const resolvedPath = path.resolve(dataRootDir, rawPath);

              // Path Traversal Security Shield
              if (!resolvedPath.startsWith(dataRootDir)) {
                throw new Error("Security Violation: Path traversal attack blocked. File operations are strictly restricted to the data directory.");
              }

              const dir = path.dirname(resolvedPath);
              await fs.mkdir(dir, { recursive: true });

              if (action === "READ_FILE") {
                const text = await fs.readFile(resolvedPath, "utf-8");
                executionContext.steps[node.id] = { success: true, action: "READ_FILE", content: text };
              } else if (action === "APPEND_FILE") {
                await fs.appendFile(resolvedPath, interpolatedContent + "\n", "utf-8");
                executionContext.steps[node.id] = { success: true, action: "APPEND_FILE", filePath: resolvedPath };
              } else {
                await fs.writeFile(resolvedPath, interpolatedContent, "utf-8");
                executionContext.steps[node.id] = { success: true, action: "WRITE_FILE", filePath: resolvedPath };
              }
            } catch (err: any) {
              throw new Error(`TXT File operation failed in node '${node.id}': ${err.message}`);
            }
            continue;
          }

          // G.4 AI Integration Node Execution
          if (node.type === "aiNode" || node.type === "ai") {
            const provider = (node.data?.provider || "groq").toLowerCase();
            const model = node.data?.model || (provider === "gemini" ? "gemini-1.5-flash" : provider === "claude" ? "claude-3-5-sonnet" : provider === "openai" ? "gpt-4o-mini" : "llama-3.3-70b-versatile");
            const apiKey = node.data?.apiKey || (provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || "");
            const systemPrompt = node.data?.systemPrompt || "You are a helpful AI assistant.";
            const userPromptTemplate = node.data?.prompt || "$request.body.prompt";

            const interpolatedPrompt = userPromptTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, pathStr: string) => {
              const val = resolveVariable(pathStr, executionContext);
              return val !== undefined ? (typeof val === "object" ? JSON.stringify(val) : String(val)) : "";
            });

            try {
              let aiResponseText = "";
              if (provider === "groq" || provider === "openai") {
                const endpoint = provider === "groq" ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
                const res = await fetch(endpoint, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model,
                    messages: [
                      { role: "system", content: systemPrompt },
                      { role: "user", content: interpolatedPrompt },
                    ],
                  }),
                });
                const resData = await res.json();
                aiResponseText = resData.choices?.[0]?.message?.content || JSON.stringify(resData);
              } else if (provider === "gemini") {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const res = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\n${interpolatedPrompt}` }] }],
                  }),
                });
                const resData = await res.json();
                aiResponseText = resData.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(resData);
              } else if (provider === "claude") {
                const endpoint = "https://api.anthropic.com/v1/messages";
                const res = await fetch(endpoint, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01",
                  },
                  body: JSON.stringify({
                    model,
                    system: systemPrompt,
                    messages: [{ role: "user", content: interpolatedPrompt }],
                    max_tokens: 1024,
                  }),
                });
                const resData = await res.json();
                aiResponseText = resData.content?.[0]?.text || JSON.stringify(resData);
              }

              executionContext.steps[node.id] = {
                provider,
                model,
                response: aiResponseText,
              };
            } catch (err: any) {
              throw new Error(`AI Integration node '${node.id}' failed: ${err.message}`);
            }
            continue;
          }

          // H. Response Node (Stops execution loop and replies)
          if (node.type === "responseNode" || node.type === "response") {
            const status = node.data?.statusCode || 200;
            let responseBody = node.data?.body;

            // 1. Process custom headers if defined
            const responseHeadersTemplate = node.data?.headers;
            if (responseHeadersTemplate) {
              try {
                const interpolatedHeaders = responseHeadersTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
                  const val = resolveVariable(path, executionContext);
                  return val !== undefined ? String(val) : "";
                });
                const parsedHeaders = JSON.parse(interpolatedHeaders);
                reply.headers(parsedHeaders);
              } catch (headerErr: any) {
                request.log.error(headerErr, "Failed to parse response headers");
              }
            }

            // 2. Process redirect if defined
            const redirectUrlTemplate = node.data?.redirectUrl;
            let redirectUrl: string | undefined = undefined;
            if (redirectUrlTemplate) {
              if (typeof redirectUrlTemplate === "string") {
                if (redirectUrlTemplate.startsWith("$") && !redirectUrlTemplate.includes(" ")) {
                  redirectUrl = resolveVariable(redirectUrlTemplate.slice(1), executionContext);
                } else {
                  redirectUrl = redirectUrlTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
                    const val = resolveVariable(path, executionContext);
                    return val !== undefined ? String(val) : "";
                  });
                }
              } else {
                redirectUrl = redirectUrlTemplate;
              }
            }

            // Resolve references if body points to context variable, e.g. "$steps.nodeId"
            if (
              !redirectUrl &&
              typeof responseBody === "string" &&
              responseBody.startsWith("$")
            ) {
              responseBody = resolveVariable(
                responseBody.slice(1),
                executionContext
              );
            }

            const latency = Date.now() - startTime;

            // Log successful execution audit trail using optimized batched queuing
            queueExecutionLog({
              workflowId: workflow.id,
              method,
              path: wildPath,
              responseStatus: redirectUrl ? (status === 200 ? 302 : status) : status,
              latencyMs: latency,
              requestPayload: JSON.stringify({
                query: request.query,
                body: request.body || {},
              }),
            });

            // Stream metrics via WebSockets in real-time
            if (fastify.io) {
              fastify.io.to(projectId).emit("metrics", {
                workflowId: workflow.id,
                method,
                path: wildPath,
                responseStatus: redirectUrl ? (status === 200 ? 302 : status) : status,
                latencyMs: latency,
                timestamp: new Date().toISOString(),
              });
            }

            if (redirectUrl) {
              return reply.status(status === 200 ? 302 : Number(status)).redirect(redirectUrl);
            }

            return reply.status(status).send(responseBody);
          }
        }

        // Fallback response if workflow completes without responseNode
        const executionTime = Date.now() - startTime;

        // Stream fallback metrics via WebSockets
        if (fastify.io) {
          fastify.io.to(projectId).emit("metrics", {
            workflowId: workflow.id,
            method,
            path: wildPath,
            responseStatus: 200,
            latencyMs: executionTime,
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(200).send({
          message: "Workflow executed successfully",
          latencyMs: executionTime,
        });
      } catch (err: any) {
        const latency = Date.now() - startTime;

        request.log.error(err);

        // Audit log database failure using optimized batched queuing
        if (matchedWorkflow) {
          queueExecutionLog({
            workflowId: matchedWorkflow.id,
            method,
            path: wildPath,
            responseStatus: 500,
            latencyMs: latency,
            errorDetails: err.message || "Unknown error during execution",
            requestPayload: JSON.stringify({
              query: request.query,
              body: request.body || {},
            }),
          });
        }

        // Stream error metrics via WebSockets in real-time
        if (fastify.io && matchedWorkflow) {
          fastify.io.to(projectId).emit("metrics", {
            workflowId: matchedWorkflow.id,
            method,
            path: wildPath,
            responseStatus: 500,
            latencyMs: latency,
            error: err.message || "Execution error",
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(500).send({
          error: "Workflow execution aborted",
          message: err.message,
        });
      }
    }
  );
}
