/**
 * /reward — Manage level role rewards.
 *
 * Subcommands:
 *   /reward add <level> <role>    — Assign a role reward for a level milestone
 *   /reward remove <level>        — Remove the reward at a level
 *   /reward list                  — View all configured rewards
 *
 * Requires: ManageGuild + ManageRoles.
 */

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { xpModule, configModule } from "@tensura/core";
import { baseEmbed, rewardAddedEmbed, rewardRemovedEmbed, rewardListEmbed } from "@tensura/ui-kit";
import type { CommandDefinition } from "../../registry/command.types.js";

const command: CommandDefinition = {
  module: "xp",
  cooldownSeconds: 3,

  data: new SlashCommandBuilder()
    .setName("reward")
    .setDescription("Configure level-up role rewards. (Admin only)")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild | PermissionFlagsBits.ManageRoles,
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Award a role when members reach a given level.")
        .addIntegerOption((opt) =>
          opt
            .setName("level")
            .setDescription("Level milestone (1–500)")
            .setMinValue(1)
            .setMaxValue(500)
            .setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("Role to award").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove the role reward configured for a level.")
        .addIntegerOption((opt) =>
          opt
            .setName("level")
            .setDescription("Level to remove the reward from")
            .setMinValue(1)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all configured level role rewards."),
    )
    .addSubcommand((sub) =>
      sub
        .setName("stack")
        .setDescription("Configure whether level role rewards stack or replace each other.")
        .addBooleanOption((opt) =>
          opt
            .setName("enabled")
            .setDescription("true = roles stack; false = higher role replaces previous progression roles")
            .setRequired(true),
        ),
    ),

  async execute(interaction, ctx) {
    const sub     = interaction.options.getSubcommand(true);
    const guildId = interaction.guildId!;

    await interaction.deferReply({ ephemeral: true });

    const config = await configModule.getGuildConfig(ctx.redis, guildId);

    if (sub === "list") {
      const rewards = await xpModule.xpRewards.listRoleRewards(guildId);
      await interaction.editReply({
        embeds: [
          rewardListEmbed(
            interaction.guild?.name ?? guildId,
            rewards.map((r) => ({ level: r.level, roleId: r.roleId })),
            config?.stackLevelRoles ?? true,
          ),
        ],
      });
      return;
    }

    if (sub === "stack") {
      const enabled = interaction.options.getBoolean("enabled", true);
      await configModule.updateGuildConfig(ctx.redis, guildId, {
        stackLevelRoles: enabled,
      });

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone: "success",
            title: "⚙️ Reward Mode Updated",
            description: `Level role rewards will now **${enabled ? "stack (users keep previous milestone roles)" : "replace each other (only the highest level milestone role is kept)"}**.`,
          }),
        ],
      });
      return;
    }

    if (sub === "add") {
      const level = interaction.options.getInteger("level", true);
      const role  = interaction.options.getRole("role", true);

      await xpModule.xpRewards.addRoleReward(guildId, level, role.id);

      await interaction.editReply({
        embeds: [rewardAddedEmbed(level, role.name)],
      });
      return;
    }

    if (sub === "remove") {
      const level = interaction.options.getInteger("level", true);
      await xpModule.xpRewards.removeRoleReward(guildId, level);
      await interaction.editReply({
        embeds: [rewardRemovedEmbed(level)],
      });
    }
  },
};

export default command;
