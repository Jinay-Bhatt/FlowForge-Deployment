import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../services/db.js";
import { invalidateWorkflowCache } from "../services/cache.js";
import { createNotification } from "../services/notifications.js";

interface AuthUserPayload {
  id: string;
  email: string;
}

// Helper to verify user owns the project associated with a workflow or directly
async function verifyProjectOwnership(
  projectId: string,
  userId: string
): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  return !!project;
}

export async function createWorkflow(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { projectId } = request.params as { projectId: string };
  const { name, path, method, nodes, edges } = request.body as {
    name?: string;
    path?: string;
    method?: string;
    nodes?: any[];
    edges?: any[];
  };
  const user = request.user as AuthUserPayload;

  if (!name || !path || !method) {
    return reply.status(400).send({
      error: "Bad Request: name, path, and method are required",
    });
  }

  try {
    const isOwner = await verifyProjectOwnership(projectId, user.id);
    if (!isOwner) {
      return reply.status(403).send({
        error: "Forbidden: You do not own this project",
      });
    }

    // Check if the unique constraint (projectId + path + method) is violated
    const existingWorkflow = await prisma.workflow.findFirst({
      where: { projectId, path, method },
    });

    if (existingWorkflow) {
      return reply.status(409).send({
        error: `Conflict: Workflow route '${method} ${path}' already exists in this project`,
      });
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        path,
        method,
        nodes: nodes !== undefined ? nodes : [],
        edges: edges !== undefined ? edges : [],
        projectId,
      },
    });

    // Invalidate workflows cache for this project
    invalidateWorkflowCache(projectId);

    return reply.status(201).send(workflow);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function listWorkflows(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { projectId } = request.params as { projectId: string };
  const user = request.user as AuthUserPayload;

  try {
    const isOwner = await verifyProjectOwnership(projectId, user.id);
    if (!isOwner) {
      return reply.status(403).send({
        error: "Forbidden: You do not own this project",
      });
    }

    const workflows = await prisma.workflow.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return reply.send(workflows);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function getWorkflow(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const user = request.user as AuthUserPayload;

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { project: true, gatewayConfig: true, versions: true },
    });

    if (!workflow) {
      return reply.status(404).send({
        error: "Not Found: Workflow not found",
      });
    }

    if (workflow.project.ownerId !== user.id) {
      return reply.status(403).send({
        error: "Forbidden: You do not own this workflow",
      });
    }

    return reply.send(workflow);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function updateWorkflow(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const { name, path, method, nodes, edges, isPublished } = request.body as {
    name?: string;
    path?: string;
    method?: string;
    nodes?: any[];
    edges?: any[];
    isPublished?: boolean;
  };
  const user = request.user as AuthUserPayload;

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!workflow) {
      return reply.status(404).send({
        error: "Not Found: Workflow not found",
      });
    }

    if (workflow.project.ownerId !== user.id) {
      return reply.status(403).send({
        error: "Forbidden: You do not own this workflow",
      });
    }

    // Check unique constraint if route path/method is being changed
    if (
      (path && path !== workflow.path) ||
      (method && method !== workflow.method)
    ) {
      const existingRoute = await prisma.workflow.findFirst({
        where: {
          projectId: workflow.projectId,
          path: path ?? workflow.path,
          method: method ?? workflow.method,
          id: { not: id },
        },
      });

      if (existingRoute) {
        return reply.status(409).send({
          error: `Conflict: Workflow route '${method ?? workflow.method} ${
            path ?? workflow.path
          }' already exists in this project`,
        });
      }
    }

    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: {
        name: name ?? workflow.name,
        path: path ?? workflow.path,
        method: method ?? workflow.method,
        nodes: nodes !== undefined ? nodes : (workflow.nodes as any),
        edges: edges !== undefined ? edges : (workflow.edges as any),
        isPublished:
          isPublished !== undefined ? isPublished : workflow.isPublished,
      },
    });

    // Invalidate workflows cache for this project
    invalidateWorkflowCache(workflow.projectId);

    return reply.send(updatedWorkflow);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function deleteWorkflow(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const user = request.user as AuthUserPayload;

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!workflow) {
      return reply.status(404).send({
        error: "Not Found: Workflow not found",
      });
    }

    if (workflow.project.ownerId !== user.id) {
      return reply.status(403).send({
        error: "Forbidden: You do not own this workflow",
      });
    }

    await prisma.workflow.delete({
      where: { id },
    });

    // Invalidate workflows cache for this project
    invalidateWorkflowCache(workflow.projectId);

    return reply.send({
      message: "Workflow deleted successfully",
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function publishWorkflow(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const { isPublished } = request.body as { isPublished?: boolean };
  const user = request.user as AuthUserPayload;

  if (isPublished === undefined) {
    return reply.status(400).send({
      error: "Bad Request: isPublished boolean flag is required",
    });
  }

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!workflow) {
      return reply.status(404).send({
        error: "Not Found: Workflow not found",
      });
    }

    if (workflow.project.ownerId !== user.id) {
      return reply.status(403).send({
        error: "Forbidden: You do not own this workflow",
      });
    }

    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: { isPublished },
    });

    // Invalidate workflows cache for this project
    invalidateWorkflowCache(workflow.projectId);

    createNotification({
      userId: user.id,
      title: isPublished ? "Workflow Published" : "Workflow Unpublished",
      message: isPublished
        ? `Endpoint ${workflow.method} ${workflow.path} is now live on the gateway.`
        : `Endpoint ${workflow.method} ${workflow.path} has been unpublished.`,
      type: isPublished ? "success" : "info",
      link: `/projects/${workflow.projectId}/builder`,
    }).catch(() => {});

    return reply.send({
      message: `Workflow ${
        isPublished ? "published" : "unpublished"
      } successfully`,
      workflow: updatedWorkflow,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function createWorkflowVersion(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const { changelog } = request.body as { changelog?: string };
  const user = request.user as AuthUserPayload;

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!workflow) {
      return reply.status(404).send({
        error: "Not Found: Workflow not found",
      });
    }

    if (workflow.project.ownerId !== user.id) {
      return reply.status(403).send({
        error: "Forbidden: You do not own this workflow",
      });
    }

    const lastVersion = await prisma.workflowVersion.findFirst({
      where: { workflowId: id },
      orderBy: { versionNumber: "desc" },
    });

    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    const version = await prisma.workflowVersion.create({
      data: {
        workflowId: id,
        versionNumber,
        nodes: workflow.nodes || [],
        edges: workflow.edges || [],
        changelog,
      },
    });

    createNotification({
      userId: user.id,
      title: "Version Snapshot Created",
      message: `Snapshot v${versionNumber} created for "${workflow.name}"${changelog ? `: ${changelog}` : "."}`,
      type: "info",
      link: `/projects/${workflow.projectId}/builder`,
    }).catch(() => {});

    return reply.status(201).send(version);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
