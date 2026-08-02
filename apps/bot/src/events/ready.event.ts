import { REST, Routes } from "discord.js";
import { configModule } from "@tensura/core";
import type { EventDefinition } from "./event.types.js";
import { moduleLogger } from "@tensura/logger";

const event: EventDefinition<"ready"> = {
  name: "ready",
  once: true,
  async execute(ctx, client) {
    const logger = moduleLogger(ctx.logger, "system");
    logger.info({ tag: client.user?.tag, guilds: client.guilds.cache.size }, "Tensura is online");

    // ── Slash command sync ────────────────────────────────────────────────────
    // Registers/updates commands with Discord on every startup so the
    // developer never needs to run a separate sync script after a deploy.
    // In production (no DISCORD_DEV_GUILD_IDS set) this propagates globally.
    try {
      const payload = Array.from(ctx.commands.values()).map((c) => c.data.toJSON());
      const rest    = new REST({ version: "10" }).setToken(ctx.env.DISCORD_TOKEN);

      if (ctx.env.DISCORD_DEV_GUILD_IDS.length > 0) {
        for (const guildId of ctx.env.DISCORD_DEV_GUILD_IDS) {
          await rest.put(
            Routes.applicationGuildCommands(ctx.env.DISCORD_CLIENT_ID, guildId),
            { body: payload },
          );
          logger.info({ guildId, count: payload.length }, "Synced guild commands");
        }
      } else {
        await rest.put(
          Routes.applicationCommands(ctx.env.DISCORD_CLIENT_ID),
          { body: payload },
        );
        logger.info({ count: payload.length }, "Synced global commands");
      }
    } catch (err) {
      logger.error({ err }, "Failed to sync slash commands");
    }

    // ── Guild backfill ────────────────────────────────────────────────────────
    // Idempotent: guarantees every guild the bot is already in has a Guild +
    // GuildConfig row, even after a fresh deploy or a missed guildCreate event.
    for (const guild of client.guilds.cache.values()) {
      try {
        await configModule.ensureGuildInitialized({
          guildId:   guild.id,
          guildName: guild.name,
          ownerId:   guild.ownerId,
        });
      } catch (err) {
        logger.error({ err, guildId: guild.id }, "Failed to initialize guild config on ready");
      }
    }
  },
};

export default event;
