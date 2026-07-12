import { prisma } from "./db.js";

// In-memory cache for published workflows, keyed by projectId
const workflowCache = new Map<string, any[]>();

/**
 * Fetches all published workflows for a project from the cache.
 * Falls back to querying the database and caching the result if not cached.
 */
export async function getCachedWorkflows(projectId: string) {
  let cached = workflowCache.get(projectId);
  if (!cached) {
    console.log(`[Cache Miss] Loading published workflows for project: ${projectId}`);
    cached = await prisma.workflow.findMany({
      where: {
        projectId,
        isPublished: true,
      },
      include: {
        gatewayConfig: true,
      },
    });
    workflowCache.set(projectId, cached);
  } else {
    console.log(`[Cache Hit] Returning workflows from cache for project: ${projectId}`);
  }
  return cached;
}

/**
 * Invalidates the cached workflows for a specific project.
 */
export function invalidateWorkflowCache(projectId: string) {
  console.log(`[Cache Invalidation] Clearing cache for project: ${projectId}`);
  workflowCache.delete(projectId);
}
