import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../services/db.js";

interface AuthUserPayload {
  id: string;
  email: string;
}

export async function listNotifications(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = request.user as AuthUserPayload;

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);

    return reply.send({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function markAsRead(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const user = request.user as AuthUserPayload;

  try {
    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return reply.status(404).send({ error: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return reply.send({ notification: updated });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function markAllAsRead(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = request.user as AuthUserPayload;

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return reply.send({ message: "All notifications marked as read" });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function deleteNotification(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const user = request.user as AuthUserPayload;

  try {
    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return reply.status(404).send({ error: "Notification not found" });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return reply.send({ message: "Notification deleted" });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function clearAllNotifications(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = request.user as AuthUserPayload;

  try {
    await prisma.notification.deleteMany({
      where: { userId: user.id },
    });

    return reply.send({ message: "All notifications cleared" });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
