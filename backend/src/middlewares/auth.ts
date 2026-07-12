import { FastifyRequest, FastifyReply } from "fastify";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Check if token is passed in query parameters (used by browser for direct ZIP downloads)
    const query = request.query as { token?: string };
    if (query && query.token) {
      const decoded = request.server.jwt.verify(query.token);
      request.user = decoded;
      return;
    }

    await request.jwtVerify();
  } catch (err) {
    return reply
      .status(401)
      .send({ error: "Unauthorized: Invalid or missing token" });
  }
}
