import { FastifyInstance } from "fastify";
import { authenticate } from "../middlewares/auth.js";
import { getAnalytics, getLogs } from "../controllers/analytics.js";

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authenticate);

  // GET /projects/:projectId/analytics
  fastify.get("/projects/:projectId/analytics", getAnalytics);

  // GET /projects/:projectId/logs
  fastify.get("/projects/:projectId/logs", getLogs);
}
