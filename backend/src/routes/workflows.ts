import { FastifyInstance } from "fastify";
import {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  publishWorkflow,
  createWorkflowVersion,
} from "../controllers/workflows.js";
import { authenticate } from "../middlewares/auth.js";

export async function workflowRoutes(fastify: FastifyInstance) {
  // Enforce JWT validation check for all endpoints registered inside this plugin
  fastify.addHook("preHandler", authenticate);

  fastify.post("/projects/:projectId/workflows", createWorkflow);
  fastify.get("/projects/:projectId/workflows", listWorkflows);
  fastify.get("/workflows/:id", getWorkflow);
  fastify.put("/workflows/:id", updateWorkflow);
  fastify.delete("/workflows/:id", deleteWorkflow);
  fastify.post("/workflows/:id/publish", publishWorkflow);
  fastify.post("/workflows/:id/version", createWorkflowVersion);
}
