import type { ConnectionOptions } from "bullmq";

/**
 * BullMQ wants its own ioredis-compatible connection options (it manages
 * connections internally per queue/worker), separate from the shared
 * ioredis client in packages/cache. Parsed once from REDIS_URL.
 */
export function parseRedisConnection(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
  };
}

/**
 * Queue names, centralized so a typo can't create a phantom queue that
 * silently never gets a worker. New queues are added here as their
 * owning module lands (render, moderation-actions, notifications,
 * birthday-cron, seasonal-rotation, analytics-rollup, ticket-transcript-export).
 */
export const QUEUE_NAMES = {
  render: "render",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
