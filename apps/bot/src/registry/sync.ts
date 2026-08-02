import { REST, Routes } from "discord.js";
import { loadEnv } from "@tensura/config";
import { createLogger } from "@tensura/logger";
import { loadCommands } from "./load-commands.js";

/**
 * `pnpm registry:sync` — safe to run in CI on every deploy. Registers
 * commands to specific dev guilds instantly if DISCORD_DEV_GUILD_IDS is
 * set (useful in local dev, where global commands take up to an hour to
 * propagate); otherwise registers globally for production.
 */
async function main() {
  const env = loadEnv();
  const logger = createLogger({ process: "bot-registry", level: env.LOG_LEVEL, pretty: env.NODE_ENV === "development" });

  const commands = await loadCommands(logger);
  const payload = Array.from(commands.values()).map((c) => c.data.toJSON());

  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

  if (env.DISCORD_DEV_GUILD_IDS.length > 0) {
    for (const guildId of env.DISCORD_DEV_GUILD_IDS) {
      await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, guildId), { body: payload });
      logger.info({ guildId, count: payload.length }, "Synced guild commands");
    }
  } else {
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: payload });
    logger.info({ count: payload.length }, "Synced global commands");
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[registry:sync] Failed:", err);
  process.exit(1);
});
