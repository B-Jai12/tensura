/**
 * /leaderboard [page?] — Paginated guild XP leaderboard.
 *
 * Renders an 820×640 leaderboard card showing 10 entries per page.
 * Navigation buttons (Previous / Next) are included when there are
 * multiple pages. The requesting user's row is highlighted if present.
 */

import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import { xpModule } from "@tensura/core";
import { renderLeaderboardCard } from "@tensura/render";
import { leaderboardEmbed, baseEmbed, EMOJI } from "@tensura/ui-kit";
import type { LeaderboardEntry } from "@tensura/render";
import type { CommandDefinition } from "../../registry/command.types.js";

const PAGE_SIZE = 10;

const command: CommandDefinition = {
  module: "xp",
  cooldownSeconds: 8,

  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the server XP leaderboard.")
    .addIntegerOption((opt) =>
      opt
        .setName("page")
        .setDescription("Page number (default: 1)")
        .setMinValue(1)
        .setRequired(false),
    ),

  async execute(interaction, ctx) {
    await interaction.deferReply();

    const guildId  = interaction.guildId!;
    const guild    = interaction.guild!;
    let   page     = interaction.options.getInteger("page") ?? 1;

    const renderPage = async (currentPage: number): Promise<{
      embed: ReturnType<typeof leaderboardEmbed>;
      attachment: AttachmentBuilder;
      fileName: string;
      totalPages: number;
    }> => {
      const pageData = await xpModule.xpService.getLeaderboardPage(guildId, currentPage, PAGE_SIZE);

      if (pageData.entries.length === 0) {
        throw new Error("empty");
      }

      // Clamp page
      currentPage = Math.min(currentPage, pageData.totalPages);

      const userIds = pageData.entries.map((p) => p.userId);
      const missingUserIds = userIds.filter((id) => !guild.members.cache.has(id));

      if (missingUserIds.length > 0) {
        await guild.members.fetch({ user: missingUserIds }).catch(() => null);
      }

      // Map profiles → render data (fetch display names from cache)
      const entries: LeaderboardEntry[] = pageData.entries.map((profile, idx) => {
        const guildMember = guild.members.cache.get(profile.userId);
        const absoluteRank = (currentPage - 1) * PAGE_SIZE + idx + 1;

        return {
          rank:  absoluteRank,
          user: {
            id:          profile.userId,
            displayName: guildMember?.displayName ?? `User#${profile.userId.slice(-4)}`,
            username:    guildMember?.user.username ?? profile.userId,
            avatarUrl:   guildMember?.user.displayAvatarURL({ extension: "png", size: 64 })
              ?? `https://cdn.discordapp.com/embed/avatars/0.png`,
          },
          level:   profile.level,
          totalXp: profile.totalXp,
          isHighlighted: profile.userId === interaction.user.id,
        };
      });

      const cardBuffer = await renderLeaderboardCard({
        guildName:   guild.name,
        guildIconUrl: guild.iconURL({ extension: "png", size: 64 }) ?? undefined,
        entries,
        page: currentPage,
        totalPages: pageData.totalPages,
      });

      const fileName   = `leaderboard-${guildId}-p${currentPage}.png`;
      const attachment = new AttachmentBuilder(cardBuffer, { name: fileName });
      const embed      = leaderboardEmbed({
        guildName:     guild.name,
        page:          currentPage,
        totalPages:    pageData.totalPages,
        imageFileName: fileName,
      });

      return { embed, attachment, fileName, totalPages: pageData.totalPages };
    };

    // Initial render
    let result;
    try {
      result = await renderPage(page);
    } catch (err) {
      if ((err as Error).message === "empty") {
        await interaction.editReply({
          embeds: [baseEmbed({ tone: "info", description: "No one has earned XP in this server yet. Start chatting! " + EMOJI.cup })],
        });
        return;
      }
      throw err;
    }

    const buildRow = (currentPage: number, totalPages: number) =>
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("lb_prev")
          .setLabel("← Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage <= 1),
        new ButtonBuilder()
          .setCustomId("lb_next")
          .setLabel("Next →")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage >= totalPages),
      );

    const row = buildRow(page, result.totalPages);
    const showButtons = result.totalPages > 1;

    const reply = await interaction.editReply({
      embeds: [result.embed],
      files:  [result.attachment],
      components: showButtons ? [row] : [],
    });

    if (!showButtons) return;

    // ── Button pagination collector (60s window) ────────────────────────
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (btn) => btn.user.id === interaction.user.id,
      time: 60_000,
    });

    collector.on("collect", async (btn) => {
      await btn.deferUpdate();

      if (btn.customId === "lb_prev") page = Math.max(1, page - 1);
      if (btn.customId === "lb_next") page++;

      try {
        const newResult = await renderPage(page);
        await btn.editReply({
          embeds: [newResult.embed],
          files:  [newResult.attachment],
          components: [buildRow(page, newResult.totalPages)],
        });
      } catch (err) {
        ctx.logger.error({ err }, "Leaderboard page render failed");
      }
    });

    collector.on("end", () => {
      // Disable buttons when collector expires
      interaction.editReply({ components: [] }).catch(() => undefined);
    });
  },
};

export default command;
