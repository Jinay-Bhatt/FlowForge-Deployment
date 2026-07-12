import { FastifyInstance } from "fastify";
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} from "../controllers/projects.js";
import { authenticate } from "../middlewares/auth.js";

export async function projectRoutes(fastify: FastifyInstance) {
  // Enforce JWT validation check for all endpoints registered inside this plugin
  fastify.addHook("preHandler", authenticate);

  fastify.post("/projects", createProject);
  fastify.get("/projects", listProjects);
  fastify.get("/projects/:id", getProject);
  fastify.put("/projects/:id", updateProject);
  fastify.delete("/projects/:id", deleteProject);
}
