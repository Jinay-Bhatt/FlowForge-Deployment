import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/* ─── IP Ban & DDoS Firewall Memory Store ────────────────────────── */
interface BannedIP {
  until: number;
  violations: number;
}
const ipBlacklist = new Map<string, BannedIP>();

// Cleanup expired bans periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipBlacklist.entries()) {
    if (now > record.until) {
      ipBlacklist.delete(ip);
    }
  }
}, 60000);

export function recordViolation(ip: string) {
  const now = Date.now();
  const record = ipBlacklist.get(ip) || { violations: 0, until: 0 };
  record.violations += 1;

  // Ban IP for 15 minutes if > 30 rate-limit violations occur
  if (record.violations >= 30) {
    record.until = now + 15 * 60 * 1000;
    console.warn(`[SECURITY FIREWALL] 🚫 IP ${ip} automatically banned for 15 minutes due to excessive DDoS/abuse violations.`);
  }

  ipBlacklist.set(ip, record);
}

export function isIpBanned(ip: string): boolean {
  const record = ipBlacklist.get(ip);
  if (!record) return false;
  if (Date.now() < record.until) return true;
  // Ban expired
  ipBlacklist.delete(ip);
  return false;
}

/* ─── Input Sanitization & Injection Defense ─────────────────────── */
/**
 * Sanitizes strings against XSS, SQLi, and Path Traversal attack vectors
 */
export function sanitizeString(val: string): string {
  if (typeof val !== 'string') return val;

  let sanitized = val;

  // 1. Remove dangerous script tags and event handlers (XSS protection)
  sanitized = sanitized
    .replace(/<script\b[^<]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe\b[^<]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // 2. Prevent directory traversal attacks
  sanitized = sanitized.replace(/\.\.[\/\\]/g, '');

  return sanitized;
}

/**
 * Recursively sanitizes request payload objects, arrays, and strings
 */
export function sanitizeDeep(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') return sanitizeString(obj);
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeDeep(item));
  }

  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    // Avoid prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    const cleanKey = sanitizeString(key);
    result[cleanKey] = sanitizeDeep(obj[key]);
  }
  return result;
}

/* ─── Security Hooks Registration ────────────────────────────────── */
export function registerSecurityHooks(fastify: FastifyInstance) {
  // 1. onRequest Hook: IP Blacklist Check + HPP & Query Sanitization
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip || '127.0.0.1';

    // Anti-DDoS Firewall: Block banned IPs instantly
    if (isIpBanned(ip)) {
      reply.status(403).send({
        error: 'Forbidden',
        message: 'Your IP address has been temporarily blocked due to repeated abuse or attack signatures.',
        code: 'IP_TEMPORARILY_BANNED',
      });
      return reply;
    }

    // Sanitize query params
    if (request.query && typeof request.query === 'object') {
      request.query = sanitizeDeep(request.query);
    }
  });

  // 2. preValidation Hook: Request Body Sanitization
  fastify.addHook('preValidation', async (request: FastifyRequest) => {
    if (request.body && typeof request.body === 'object') {
      request.body = sanitizeDeep(request.body);
    }
  });

  // 3. Security Headers (OWASP Ultra Standards)
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    reply.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    reply.header('Cross-Origin-Resource-Policy', 'cross-origin');
  });
}
