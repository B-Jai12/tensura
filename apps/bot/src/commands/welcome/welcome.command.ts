/**
 * /welcome — Configure and test the welcome card system.
 *
 * Subcommands:
 *   /welcome set-channel <channel>  — Set the welcome card channel
 *   /welcome test                   — Preview the welcome card for yourself
 *   /welcome disable                — Clear the welcome channel (disables welcome cards)
 *
 * Requires: ManageGuild.
 */

import {
  AttachmentBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { configModule } from "@tensura/core";
import { renderWelcomeCard } from "@tensura/render";
import { baseEmbed, welcomeEmbed, EMOJI } from "@tensura/ui-kit";
import type { CommandDefinition } from "../../registry/command.types.js";

const command: CommandDefinition = {
  module: "core",
  cooldownSeconds: 5,

  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure the welcome card system. (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("set-channel")
        .setDescription("Choose the channel where welcome cards are posted.")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Text channel for welcome messages")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("test")
        .setDescription("Preview what the welcome card looks like for you."),
    )
    .addSubcommand((sub) =>
      sub
        .setName("disable")
        .setDescription("Stop sending welcome cards in this server."),
    ),

  async execute(interaction, ctx) {
    const sub     = interaction.options.getSubcommand(true);
    const guildId = interaction.guildId!;

    await interaction.deferReply({ ephemeral: sub !== "test" });

    // ── Set channel ──────────────────────────────────────────────────────
    if (sub === "set-channel") {
      const channel = interaction.options.getChannel("channel", true);

      await configModule.updateGuildConfig(ctx.redis, guildId, {
        welcomeChannelId: channel.id,
      });

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone: "success",
            title: `${EMOJI.sakura} Welcome Channel Set`,
            description: `New members will be welcomed in <#${channel.id}>.`,
          }),
        ],
      });
      return;
    }

    // ── Disable ──────────────────────────────────────────────────────────
    if (sub === "disable") {
      await configModule.updateGuildConfig(ctx.redis, guildId, {
        welcomeChannelId: null,
      });

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone: "info",
            description: "Welcome cards disabled. Members will no longer receive a greeting.",
          }),
        ],
      });
      return;
    }

    // ── Test ─────────────────────────────────────────────────────────────
    const member = interaction.guild?.members.cache.get(interaction.user.id)
      ?? await interaction.guild?.members.fetch(interaction.user.id).catch(() => undefined);

    const cardBuffer = await renderWelcomeCard({
      user: {
        id:          interaction.user.id,
        displayName: member?.displayName ?? interaction.user.displayName,
        username:    interaction.user.username,
        avatarUrl:   interaction.user.displayAvatarURL({ extension: "png", size: 256 }),
      },
      guildName:   interaction.guild?.name ?? "Your Server",
      memberCount: interaction.guild?.memberCount,
    });

    const fileName   = `welcome-preview-${interaction.user.id}.png`;
    const attachment = new AttachmentBuilder(cardBuffer, { name: fileName });
    const embed      = welcomeEmbed({
      guildName:     interaction.guild?.name ?? "Your Server",
      displayName:   member?.displayName ?? interaction.user.displayName,
      imageFileName: fileName,
    });

    await interaction.editReply({
      content: "Here's a preview of your welcome card:",
      embeds:  [embed],
      files:   [attachment],
    });
  },
};

export default command;
