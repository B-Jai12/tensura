import type { Redis } from "ioredis";
import { cacheAside, guildConfigCacheKey } from "@tensura/cache";
import { DEFAULT_MODULE_TOGGLES, type GuildModuleToggles } from "@tensura/types";
import type { GuildConfig } from "@tensura/database";
import * as repo from "./repository.js";

const GUILD_CONFIG_TTL_SECONDS = 300;

export interface EnsureGuildInput {
  guildId: string;
  guildName: string;
  ownerId: string;
}

/**
 * Called from the bot's `guildCreate` event and idempotently on boot for
 * every guild the bot is already in — guarantees a Guild + GuildConfig
 * row exists with sane defaults before any other module tries to read it.
 */
export async function ensureGuildInitialized(input: EnsureGuildInput): Promise<GuildConfig> {
  await repo.upsertGuild(input.guildId, input.guildName, input.ownerId);
  return repo.createDefaultGuildConfig(input.guildId, DEFAULT_MODULE_TOGGLES as unknown as Record<string, boolean>);
}

/**
 * The hot path — called by bot middleware on every interaction. Cache-aside
 * through Redis so a busy 50k-member guild doesn't hit Postgres per command.
 */
export async function getGuildConfig(redis: Redis, guildId: string): Promise<GuildConfig | null> {
  return cacheAside(redis, guildConfigCacheKey(guildId), () => repo.findGuildConfig(guildId), {
    ttlSeconds: GUILD_CONFIG_TTL_SECONDS,
  });
}

export function isModuleEnabled(config: GuildConfig, moduleName: keyof GuildModuleToggles): boolean {
  const modules = getModuleToggles(config);
  return modules[moduleName];
}

export function getModuleToggles(config: GuildConfig): GuildModuleToggles {
  const modules = (config.modules ?? {}) as Partial<GuildModuleToggles>;
  return {
    ...DEFAULT_MODULE_TOGGLES,
    ...modules,
  };
}

export function getLogChannels(config: GuildConfig): Record<string, string> {
  return (config.logChannels ?? {}) as Record<string, string>;
}

export async function updateGuildConfig(
  redis: Redis,
  guildId: string,
  data: Parameters<typeof repo.updateGuildConfig>[1],
): Promise<GuildConfig> {
  const config = await repo.updateGuildConfig(guildId, data);
  await invalidateGuildConfigCache(redis, guildId);
  return config;
}

/**
 * Invalidates the Redis cache entry. Called after any write to
 * GuildConfig — currently only from here, but the dashboard's save
 * handler (future phase) will call this too.
 */
export async function invalidateGuildConfigCache(redis: Redis, guildId: string): Promise<void> {
  await redis.del(guildConfigCacheKey(guildId));
}
