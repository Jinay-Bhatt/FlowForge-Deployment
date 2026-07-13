import { prisma } from "./db.js";
import { runInSandbox } from "./sandbox.js";
import { orderNodes, resolveVariable, parameterizeSqlQuery } from "./dag.js";
import { decrypt } from "./crypto.js";
import { queueExecutionLog } from "./logger.js";

/**
 * Checks if a given Date matches a standard 5-field cron expression.
 * Supports: *, step intervals (like slash-5), lists (1,2,3), and exact matches.
 */
export function matchCron(cron: string, date: Date): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minute, hour, dom, month, dow] = parts;
  const m = date.getMinutes();
  const h = date.getHours();
  const d = date.getDate();
  const mon = date.getMonth() + 1; // 0-indexed in JS
  const w = date.getDay(); // 0 is Sunday in JS

  return (
    matchPart(minute, m) &&
    matchPart(hour, h) &&
    matchPart(dom, d) &&
    matchPart(month, mon) &&
    matchPart(dow, w)
  );
}

function matchPart(pattern: string, val: number): boolean {
  if (pattern === "*") return true;
  if (pattern.includes(",")) {
    return pattern.split(",").map(s => parseInt(s.trim(), 10)).includes(val);
  }
  if (pattern.startsWith("*/")) {
    const step = parseInt(pattern.slice(2), 10);
    return val % step === 0;
  }
  return parseInt(pattern, 10) === val;
}

/**
 * Starts the background interval loop checking and executing scheduled workflows.
 */
export function initScheduler(fastify: any) {
  console.log("⏰ FlowForge Scheduler: Background cron engine initialized");

  // Run scheduler check every minute
  setInterval(async () => {
    const now = new Date();
    // Align with minute boundary
    if (now.getSeconds() !== 0) {
      // Ensure we check once a minute by executing only around the 0-10 second mark
      if (now.getSeconds() > 10) return;
    }

    try {
      // Find all published workflows with a scheduledNode trigger
      const workflows = await prisma.workflow.findMany({
        where: { isPublished: true },
        include: { project: true, gatewayConfig: true }
      });

      for (const w of workflows) {
        const nodes = (w.nodes as any[]) || [];
        const schedTrigger = nodes.find(n => n.type === "scheduledNode");
        if (!schedTrigger) continue;

        const cronExpr = schedTrigger.data?.cron || "0 * * * *";
        if (matchCron(cronExpr, now)) {
          console.log(`⏰ Scheduler: Executing active cron workflow "${w.name}" (${cronExpr})`);
          executeScheduledWorkflow(w, schedTrigger.id, fastify);
        }
      }
    } catch (err: any) {
      console.error("❌ Scheduler error in check loop:", err.message);
    }
  }, 10000); // Check every 10 seconds to catch the start of each minute reliably
}

/**
 * Executes a single scheduled workflow in the background.
 */
