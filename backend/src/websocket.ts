import { Server } from "socket.io";
import { FastifyInstance } from "fastify";

/**
 * Initializes the Socket.IO server and binds it to the Fastify HTTP server instance.
 * Decorates the Fastify instance with the Socket.IO server manager.
 */
let ioInstance: Server | null = null;

export function getIO(): Server | null {
  return ioInstance;
}

export function initWebsocket(fastify: FastifyInstance): Server {
  const io = new Server(fastify.server, {
    cors: {
      origin: "*", // Allow all origins for visual client testing
      methods: ["GET", "POST"],
    },
  });

  ioInstance = io;

  // Intercept all room-based emits to clone and broadcast metrics globally
  const originalTo = io.to.bind(io);
  io.to = (room: any) => {
    const operator = originalTo(room);
    const originalEmit = operator.emit.bind(operator);
    
    operator.emit = (ev: string, ...args: any[]) => {
      const result = originalEmit(ev, ...args);
      // Automatically clone metrics broadcasts to a global channel for landing page telemetry
      if (ev === "metrics") {
        io.emit("global-metrics", ...args);
      }
      return result;
    };
    
    return operator;
  };

  io.on("connection", (socket) => {
    fastify.log.info(`🔌 Client connected to WebSocket: ${socket.id}`);

    // Immediately send connection count to the fresh client
    socket.emit("global-connections", {
      count: io.engine.clientsCount,
    });
    
    // Broadcast updated connection count to all other clients
    io.emit("global-connections", {
      count: io.engine.clientsCount,
    });

    // Join a room associated with the project for scoped metrics broadcasts
    socket.on("join-project", (projectId: string) => {
      if (!projectId) return;
      socket.join(projectId);
      fastify.log.info(
        `👤 Client ${socket.id} joined project room: ${projectId}`
      );
    });

    // Join a private user room for scoped real-time notifications
    socket.on("join-user", (userId: string) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
      fastify.log.info(
        `👤 Client ${socket.id} joined user room: user:${userId}`
      );
    });

    socket.on("disconnect", () => {
      fastify.log.info(`🔌 Client disconnected from WebSocket: ${socket.id}`);
      // Broadcast updated connection count when client disconnects
      io.emit("global-connections", {
        count: io.engine.clientsCount,
      });
    });
  });

  // Periodically keep connections count synced (fallback check)
  setInterval(() => {
    io.emit("global-connections", {
      count: io.engine.clientsCount,
    });
  }, 5000);

  // Decorate the fastify instance with the io instance
  fastify.decorate("io", io);

  return io;
}

// Augment FastifyInstance type to support typescript type-checks for decorators
declare module "fastify" {
  interface FastifyInstance {
    io: Server;
  }
}
