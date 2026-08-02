import type { ChatInputCommandInteraction } from "discord.js";
import { configModule } from "@tensura/core";
import { baseEmbed } from "@tensura/ui-kit";
import type { BotContext } from "../context.js";
import type { CommandDefinition } from "../registry/command.types.js";
import { checkCooldown } from "./cooldown.js";

export interface MiddlewareResult {
  allowed: boolean;
  /** Present when allowed === false — already sent as the interaction reply. */
  reason?: string;
}

/**
 * Runs guild-config load → module-enabled check → cooldown check, in that
 * order, before a command's execute() is ever called. Each stage replies
 * and short-circuits on failure so command handlers never have to
 * duplicate this logic.
 */
export async function runMiddleware(
  interaction: ChatInputCommandInteraction,
  command: CommandDefinition,
  ctx: BotContext,
): Promise<MiddlewareResult> {
  if (!interaction.guildId) {
    await interaction.reply({
      embeds: [baseEmbed({ tone: "warning", description: "This command only works inside a server." })],
      ephemeral: true,
    });
    return { allowed: false, reason: "no-guild" };
  }

  // "core" commands (e.g. /ping) always run regardless of module config.
  if (command.module !== "core") {
    const config = await configModule.getGuildConfig(ctx.redis, interaction.guildId);

    if (!config) {
      await interaction.reply({
        embeds: [
          baseEmbed({
            tone: "warning",
            description: "This server hasn't finished setting up yet — try again in a moment.",
          }),
        ],
        ephemeral: true,
      });
      return { allowed: false, reason: "config-missing" };
    }

    if (!configModule.isModuleEnabled(config, command.module)) {
      await interaction.reply({
        embeds: [baseEmbed({ tone: "info", description: "This feature is turned off in this server." })],
        ephemeral: true,
      });
      return { allowed: false, reason: "module-disabled" };
    }
  }

  if (command.cooldownSeconds && command.cooldownSeconds > 0) {
    const remaining = await checkCooldown(
      ctx.redis,
      interaction.user.id,
      command.data.name,
      command.cooldownSeconds,
      interaction.guildId,
    );

    if (remaining > 0) {
      await interaction.reply({
        embeds: [
          baseEmbed({
            tone: "warning",
            description: `Slow down a little \u2014 try again in ${remaining}s. \u2615`,
          }),
        ],
        ephemeral: true,
      });
      return { allowed: false, reason: "cooldown" };
    }
  }

  return { allowed: true };
}
