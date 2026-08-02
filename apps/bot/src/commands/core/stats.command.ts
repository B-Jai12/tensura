/**
 * /stats — Server statistics overview.
 *
 * Shows a rich summary of:
 *  - Member breakdown (total, humans, bots)
 *  - Channel counts (text, voice, categories)
 *  - Role count
 *  - Boost tier and count
 *  - Server creation date (human-readable)
 *  - Top 3 members by XP (pulled from the leaderboard)
 *
 * Core command — always available regardless of module toggles.
 */

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { xpModule } from "@tensura/core";
import { BRAND, EMOJI, PALETTE } from "@tensura/ui-kit";
import type { CommandDefinition } from "../../registry/command.types.js";

const command: CommandDefinition = {
  module: "core",
  cooldownSeconds: 10,

  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View server statistics and top members."),

  async execute(interaction, ctx) {
    await interaction.deferReply();

    const guild = interaction.guild!;
    await guild.fetch(); // refresh member counts / boost info

    // Channel breakdown
    const textChannels  = guild.channels.cache.filter((c) => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === 2).size;
    const categories    = guild.channels.cache.filter((c) => c.type === 4).size;

    // Member breakdown
    const totalMembers = guild.memberCount;
    const botCount     = guild.members.cache.filter((m) => m.user.bot).size;
    const humanCount   = totalMembers - botCount;

    // Top XP leaders (best-effort — fails gracefully if module is off / table empty)
    let topLine = "*No XP data yet — start chatting!*";
    try {
      const lb = await xpModule.xpService.getLeaderboardPage(guild.id, 1, 3);
      if (lb.entries.length > 0) {
        topLine = lb.entries
          .map((p, i) => {
            const member = guild.members.cache.get(p.userId);
            const name   = member?.displayName ?? `<@${p.userId}>`;
            const medals = ["🥇", "🥈", "🥉"];
            return `${medals[i] ?? `**${i + 1}.**`} ${name} — Level **${p.level}** · **${p.totalXp.toLocaleString()}** XP`;
          })
          .join("\n");
      }
    } catch (err) {
      ctx.logger.debug({ err, guildId: guild.id }, "Failsafe leaderboard fetch in stats command failed");
    }

    const boostTier   = guild.premiumTier;
    const boostCount  = guild.premiumSubscriptionCount ?? 0;
    const createdAt   = `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`;

    const embed = new EmbedBuilder()
      .setColor(PALETTE.blossomPink)
      .setTitle(`${EMOJI.sparkle} ${guild.name}`)
      .setThumbnail(guild.iconURL({ extension: "png", size: 256 }) ?? null)
      .addFields(
        {
          name: "👥 Members",
          value: [
            `**Total:** ${totalMembers.toLocaleString()}`,
            `**Humans:** ${humanCount.toLocaleString()}`,
            `**Bots:** ${botCount.toLocaleString()}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "📡 Channels",
          value: [
            `**Text:** ${textChannels}`,
            `**Voice:** ${voiceChannels}`,
            `**Categories:** ${categories}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "✨ Server",
          value: [
            `**Roles:** ${guild.roles.cache.size}`,
            `**Boost tier:** ${boostTier}  (${boostCount} boosts)`,
            `**Created:** ${createdAt}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: `${EMOJI.sakura} Top Members`,
          value: topLine,
          inline: false,
        },
      )
      .setFooter({ text: BRAND.footerText })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
