import net from "node:net";
import { URL } from "node:url";

/**
 * Performs a fast, non-blocking TCP socket connection check on the specified Redis URL
 * to determine if a Redis server is online and reachable.
 */
export function checkRedisConnection(redisUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(redisUrl);
      if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
        resolve(false);
        return;
      }
      const host = parsed.hostname || "127.0.0.1";
      const port = parsed.port ? parseInt(parsed.port, 10) : 6379;
      
      const socket = net.createConnection({ host, port, timeout: 1000 }, () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on("error", () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}
