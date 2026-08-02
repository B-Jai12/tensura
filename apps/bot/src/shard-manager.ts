import path from "node:path";
import { fileURLToPath } from "node:url";
import { ShardingManager } from "discord.js";
import { loadEnv } from "@tensura/config";
import { createLogger } from "@tensura/logger";

/**
 * Entry point for production. Spawns one child process per shard via
 * discord.js's ShardingManager, each running shard-entry.js as its own
 * Client instance. `SHARD_COUNT=auto` lets Discord recommend the count
 * based on current guild count — safe from a handful of guilds up
 * through 100k+ members without touching this file.
 *
 * Below the sharding threshold this still works fine as a single shard;
 * it's here from day one so scaling later is a config change, not a
 * rewrite (see TENSURA_ARCHITECTURE.md §7).
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const env = loadEnv();
  const logger = createLogger({ process: "shard-manager", level: env.LOG_LEVEL, pretty: env.NODE_ENV === "development" });

  const manager = new ShardingManager(path.join(__dirname, "shard-entry.js"), {
    token: env.DISCORD_TOKEN,
    totalShards: env.SHARD_COUNT === "auto" ? "auto" : Number(env.SHARD_COUNT),
    shardList: env.SHARD_ID ? [Number(env.SHARD_ID)] : "auto",
  });

  manager.on("shardCreate", (shard) => {
    logger.info({ shardId: shard.id }, "Launching shard");
    shard.on("death", () => logger.error({ shardId: shard.id }, "Shard died"));
    shard.on("ready", () => logger.info({ shardId: shard.id }, "Shard ready"));
  });

  await manager.spawn();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[shard-manager] Fatal startup error:", err);
  process.exit(1);
});
