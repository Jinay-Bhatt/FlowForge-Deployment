import { FastifyRequest, FastifyReply } from "fastify";
import { recordViolation, isIpBanned } from "../middleware/security.js";

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Periodic memory store cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * Advanced Rate Limiter Factory with Violation Tracking & Anti-DDoS Integration
 */
export function createRateLimiter(maxAttempts = 10, windowMs = 60 * 1000, prefix = 'general') {
  return async function rateLimiter(request: FastifyRequest, reply: FastifyReply) {
    const ip = request.ip || "127.0.0.1";

    // 1. Instant check if IP is banned by anti-DDoS firewall
    if (isIpBanned(ip)) {
      return reply.status(403).send({
        error: "Forbidden",
        message: "Your IP address is blocked due to excessive request abuse.",
        code: "IP_BANNED"
      });
    }

    const now = Date.now();
    const key = `${prefix}:${ip}`;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return;
    }

    if (record.count >= maxAttempts) {
      // Record security violation for anti-DDoS IP ban trigger
      recordViolation(ip);

      const retrySeconds = Math.ceil((record.resetTime - now) / 1000);
      reply.header('Retry-After', retrySeconds);
      reply.header('X-RateLimit-Limit', maxAttempts);
      reply.header('X-RateLimit-Remaining', 0);

      return reply.status(429).send({
        error: "Too Many Requests",
        message: `Security Rate Limit Exceeded. Maximum ${maxAttempts} requests per ${windowMs / 1000}s allowed. Please retry after ${retrySeconds} seconds.`,
        code: "RATE_LIMIT_EXCEEDED"
      });
    }

    record.count++;
    reply.header('X-RateLimit-Limit', maxAttempts);
    reply.header('X-RateLimit-Remaining', maxAttempts - record.count);
  };
}

// Pre-configured Rate Limiters for High-Risk Routes
export const rateLimitAuth = createRateLimiter(10, 60 * 1000, 'auth');   // 10 reqs/min for login/register
export const rateLimitAI = createRateLimiter(15, 60 * 1000, 'ai');       // 15 reqs/min for AI generation
export const rateLimitExport = createRateLimiter(15, 60 * 1000, 'export'); // 15 reqs/min for code export
export const rateLimitGlobal = createRateLimiter(120, 60 * 1000, 'global'); // 120 reqs/min general API cap
