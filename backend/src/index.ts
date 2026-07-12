import { config } from './config/index.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { runHealthRoutes } from './routes/health.js';
import { prisma } from './services/db.js';
import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { workflowRoutes } from './routes/workflows.js';
import { exportRoutes } from './routes/exporter.js';
import { gatewayRoutes } from './routes/gateway.js';
import { gitRoutes } from './routes/git.js';
import { analyticsRoutes } from './routes/analytics.js';
import { servicesRoutes } from './routes/services.js';
import { aiRoutes } from './routes/ai.js';
import { startWorker, setRedisStatus } from './queue/worker.js';
import { initializeQueue } from './queue/exportQueue.js';
import { checkRedisConnection } from './queue/redisCheck.js';
import { initWebsocket } from './websocket.js';
import { initScheduler } from './services/scheduler.js';

const fastify = Fastify({ logger: true });

// Register secure HTTP response headers (OWASP standards)
fastify.addHook("onRequest", async (request, reply) => {
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "DENY");
  reply.header("X-XSS-Protection", "1; mode=block");
  reply.header("Referrer-Policy", "no-referrer");
  reply.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
});

// Initialize Socket.IO WebSocket server
initWebsocket(fastify);

// Register CORS
await fastify.register(cors, {
  origin: [config.frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
});

// Register JWT authentication plugin
await fastify.register(jwt, {
  secret: config.jwtSecret,
});

// Register routes
await fastify.register(runHealthRoutes, { prefix: '/api' });
await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(projectRoutes, { prefix: '/api' });
await fastify.register(workflowRoutes, { prefix: '/api' });
await fastify.register(exportRoutes, { prefix: '/api' });
await fastify.register(gitRoutes, { prefix: '/api' });
await fastify.register(analyticsRoutes, { prefix: '/api' });
await fastify.register(servicesRoutes, { prefix: '/api' });
await fastify.register(aiRoutes, { prefix: '/api' });
await fastify.register(gatewayRoutes); // Wildcard gateway — no prefix

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connection established successfully');

    const redisOnline = await checkRedisConnection(config.redisUrl);
    setRedisStatus(redisOnline);
    initializeQueue(redisOnline);

    startWorker();
    console.log('📦 Compilation queue worker initialized');

    initScheduler(fastify);

    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 FlowForge API server ready at http://localhost:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
// Reload comment to clear in-memory cache

