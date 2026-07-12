import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';

export async function runHealthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'FlowForge Backend Template is connected and running!',
    };
  });

  fastify.get('/public-stats', async (request, reply) => {
    try {
      const totalProjects = await prisma.project.count();
      const totalWorkflows = await prisma.workflow.count();
      const totalRequests = await prisma.executionLog.count();
      
      const avgLatencyResult = await prisma.executionLog.aggregate({
        _avg: {
          latencyMs: true
        }
      });
      const avgLatency = Math.round(avgLatencyResult._avg.latencyMs || 0);

      return {
        status: 'success',
        totalProjects,
        totalWorkflows,
        totalRequests,
        avgLatency,
      };
    } catch (err: any) {
      fastify.log.error(err);
      return {
        status: 'error',
        message: err.message,
        totalProjects: 0,
        totalWorkflows: 0,
        totalRequests: 0,
        avgLatency: 0,
      };
    }
  });
}
