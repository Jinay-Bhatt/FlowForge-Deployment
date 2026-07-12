import { prisma } from "./db.js";

interface QueueLogData {
  workflowId: string;
  method: string;
  path: string;
  responseStatus: number;
  latencyMs: number;
  errorDetails?: string;
  requestPayload?: string;
}

const logQueue: QueueLogData[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const BATCH_SIZE_LIMIT = 100;
const FLUSH_INTERVAL_MS = 2000; // 2 seconds

async function flushLogs() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (logQueue.length === 0) return;

  // Drain the queue completely
  const logsToFlush = logQueue.splice(0, logQueue.length);

  try {
    // Perform bulk insertion using Prisma createMany (natively optimized in Postgres)
    await prisma.executionLog.createMany({
      data: logsToFlush,
    });
  } catch (error) {
    console.error("Failed to flush execution logs batch to database:", error);
  }
}

/**
 * Queues execution logs for batched high-performance bulk database writes.
 * This prevents connection pool exhaustion and database saturation under load.
 */
export function queueExecutionLog(log: QueueLogData) {
  logQueue.push(log);

  // Trigger immediate flush if batch size is reached
  if (logQueue.length >= BATCH_SIZE_LIMIT) {
    setImmediate(() => {
      flushLogs().catch((err) => console.error("Async execution logs flush error:", err));
    });
  } else if (!flushTimeout) {
    // Otherwise flush periodically
    flushTimeout = setTimeout(() => {
      flushLogs().catch((err) => console.error("Async execution logs flush error:", err));
    }, FLUSH_INTERVAL_MS);
  }
}
