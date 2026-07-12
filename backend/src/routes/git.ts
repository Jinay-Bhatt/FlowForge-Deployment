import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../services/db.js";
import { authenticate } from "../middlewares/auth.js";
import { encrypt } from "../services/crypto.js";

interface AuthUserPayload {
  id: string;
  email: string;
}

export async function gitRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", authenticate);

  // Get active configuration
  fastify.get("/git-config", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as AuthUserPayload;
    try {
      const config = await prisma.gitConfiguration.findFirst({
        where: { userId: user.id, isActive: true },
      });
      if (!config) {
        return reply.send({ config: null });
      }
      return reply.send({
        config: {
          id: config.id,
          provider: config.provider,
          repositoryName: config.repositoryName,
          repositoryUrl: config.repositoryUrl,
          isActive: config.isActive,
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error", details: error.message });
    }
  });

  // Create or update configuration
  fastify.post("/git-config", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as AuthUserPayload;
    const { repositoryName, accessToken, provider } = request.body as {
      repositoryName?: string;
      accessToken?: string;
      provider?: string;
    };

    if (!repositoryName || !accessToken || !provider) {
      return reply.status(400).send({
        error: "Bad Request: repositoryName, accessToken, and provider are required",
      });
    }

    try {
      const encryptedToken = encrypt(accessToken);
      const repositoryUrl = `https://github.com/${repositoryName}`;

      // Disable other active configurations
      await prisma.gitConfiguration.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });

      const newConfig = await prisma.gitConfiguration.create({
        data: {
          userId: user.id,
          provider,
          accessToken: encryptedToken,
          repositoryName,
          repositoryUrl,
          isActive: true,
        },
      });

      return reply.status(201).send({
        message: "Git configuration saved successfully",
        config: {
          id: newConfig.id,
          provider: newConfig.provider,
          repositoryName: newConfig.repositoryName,
          repositoryUrl: newConfig.repositoryUrl,
          isActive: newConfig.isActive,
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: "Internal Server Error", details: error.message });
    }
  });
}
