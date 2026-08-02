import type { Redis } from "ioredis";

export interface CacheAsideOptions {
  ttlSeconds: number;
}

/**
 * Standard cache-aside read: try Redis, fall back to `loader` (a Postgres
 * query) on miss, write the result back with a TTL. Used by guild config,
 * profile lookups, and anywhere else a hot read shouldn't hit Postgres
 * on every interaction.
 *
 * Callers are responsible for invalidating (`redis.del(key)`) on write —
 * e.g. the dashboard save handler for GuildConfig.
 */
const NULL_SENTINEL = "__null__";
const NEGATIVE_CACHE_TTL = 30; // cache missing records for 30 seconds

export async function cacheAside<T>(
  redis: Redis,
  key: string,
  loader: () => Promise<T | null>,
  options: CacheAsideOptions,
): Promise<T | null> {
  const cached = await redis.get(key);
  if (cached !== null) {
    if (cached === NULL_SENTINEL) {
      return null;
    }
    return JSON.parse(cached) as T;
  }

  const fresh = await loader();
  if (fresh !== null) {
    await redis.set(key, JSON.stringify(fresh), "EX", options.ttlSeconds);
  } else {
    // Cache null result with a short TTL to protect DB from thundering herd
    await redis.set(key, NULL_SENTINEL, "EX", NEGATIVE_CACHE_TTL);
  }

  return fresh;
}

export function guildConfigCacheKey(guildId: string): string {
  return `tensura:guild-config:${guildId}`;
}
