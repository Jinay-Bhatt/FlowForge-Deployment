import { prisma } from "./db.js";

interface CacheEntry {
  data: any[];
  expiresAt: number;
}

// Bounded in-memory LRU cache for published workflows
const MAX_CACHE_SIZE = 5000;
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL
const workflowCache = new Map<string, CacheEntry>();

// Periodic GC sweep for expired cache keys
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of workflowCache.entries()) {
    if (now > entry.expiresAt) {
      workflowCache.delete(key);
    }
  }
}, 60000);

/**
 * Fetches all published workflows for a project from the ultra-fast in-memory cache.
 * Falls back to querying database and caching when missing or expired.
 */
export async function getCachedWorkflows(projectId: string) {
  const now = Date.now();
  const cached = workflowCache.get(projectId);

  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  // Cache miss or expired — query database
  const workflows = await prisma.workflow.findMany({
    where: {
      projectId,
      isPublished: true,
    },
    include: {
      gatewayConfig: true,
    },
  });

  // LRU Eviction guard if cache exceeds max size
  if (workflowCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = workflowCache.keys().next().value;
    if (oldestKey) workflowCache.delete(oldestKey);
  }

  workflowCache.set(projectId, {
    data: workflows,
    expiresAt: now + DEFAULT_TTL_MS,
  });

  return workflows;
}

/**
 * Invalidates the cached workflows for a specific project upon update/publish.
 */
export function invalidateWorkflowCache(projectId: string) {
  workflowCache.delete(projectId);
}
