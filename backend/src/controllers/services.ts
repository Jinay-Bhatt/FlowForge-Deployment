import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../services/db.js";
import { invalidateWorkflowCache } from "../services/cache.js";
import { encrypt } from "../services/crypto.js";

interface AuthUserPayload {
  id: string;
  email: string;
}

async function verifyProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  return !!project;
}

// GET /projects/:projectId/services
export async function listServices(request: FastifyRequest, reply: FastifyReply) {
  const { projectId } = request.params as { projectId: string };
  const user = request.user as AuthUserPayload;
  try {
    const isOwner = await verifyProjectOwnership(projectId, user.id);
    if (!isOwner) return reply.status(403).send({ error: "Forbidden" });
    const services = await prisma.service.findMany({
      where: { projectId },
      include: { routes: true },
      orderBy: { createdAt: "desc" },
    });
    return reply.send(services);
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
}

// POST /projects/:projectId/services
export async function createService(request: FastifyRequest, reply: FastifyReply) {
  const { projectId } = request.params as { projectId: string };
  const { name, baseUrl, description } = request.body as { name: string; baseUrl: string; description?: string };
  const user = request.user as AuthUserPayload;
  if (!name || !baseUrl) return reply.status(400).send({ error: "name and baseUrl are required" });
  try {
    const isOwner = await verifyProjectOwnership(projectId, user.id);
    if (!isOwner) return reply.status(403).send({ error: "Forbidden" });
    const service = await prisma.service.create({ data: { projectId, name, baseUrl, description } });
    return reply.status(201).send(service);
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
}

// PUT /projects/:projectId/services/:serviceId
export async function updateService(request: FastifyRequest, reply: FastifyReply) {
  const { projectId, serviceId } = request.params as { projectId: string; serviceId: string };
  const { name, baseUrl, description, isActive } = request.body as any;
  const user = request.user as AuthUserPayload;
  try {
    const isOwner = await verifyProjectOwnership(projectId, user.id);
    if (!isOwner) return reply.status(403).send({ error: "Forbidden" });
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: { name, baseUrl, description, isActive },
    });
    return reply.send(service);
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
}

// DELETE /projects/:projectId/services/:serviceId
export async function deleteService(request: FastifyRequest, reply: FastifyReply) {
  const { projectId, serviceId } = request.params as { projectId: string; serviceId: string };
  const user = request.user as AuthUserPayload;
  try {
    const isOwner = await verifyProjectOwnership(projectId, user.id);
    if (!isOwner) return reply.status(403).send({ error: "Forbidden" });
    await prisma.service.delete({ where: { id: serviceId } });
    return reply.send({ message: "Service deleted" });
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
}

// POST /projects/:projectId/services/:serviceId/routes
export async function createServiceRoute(request: FastifyRequest, reply: FastifyReply) {
  const { projectId, serviceId } = request.params as { projectId: string; serviceId: string };
  const { path, method, targetService, description } = request.body as any;
  const user = request.user as AuthUserPayload;
  if (!path || !method || !targetService) return reply.status(400).send({ error: "path, method, targetService are required" });
  try {
    const isOwner = await verifyProjectOwnership(projectId, user.id);
    if (!isOwner) return reply.status(403).send({ error: "Forbidden" });
    const route = await prisma.serviceRoute.create({ data: { serviceId, path, method, targetService, description } });
    return reply.status(201).send(route);
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
}

// DELETE /projects/:projectId/services/:serviceId/routes/:routeId
export async function deleteServiceRoute(request: FastifyRequest, reply: FastifyReply) {
  const { routeId } = request.params as { routeId: string };
  try {
    await prisma.serviceRoute.delete({ where: { id: routeId } });
    return reply.send({ message: "Route deleted" });
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
}

// GET /workflows/:workflowId/gateway-config
export async function getGatewayConfig(request: FastifyRequest, reply: FastifyReply) {
  const { workflowId } = request.params as { workflowId: string };
  const user = request.user as AuthUserPayload;
  try {
    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId }, include: { project: true, gatewayConfig: true } });
    if (!workflow) return reply.status(404).send({ error: "Workflow not found" });
    if (workflow.project.ownerId !== user.id) return reply.status(403).send({ error: "Forbidden" });
    return reply.send(workflow.gatewayConfig || null);
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
}

// PUT /workflows/:workflowId/gateway-config
export async function upsertGatewayConfig(request: FastifyRequest, reply: FastifyReply) {
  const { workflowId } = request.params as { workflowId: string };
  const { requireJwt, requireApiKey, apiKeyValue, rateLimitLimit, rateLimitWindow, corsEnabled, allowedOrigins } = request.body as any;
  const user = request.user as AuthUserPayload;
  try {
    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId }, include: { project: true } });
    if (!workflow) return reply.status(404).send({ error: "Workflow not found" });
    if (workflow.project.ownerId !== user.id) return reply.status(403).send({ error: "Forbidden" });

    const existingConfig = await prisma.gatewayConfig.findUnique({ where: { workflowId } });
    
    let finalApiKeyValue = existingConfig?.apiKeyValue || null;
    if (requireApiKey) {
      if (apiKeyValue && apiKeyValue.trim() !== "") {
        finalApiKeyValue = encrypt(apiKeyValue);
      }
    } else {
      finalApiKeyValue = null;
    }

    const config = await prisma.gatewayConfig.upsert({
      where: { workflowId },
      create: { 
        workflowId, 
        requireJwt, 
        requireApiKey, 
        apiKeyValue: finalApiKeyValue, 
        rateLimitLimit, 
        rateLimitWindow, 
        corsEnabled, 
        allowedOrigins 
      },
      update: { 
        requireJwt, 
        requireApiKey, 
        apiKeyValue: finalApiKeyValue, 
        rateLimitLimit, 
        rateLimitWindow, 
        corsEnabled, 
        allowedOrigins 
      },
    });

    // Invalidate workflows cache for this project
    invalidateWorkflowCache(workflow.projectId);

    return reply.send(config);
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
}
