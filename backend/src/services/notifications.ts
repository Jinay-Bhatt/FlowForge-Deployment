import { prisma } from "./db.js";
import { getIO } from "../websocket.js";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
}

/**
 * Creates a persistent notification in PostgreSQL and broadcasts it
 * in real-time to the user's private WebSocket channel.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || "info",
        link: params.link || null,
        read: false,
      },
    });

    // Real-time broadcast via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${params.userId}`).emit("notification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Failed to create and dispatch notification:", error);
    return null;
  }
}
