/**
 * /rank [user?] — Display a user's rank card.
 *
 * Shows a rendered 900×280 rank card for the target user (defaults to self).
 * Defers the reply immediately since canvas rendering can take 500–1500ms.
 */

import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import { xpModule } from "@tensura/core";
import { renderRankCard } from "@tensura/render";
import { rankEmbed, baseEmbed } from "@tensura/ui-kit";
import type { CommandDefinition } from "../../registry/command.types.js";

const command: CommandDefinition = {
  module: "xp",
  cooldownSeconds: 5,

  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your rank card or another member's.")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The member to look up (defaults to you)")
        .setRequired(false),
    ),

  async execute(interaction, ctx) {
    await interaction.deferReply();

    const target = interaction.options.getUser("user") ?? interaction.user;
    const member = interaction.guild?.members.cache.get(target.id)
      ?? await interaction.guild?.members.fetch(target.id).catch(() => undefined);

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log(`[XP Debug] /rank command invoked:`, {
        targetUserId: target.id,
        targetUsername: target.username,
        guildId: interaction.guildId,
      });
    }

    // Fetch profile view (profile + rank + decomposed XP)
    const view = await xpModule.xpService.getXpProfileView(
      ctx.redis,
      interaction.guildId!,
      target.id,
    );

    if (!view) {
      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone: "info",
            description: `${target.username} hasn't earned any XP yet. Start chatting to get on the leaderboard!`,
          }),
        ],
      });
      return;
    }

    // Build card data
    const cardBuffer = await renderRankCard({
      user: {
        id:          target.id,
        displayName: member?.displayName ?? target.displayName,
        username:    target.username,
        avatarUrl:   target.displayAvatarURL({ extension: "png", size: 256 }),
      },
      currentXp:  view.currentXp,
      requiredXp: view.requiredXp,
      totalXp:    view.profile.totalXp,
      level:      view.profile.level,
      rank:       view.rank,
      guildName:  interaction.guild?.name ?? "",
    });

    const fileName   = `rank-${target.id}.png`;
    const attachment = new AttachmentBuilder(cardBuffer, { name: fileName });
    const embed      = rankEmbed({
      displayName:   member?.displayName ?? target.displayName,
      level:         view.profile.level,
      rank:          view.rank,
      imageFileName: fileName,
    });

    await interaction.editReply({ embeds: [embed], files: [attachment] });
  },
};

export default command;
