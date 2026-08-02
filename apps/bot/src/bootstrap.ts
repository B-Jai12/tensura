import { loadEnv } from "@tensura/config";
import { createLogger } from "@tensura/logger";
import { getRedisClient, closeRedisClient } from "@tensura/cache";
import { initializeRenderer } from "@tensura/render";
import { createDiscordClient } from "./client.js";
import { loadCommands } from "./registry/load-commands.js";
import { loadEvents } from "./events/load-events.js";
import type { BotContext } from "./context.js";

export async function bootstrap(): Promise<BotContext> {
  const env    = loadEnv();
  const logger = createLogger({
    process: "bot",
    level:   env.LOG_LEVEL,
    pretty:  env.NODE_ENV === "development",
  });

  // ── Renderer (canvas fonts) ───────────────────────────────────────────────
  // Must happen before the bot connects so the first /rank or welcome card
  // render doesn't stall waiting for font registration.
  const { loaded, fallback } = await initializeRenderer();
  if (fallback) {
    logger.warn(
      "Render: no Noto Sans fonts found — using system font fallback.\n" +
      "Run `pnpm --filter @tensura/render fonts:download` to install bundled fonts.",
    );
  } else {
    logger.info({ fonts: loaded.length }, "Render: fonts registered");
  }

  const redis    = getRedisClient(env.REDIS_URL);
  const client   = createDiscordClient();
  const commands = await loadCommands(logger);

  const ctx: BotContext = { client, redis, logger, env, commands };

  const unloadEvents = await loadEvents(ctx);

  redis.on("error",  (err) => logger.error({ err }, "Redis connection error"));
  client.on("error", (err) => logger.error({ err }, "Discord client error"));

  // ── Graceful Shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down bot process...");
    try {
      unloadEvents();
      client.destroy();
      await closeRedisClient();
      logger.info("Graceful shutdown complete.");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT",  () => shutdown("SIGINT"));

  await client.login(env.DISCORD_TOKEN);

  return ctx;
}
