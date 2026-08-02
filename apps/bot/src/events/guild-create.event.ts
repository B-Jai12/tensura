import { configModule } from "@tensura/core";
import type { EventDefinition } from "./event.types.js";
import { moduleLogger } from "@tensura/logger";

const event: EventDefinition<"guildCreate"> = {
  name: "guildCreate",
  async execute(ctx, guild) {
    const logger = moduleLogger(ctx.logger, "config");
    logger.info({ guildId: guild.id, name: guild.name }, "Joined new guild");

    await configModule.ensureGuildInitialized({
      guildId: guild.id,
      guildName: guild.name,
      ownerId: guild.ownerId,
    });
  },
};

export default event;
