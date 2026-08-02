import { baseEmbed } from "@tensura/ui-kit";
import { runMiddleware } from "../middleware/pipeline.js";
import type { EventDefinition } from "./event.types.js";
import { moduleLogger } from "@tensura/logger";

const event: EventDefinition<"interactionCreate"> = {
  name: "interactionCreate",
  async execute(ctx, interaction) {
    const logger = moduleLogger(ctx.logger, "commands");

    if (!interaction.isChatInputCommand()) {
      // Button/select/modal routing lands in apps/bot/src/components in a
      // later phase (tickets, minigames, dashboard-style paginated embeds).
      return;
    }

    const command = ctx.commands.get(interaction.commandName);

    if (!command) {
      logger.warn({ command: interaction.commandName }, "Unknown command invoked");
      return;
    }

    const { allowed } = await runMiddleware(interaction, command, ctx);
    if (!allowed) return;

    try {
      await command.execute(interaction, ctx);
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, "Command execution failed");

      const errorEmbed = baseEmbed({
        tone: "danger",
        description: "Something went wrong brewing that up. Please try again in a moment.",
      });

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] }).catch(() => undefined);
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => undefined);
      }
    }
  },
};

export default event;
