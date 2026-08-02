/**
 * /xp — Admin XP management command.
 *
 * Subcommands:
 *   /xp set <user> <amount>  — Set a member's total XP directly
 *   /xp add <user> <amount>  — Add XP to a member (bypasses cooldown)
 *   /xp remove <user> <amount> — Subtract XP (floors at 0)
 *   /xp check <user>         — View raw XP data for a member
 *
 * Requires: ManageGuild permission.
 */

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { xpModule } from "@tensura/core";
import { baseEmbed, xpSetConfirmEmbed, EMOJI } from "@tensura/ui-kit";
import type { CommandDefinition } from "../../registry/command.types.js";

const command: CommandDefinition = {
  module: "xp",
  cooldownSeconds: 2,

  data: new SlashCommandBuilder()
    .setName("xp")
    .setDescription("Manage XP for server members. (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Set a member's total XP to an exact value.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Target member").setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("New total XP value")
            .setMinValue(0)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add XP to a member (bypasses the 60s cooldown).")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Target member").setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("XP to add")
            .setMinValue(1)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Subtract XP from a member (floors at 0).")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Target member").setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("XP to remove")
            .setMinValue(1)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("check")
        .setDescription("View raw XP stats for a member.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Target member").setRequired(true),
        ),
    ),

  async execute(interaction, ctx) {
    const sub    = interaction.options.getSubcommand(true);
    const target = interaction.options.getUser("user", true);
    const guildId = interaction.guildId!;

    await interaction.deferReply({ ephemeral: true });

    if (sub === "check") {
      const view = await xpModule.xpService.getXpProfileView(ctx.redis, guildId, target.id);

      if (!view) {
        await interaction.editReply({
          embeds: [baseEmbed({ tone: "info", description: `${target.username} has no XP yet.` })],
        });
        return;
      }

      await interaction.editReply({
        embeds: [
          baseEmbed({
            title: `${EMOJI.sparkle} ${target.username} — XP Data`,
            description: [
              `**Total XP:** ${view.profile.totalXp.toLocaleString()}`,
              `**Level:** ${view.profile.level}`,
              `**Level progress:** ${view.currentXp.toLocaleString()} / ${view.requiredXp.toLocaleString()} XP`,
              `**Server rank:** #${view.rank}`,
              `**Messages:** ${view.profile.totalMessages.toLocaleString()}`,
            ].join("\n"),
          }),
        ],
      });
      return;
    }

    const amount = interaction.options.getInteger("amount", true);

    let currentTotalXp: number;
    if (sub === "add" || sub === "remove") {
      const existing = await xpModule.xpService.getXpProfile(ctx.redis, guildId, target.id);
      currentTotalXp = existing?.totalXp ?? 0;
    } else {
      currentTotalXp = 0;
    }

    let newTotalXp: number;
    if (sub === "set")    newTotalXp = amount;
    else if (sub === "add")    newTotalXp = currentTotalXp + amount;
    else /* remove */          newTotalXp = Math.max(0, currentTotalXp - amount);

    const profile = await xpModule.xpService.setMemberXp(ctx.redis, guildId, target.id, newTotalXp);

    await interaction.editReply({
      embeds: [xpSetConfirmEmbed(target.username, profile.totalXp, profile.level)],
    });
  },
};

export default command;
