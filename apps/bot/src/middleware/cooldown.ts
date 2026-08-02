import type { Redis } from "ioredis";

/**
 * Returns remaining seconds if the user is on cooldown, or 0 if the
 * command may proceed (and the cooldown key is (re)set).
 */
export async function checkCooldown(
  redis: Redis,
  userId: string,
  commandName: string,
  cooldownSeconds: number,
  guildId: string,
): Promise<number> {
  const key = `tensura:cooldown:${guildId}:${commandName}:${userId}`;

  // Attempt to set the cooldown key atomically
  const success = await redis.set(key, "1", "EX", cooldownSeconds, "NX");

  if (success === "OK") {
    return 0;
  }

  // Key already exists, retrieve the TTL
  const ttl = await redis.ttl(key);
  return ttl > 0 ? ttl : cooldownSeconds;
}
