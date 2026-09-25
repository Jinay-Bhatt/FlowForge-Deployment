import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../services/db.js";

interface AuthUserPayload {
  id: string;
  email: string;
}

// GET /projects/:projectId/analytics?workflowId=&range=7d|30d|24h
export async function getAnalytics(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { projectId } = request.params as { projectId: string };
  const { workflowId, range } = request.query as {
    workflowId?: string;
    range?: string;
  };
  const user = request.user as AuthUserPayload;

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: user.id },
    });
    if (!project) {
      return reply.status(404).send({ error: "Project not found or unauthorized" });
    }

    // Determine date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // 7d
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build where clause for logs
    const logsWhere: any = {
      workflow: { projectId },
      createdAt: { gte: startDate },
    };
    if (workflowId) logsWhere.workflowId = workflowId;

    // Fetch raw execution logs for aggregation
    const logs = await prisma.executionLog.findMany({
      where: logsWhere,
      select: {
        createdAt: true,
        responseStatus: true,
        latencyMs: true,
        workflowId: true,
        path: true,
        method: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Aggregate by day
    const dayMap = new Map<
      string,
      { requests: number; errors: number; latencies: number[] }
    >();
    const hourMap = new Map<number, number>(); // hour -> count
    const routeMap = new Map<string, number>();

    for (const log of logs) {
      const dayKey = log.createdAt.toISOString().split("T")[0];
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, { requests: 0, errors: 0, latencies: [] });
      }
      const day = dayMap.get(dayKey)!;
      day.requests++;
      if (log.responseStatus >= 400) day.errors++;
      day.latencies.push(log.latencyMs);

      // Hour distribution
      const hour = log.createdAt.getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);

      // Route breakdown
      const routeKey = `${log.method} ${log.path}`;
      routeMap.set(routeKey, (routeMap.get(routeKey) || 0) + 1);
    }

    // Format daily trend
    const dailyTrend = Array.from(dayMap.entries()).map(([date, stats]) => ({
      date,
      requests: stats.requests,
      errors: stats.errors,
      successRate:
        stats.requests > 0
          ? Math.round(((stats.requests - stats.errors) / stats.requests) * 100)
          : 100,
      avgLatency:
        stats.latencies.length > 0
          ? Math.round(
              stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length
            )
          : 0,
    }));

    // Format hourly distribution (heatmap data)
    const hourlyDistribution = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourMap.get(h) || 0,
    }));

    // Top routes
    const topRoutes = Array.from(routeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([route, count]) => ({ route, count }));

    // Summary stats
    const totalRequests = logs.length;
    const totalErrors = logs.filter((l: any) => l.responseStatus >= 400).length;
    const allLatencies = logs.map((l: any) => l.latencyMs).sort((a: number, b: number) => a - b);
    const avgLatency =
      allLatencies.length > 0
        ? Math.round(
            allLatencies.reduce((a: number, b: number) => a + b, 0) / allLatencies.length
          )
        : 0;
    const p95Latency =
      allLatencies.length > 0
        ? allLatencies[Math.floor(allLatencies.length * 0.95)]
        : 0;

    return reply.send({
      summary: {
        totalRequests,
        totalErrors,
        successRate:
          totalRequests > 0
            ? Math.round(((totalRequests - totalErrors) / totalRequests) * 100)
            : 100,
        avgLatency,
        p95Latency,
        errorRate:
          totalRequests > 0
            ? Math.round((totalErrors / totalRequests) * 100)
            : 0,
      },
      dailyTrend,
      hourlyDistribution,
      topRoutes,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error", details: error.message });
  }
}

// GET /projects/:projectId/logs?workflowId=&limit=&page=
export async function getLogs(request: FastifyRequest, reply: FastifyReply) {
  const { projectId } = request.params as { projectId: string };
  const { workflowId, limit = "50", page = "1", status } = request.query as {
    workflowId?: string;
    limit?: string;
    page?: string;
    status?: string;
  };
  const user = request.user as AuthUserPayload;

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: user.id },
      include: { owner: { select: { plan: true } } },
    });
    if (!project) {
      return reply.status(404).send({ error: "Project not found or unauthorized" });
    }

    const isPro = project.owner?.plan === "PRO_MONTHLY" || project.owner?.plan === "PRO_YEARLY";
    const maxAllowed = isPro ? 200 : 10;
    const take = Math.min(parseInt(limit) || 50, maxAllowed);
    const skip = (parseInt(page) - 1) * take;

    const where: any = { workflow: { projectId } };
    if (workflowId) where.workflowId = workflowId;
    if (status === "error") where.responseStatus = { gte: 400 };
    if (status === "success") where.responseStatus = { lt: 400 };

    const [logs, rawTotal] = await Promise.all([
      prisma.executionLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          workflow: { select: { name: true, method: true, path: true } },
        },
      }),
      prisma.executionLog.count({ where }),
    ]);

    const total = isPro ? rawTotal : Math.min(rawTotal, 10);

    return reply.send({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        pages: Math.ceil(total / take),
        isLimited: !isPro,
        plan: project.owner?.plan || "FREE",
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error", details: error.message });
  }
}
