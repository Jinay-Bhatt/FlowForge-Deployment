import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const { Pool } = pg;

// High-Throughput Connection Pool (Tuned for Neon Serverless PostgreSQL & Cold Starts)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                       // Up to 20 active pool sockets per instance
  idleTimeoutMillis: 30000,      // Recycle idle connections every 30s
  connectionTimeoutMillis: 30000,// Allow up to 30s for Neon serverless compute cold starts
  keepAlive: true,
});

// Handle Neon serverless idle socket drops gracefully without server interruption
pool.on("error", (err: any) => {
  if (err.message && (err.message.includes("connection timeout") || err.message.includes("Connection terminated"))) {
    // Normal serverless pool recycling notice — silent handle
    return;
  }
  console.warn("⚠️ Postgres connection pool notice:", err.message || err);
});

// Idempotent column check for Neon PostgreSQL to support Tiered Pricing Model, Avatar, and Notifications
pool.query(`
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'FREE';
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiGenerationsCount" INTEGER DEFAULT 0;
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiGenerationsResetAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
  CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
`).catch(err => {
  console.warn("⚠️ Postgres schema column check notice:", err.message || err);
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma?: any };

const rawPrisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: ["error"],
});

export const prisma = rawPrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        let retries = 2;
        while (retries >= 0) {
          try {
            return await query(args);
          } catch (error: any) {
            const isConnErr =
              error?.message?.includes("connection timeout") ||
              error?.message?.includes("Connection terminated") ||
              error?.message?.includes("Connection closed") ||
              error?.code === "P1001" ||
              error?.code === "P1002" ||
              error?.code === "P1017";

            if (isConnErr && retries > 0) {
              retries--;
              await new Promise((resolve) => setTimeout(resolve, 1500));
              continue;
            }
            throw error;
          }
        }
      },
    },
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = rawPrisma;
}

