import { FastifyRequest, FastifyReply } from "fastify";

const globalLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Custom in-memory rate limiter hook for authentication endpoints.
 * Limits users to 15 login/signup requests per minute per IP address.
 */
export async function rateLimitAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const ip = request.ip || "unknown-ip";
  const now = Date.now();
  const key = `auth:${ip}`;
  const record = globalLimitStore.get(key);

  const maxAttempts = 15;
  const windowMs = 60 * 1000; // 1 minute

  if (!record || now > record.resetTime) {
    globalLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  if (record.count >= maxAttempts) {
    return reply.status(429).send({
      error: "Too Many Requests: Rate limit exceeded. Please try again in 1 minute.",
    });
  }

  record.count++;
}