async function executeScheduledWorkflow(workflow: any, triggerNodeId: string, fastify: any) {
  const startTime = Date.now();
  const projectId = workflow.projectId;
  const method = "CRON";
  const path = workflow.path;

  try {
    const executionContext = {
      request: {
        body: {},
        query: {},
        params: {},
        headers: { host: "localhost", "user-agent": "FlowForge-Cron-Engine" }
      },
      steps: {} as Record<string, any>
    };

    const nodes = (workflow.nodes as any[]) || [];
    const edges = (workflow.edges as any[]) || [];
    const orderedNodes = orderNodes(nodes, edges);
    const skippedNodeIds = new Set<string>();

    for (const node of orderedNodes) {
      if (skippedNodeIds.has(node.id)) {
        for (const edge of edges) {
          if (edge.source === node.id) {
            skippedNodeIds.add(edge.target);
          }
        }
        continue;
      }

      // Scheduled Trigger Node
      if (node.id === triggerNodeId) {
        executionContext.steps[node.id] = { status: "triggered", cronRun: true };
        continue;
      }

      // Skip other trigger nodes
      if (
        node.type === "triggerNode" ||
        node.type === "httpTrigger" ||
        node.type === "trigger" ||
        node.type === "webhookNode" ||
        node.type === "webhook" ||
        node.type === "scheduledNode" ||
        node.type === "scheduled"
      ) {
        executionContext.steps[node.id] = { status: "skipped-alternative-trigger" };
        continue;
      }

      // Database Query Node
      if (node.type === "databaseNode" || node.type === "database") {
        const queryTemplate = node.data?.query;
        if (!queryTemplate) throw new Error(`Database node '${node.id}' missing query`);
        const { sql, values } = parameterizeSqlQuery(queryTemplate, executionContext);
        const dbResult = await prisma.$queryRawUnsafe(sql, ...values);
        executionContext.steps[node.id] = dbResult;
        continue;
      }

      // Custom Code Node
      if (node.type === "customCodeNode" || node.type === "code") {
        const scriptCode = node.data?.code;
        if (!scriptCode) throw new Error(`Code node '${node.id}' missing JS code`);
        const runResult = runInSandbox(scriptCode, executionContext);
        if (!runResult.success) throw new Error(`Script Error in '${node.id}': ${runResult.error}`);
        // Await the result if sandbox returned a Promise (async code using require/fetch)
        const resolvedData = runResult.data && typeof runResult.data.then === "function"
          ? await runResult.data
          : runResult.data;
        executionContext.steps[node.id] = resolvedData;
        continue;
      }

      // If / Else Node
      if (node.type === "ifElseNode" || node.type === "ifelse") {
        const conditionExpr = node.data?.condition || "false";
        const runResult = runInSandbox(`result = Boolean(${conditionExpr});`, executionContext);
        if (!runResult.success) throw new Error(`Condition Error in '${node.id}': ${runResult.error}`);
        const conditionValue = !!runResult.data;
        executionContext.steps[node.id] = conditionValue;

        for (const edge of edges) {
          if (edge.source === node.id) {
            const handle = edge.sourceHandle;
            if (handle === "true" && !conditionValue) skippedNodeIds.add(edge.target);
            else if (handle === "false" && conditionValue) skippedNodeIds.add(edge.target);
          }
        }
        continue;
      }

      // Switch Case Node
      if (node.type === "switchCaseNode" || node.type === "switchcase" || node.type === "switchCase") {
        const expr = node.data?.expression || "undefined";
        const cases = node.data?.cases || ["default"];
        const runResult = runInSandbox(`result = (${expr});`, executionContext);
        if (!runResult.success) throw new Error(`Switch Error in '${node.id}': ${runResult.error}`);
        const matchedValue = String(runResult.data);
        executionContext.steps[node.id] = runResult.data;

        const hasMatch = cases.filter((c: string) => c !== "default").includes(matchedValue);
        const activeBranch = hasMatch ? matchedValue : "default";

        for (const edge of edges) {
          if (edge.source === node.id) {
            const handle = edge.sourceHandle || "default";
            if (handle !== activeBranch) skippedNodeIds.add(edge.target);
          }
        }
        continue;
      }

      // Outgoing HTTP Client Node
      if (node.type === "httpClientNode" || node.type === "httpclient" || node.type === "httpClient") {
        const urlTemplate = node.data?.url;
        if (!urlTemplate) throw new Error(`HTTP Client node '${node.id}' missing target URL`);
        const clientMethod = node.data?.method || "GET";

        const interpolatedUrl = urlTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
          const val = resolveVariable(path, executionContext);
          return val !== undefined ? String(val) : "";
        });

        let headers: Record<string, string> = {};
        const headersTemplate = node.data?.headers;
        if (headersTemplate) {
          const interpolatedHeaders = headersTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
            const val = resolveVariable(path, executionContext);
            return val !== undefined ? String(val) : "";
          });
          headers = JSON.parse(interpolatedHeaders);
        }

        let requestBody: any = undefined;
        const bodyTemplate = node.data?.body;
        if (bodyTemplate) {
          if (typeof bodyTemplate === "string") {
            if (bodyTemplate.startsWith("$") && !bodyTemplate.includes(" ")) {
              requestBody = resolveVariable(bodyTemplate.slice(1), executionContext);
            } else {
              requestBody = bodyTemplate.replace(/\$([a-zA-Z0-9_\.]+)/g, (match: string, path: string) => {
                const val = resolveVariable(path, executionContext);
                return val !== undefined ? String(val) : "";
              });
            }
          } else {
            requestBody = bodyTemplate;
          }
        }

        const fetchOptions: any = {
          method: clientMethod,
          headers: { "Content-Type": "application/json", ...headers }
        };
        if (["POST", "PUT", "PATCH", "DELETE"].includes(clientMethod.toUpperCase()) && requestBody !== undefined) {
          fetchOptions.body = typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody);
        }

        const res = await fetch(interpolatedUrl, fetchOptions);
        let responseData: any = null;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) responseData = await res.json();
        else responseData = await res.text();

        executionContext.steps[node.id] = {
          status: res.status,
          statusText: res.statusText,
          data: responseData
        };
        continue;
      }

      // Transform Node
      if (node.type === "transformNode" || node.type === "transform") {
        const mappingExpr = node.data?.mapping || "{}";
        const runResult = runInSandbox(`result = (${mappingExpr});`, executionContext);
        if (!runResult.success) throw new Error(`Transform Error in '${node.id}': ${runResult.error}`);
        executionContext.steps[node.id] = runResult.data;
        continue;
      }

      // JWT Validate Node
      if (node.type === "jwtValidateNode" || node.type === "jwtValidate") {
        executionContext.steps[node.id] = { status: "skipped-in-cron-context" };
        continue;
      }

      // API Key Node
      if (node.type === "apiKeyNode" || node.type === "apiKey") {
        executionContext.steps[node.id] = { status: "skipped-in-cron-context" };
        continue;
      }

      // Response Node (Cron execution successfully completes)
      if (node.type === "responseNode" || node.type === "response") {
        const status = node.data?.statusCode || 200;
        const latency = Date.now() - startTime;

        // Queue execution log to db (batched)
        queueExecutionLog({
          workflowId: workflow.id,
          method,
          path,
          responseStatus: status,
          latencyMs: latency,
          requestPayload: JSON.stringify({ cronTriggered: true })
        });

        // Broadcast stats via Websockets
        if (fastify.io) {
          fastify.io.to(projectId).emit("metrics", {
            workflowId: workflow.id,
            method,
            path,
            responseStatus: status,
            latencyMs: latency,
            timestamp: new Date().toISOString()
          });
        }
        return;
      }
    }

    // Queue execution log to db (batched)
    const latency = Date.now() - startTime;
    queueExecutionLog({
      workflowId: workflow.id,
      method,
      path,
      responseStatus: 200,
      latencyMs: latency,
      requestPayload: JSON.stringify({ cronTriggered: true })
    });

    if (fastify.io) {
      fastify.io.to(projectId).emit("metrics", {
        workflowId: workflow.id,
        method,
        path,
        responseStatus: 200,
        latencyMs: latency,
        timestamp: new Date().toISOString()
      });
    }
  } catch (err: any) {
    const latency = Date.now() - startTime;
    console.error(`❌ Cron Execution failed for "${workflow.name}":`, err.message);

    queueExecutionLog({
      workflowId: workflow.id,
      method,
      path,
      responseStatus: 500,
      latencyMs: latency,
      errorDetails: err.message || "Cron job execution failed",
      requestPayload: JSON.stringify({ cronTriggered: true })
    });

    if (fastify.io) {
      fastify.io.to(projectId).emit("metrics", {
        workflowId: workflow.id,
        method,
        path,
        responseStatus: 500,
        latencyMs: latency,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}
