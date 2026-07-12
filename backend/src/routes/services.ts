import { FastifyInstance } from "fastify";
import { authenticate } from "../middlewares/auth.js";
import {
  listServices, createService, updateService, deleteService,
  createServiceRoute, deleteServiceRoute,
  getGatewayConfig, upsertGatewayConfig,
} from "../controllers/services.js";

export async function servicesRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/projects/:projectId/services", listServices);
  fastify.post("/projects/:projectId/services", createService);
  fastify.put("/projects/:projectId/services/:serviceId", updateService);
  fastify.delete("/projects/:projectId/services/:serviceId", deleteService);
  fastify.post("/projects/:projectId/services/:serviceId/routes", createServiceRoute);
  fastify.delete("/projects/:projectId/services/:serviceId/routes/:routeId", deleteServiceRoute);

  // Gateway config
  fastify.get("/workflows/:workflowId/gateway-config", getGatewayConfig);
  fastify.put("/workflows/:workflowId/gateway-config", upsertGatewayConfig);
}
