import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../services/db.js";
import { createNotification } from "../services/notifications.js";

interface AuthUserPayload {
  id: string;
  email: string;
}

export async function createProject(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { name, description } = request.body as {
    name?: string;
    description?: string;
  };
  const user = request.user as AuthUserPayload;

  if (!name) {
    return reply.status(400).send({
      error: "Bad Request: project name is required",
    });
  }

  try {
    // Enforce Plan Project Quota: Free plan allows max 5 projects; Pro plans are Unlimited
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    const userPlan = userProfile?.plan || "FREE";
    if (userPlan === "FREE") {
      const projectCount = await prisma.project.count({
        where: { ownerId: user.id },
      });
      if (projectCount >= 5) {
        return reply.status(403).send({
          error: "Project limit reached",
          message: "The Free plan is limited to 5 projects. Upgrade to Pro for unlimited project workspaces.",
          code: "PLAN_PROJECT_LIMIT_EXCEEDED",
          limit: 5,
          current: projectCount,
        });
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: user.id,
      },
    });

    // Real-time notification
    createNotification({
      userId: user.id,
      title: "Project Created",
      message: `Project "${project.name}" initialized and ready for visual API design.`,
      type: "success",
      link: `/projects/${project.id}/builder`,
    }).catch(() => {});

    return reply.status(201).send(project);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function listProjects(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = request.user as AuthUserPayload;

  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: user.id },
      include: {
        workflows: {
          select: {
            id: true,
            isPublished: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return reply.send(projects);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function getProject(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user as AuthUserPayload;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: user.id,
      },
      include: {
        workflows: true,
      },
    });

    if (!project) {
      return reply.status(404).send({
        error: "Not Found: Project not found or unauthorized",
      });
    }

    return reply.send(project);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function updateProject(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const { name, description } = request.body as {
    name?: string;
    description?: string;
  };
  const user = request.user as AuthUserPayload;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: user.id,
      },
    });

    if (!project) {
      return reply.status(404).send({
        error: "Not Found: Project not found or unauthorized",
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name ?? project.name,
        description: description ?? project.description,
      },
    });

    return reply.send(updatedProject);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function deleteProject(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const user = request.user as AuthUserPayload;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: user.id,
      },
    });

    if (!project) {
      return reply.status(404).send({
        error: "Not Found: Project not found or unauthorized",
      });
    }

    await prisma.project.delete({
      where: { id },
    });

    return reply.send({
      message: "Project and associated workflows deleted successfully",
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
