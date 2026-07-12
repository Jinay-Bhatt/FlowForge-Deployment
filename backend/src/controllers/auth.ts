import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../services/db.js";

export async function registerUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { username, email, password } = request.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!username || !email || !password) {
    return reply.status(400).send({
      error: "Bad Request: username, email, and password are required",
    });
  }

  if (password.length < 8) {
    return reply.status(400).send({
      error: "Bad Request: Password must be at least 8 characters long",
    });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return reply.status(400).send({
      error: "Bad Request: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return reply.status(400).send({
        error: "Conflict: Email address already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    return reply.status(201).send({
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function loginUser(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return reply.status(400).send({
      error: "Bad Request: email and password are required",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.status(401).send({
        error: "Unauthorized: Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return reply.status(401).send({
        error: "Unauthorized: Invalid email or password",
      });
    }

    // Sign a JWT token containing user identity details
    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return reply.send({ user });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}

export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
  const { username, oldPassword, newPassword } = request.body as {
    username?: string;
    oldPassword?: string;
    newPassword?: string;
  };

  const userId = (request.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    const updateData: any = {};
    if (username) updateData.username = username;

    if (newPassword) {
      if (!oldPassword) {
        return reply.status(400).send({
          error: "Current password is required to change to a new password",
        });
      }

      const passwordMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!passwordMatch) {
        return reply.status(400).send({
          error: "The current password you entered is incorrect",
        });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    } else if (oldPassword) {
      return reply.status(400).send({
        error: "New password is required when supplying your current password",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    return reply.send({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
