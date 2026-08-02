import { z } from "zod";

/**
 * Single source of truth for every environment variable used across
 * apps/bot, apps/api, apps/workers. Each app validates only the slice
 * it needs via `loadEnv()`, but the shape is shared so a variable can
 * never silently mean two different things in two processes.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),

  // Discord
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
  DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID is required"),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_DEV_GUILD_IDS: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((id) => id.trim()).filter(Boolean) : [])),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),

  // Redis
  REDIS_URL: z.string().url("REDIS_URL must be a valid connection string"),

  // Sharding
  SHARD_COUNT: z.string().default("auto"),
  SHARD_ID: z.string().optional(),

  // Optional / future phases
  ANTHROPIC_API_KEY: z.string().optional(),
  ANILIST_API_URL: z.string().url().optional(),

  // XP progression config
  XP_COOLDOWN_SECONDS: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  XP_MIN: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  XP_MAX: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export type Env = z.infer<typeof envSchema>;
