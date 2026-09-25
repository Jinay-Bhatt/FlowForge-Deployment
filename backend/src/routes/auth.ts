import { FastifyInstance } from "fastify";
import { registerUser, loginUser, googleLogin, getMe, updateProfile, upgradePlan } from "../controllers/auth.js";
import { authenticate } from "../middlewares/auth.js";
import { rateLimitAuth } from "../middlewares/rateLimit.js";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/register", { preHandler: rateLimitAuth }, registerUser);
  fastify.post("/auth/login", { preHandler: rateLimitAuth }, loginUser);
  fastify.post("/auth/google", { preHandler: rateLimitAuth }, googleLogin);
  fastify.get("/auth/me", { preHandler: authenticate }, getMe);
  fastify.put("/auth/update", { preHandler: authenticate }, updateProfile);
  fastify.post("/auth/upgrade-plan", { preHandler: authenticate }, upgradePlan);
}
