import { Redis } from "ioredis";

let client: Redis | undefined;

/**
 * Single shared ioredis connection per process. BullMQ (packages/queue)
 * creates its own dedicated connections per queue/worker per BullMQ's
 * requirements — this client is for everything else: guild config
 * cache, cooldowns, leaderboards.
 */
export function getRedisClient(redisUrl: string): Redis {
  if (client) return client;

  client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });

  return client;
}

export async function closeRedisClient(): Promise<void> {
  if (!client) return;
  await client.quit().catch(() => undefined);
  client = undefined;
}
