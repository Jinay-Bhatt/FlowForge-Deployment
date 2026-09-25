import { config } from './config/index.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import compress from '@fastify/compress';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
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
import { notificationRoutes } from './routes/notifications.js';
import { startWorker, setRedisStatus } from './queue/worker.js';
import { initializeQueue } from './queue/exportQueue.js';
import { checkRedisConnection } from './queue/redisCheck.js';
import { initWebsocket } from './websocket.js';
import { initScheduler } from './services/scheduler.js';
import { registerSecurityHooks, recordViolation } from './middleware/security.js';

// Fastify Server with Anti-DoS & Memory Limits
const fastify = Fastify({
  logger: true,
  bodyLimit: 2 * 1024 * 1024, // 2MB Max Request Body limit (protects against Buffer overflow DoS)
  requestTimeout: 10000,      // 10s Request Timeout (protects against Slowloris socket holding)
  keepAliveTimeout: 5000,     // 5s Keep-Alive Timeout
});

// Register OWASP Security Headers (Helmet)
await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com", "https://gsi.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "http:", "https:", "ws:", "wss:"],
      frameSrc: ["'self'", "https://accounts.google.com"],
    },
  },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// Register Global Anti-DDoS Rate Limiting (120 reqs/min per IP)
await fastify.register(rateLimit, {
  max: 120,
  timeWindow: '1 minute',
  errorResponseBuilder: (req, context) => {
    recordViolation(req.ip);
    return {
      error: 'Too Many Requests',
      message: `Global Rate Limit Exceeded. Maximum ${context.max} requests per minute allowed.`,
      code: 'GLOBAL_RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    };
  },
});

// Register Custom Security Hooks (Anti-DDoS Firewall, Input Sanitizer, XSS/SQLi Guards)
registerSecurityHooks(fastify);

// Register Gzip / Brotli response compression
await fastify.register(compress, { global: true, threshold: 256 });

// Initialize Socket.IO WebSocket server
initWebsocket(fastify);

// Register CORS with Whitelist Safeguard
await fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return cb(null, true);
    const allowed = [
      config.frontendUrl,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    if (allowed.some(o => o && origin.startsWith(o))) {
      return cb(null, true);
    }
    return cb(new Error('CORS request blocked by JBSnap Security Firewall'), false);
  },
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
await fastify.register(notificationRoutes, { prefix: '/api' });
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
    console.log(`🚀 JBSnap Security Hardened API server ready at http://localhost:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
