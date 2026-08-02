import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { xpModule } from "@tensura/core";
import { baseEmbed } from "@tensura/ui-kit";
import type { CommandDefinition } from "../../registry/command.types.js";

const command: CommandDefinition = {
  module: "core",
  cooldownSeconds: 0,

  data: new SlashCommandBuilder()
    .setName("dev")
    .setDescription("Developer commands for instant level/XP testing.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("xp")
        .setDescription("Give yourself XP.")
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("Amount of XP to add")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("level")
        .setDescription("Set your level.")
        .addIntegerOption((opt) =>
          opt
            .setName("level")
            .setDescription("The level to set")
            .setMinValue(0)
            .setRequired(true),
        ),
    ),

  async execute(interaction, ctx) {
    const sub = interaction.options.getSubcommand(true);
    const guildId = interaction.guildId!;
    const userId = interaction.user.id;

    await interaction.deferReply({ ephemeral: true });

    if (sub === "xp") {
      const amount = interaction.options.getInteger("amount", true);
      const existing = await xpModule.xpService.getXpProfile(ctx.redis, guildId, userId);
      const newTotal = (existing?.totalXp ?? 0) + amount;

      const profile = await xpModule.xpService.setMemberXp(ctx.redis, guildId, userId, newTotal);

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone: "success",
            description: `Instantly added ${amount} XP. Your total XP is now ${profile.totalXp} (Level ${profile.level}).`,
          }),
        ],
      });
    } else if (sub === "level") {
      const level = interaction.options.getInteger("level", true);
      const targetXp = xpModule.xpFormula.totalXpForLevel(level);

      const profile = await xpModule.xpService.setMemberXp(ctx.redis, guildId, userId, targetXp);

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone: "success",
            description: `Instantly set your level to ${level} (Total XP: ${profile.totalXp}).`,
          }),
        ],
      });
    }
  },
};

export default command;
