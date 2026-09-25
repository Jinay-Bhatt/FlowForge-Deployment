import { FastifyInstance } from "fastify";
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notifications.js";
import { authenticate } from "../middlewares/auth.js";

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/notifications", listNotifications);
  fastify.patch("/notifications/:id/read", markAsRead);
  fastify.post("/notifications/read-all", markAllAsRead);
  fastify.delete("/notifications/:id", deleteNotification);
  fastify.delete("/notifications/clear-all", clearAllNotifications);
}
