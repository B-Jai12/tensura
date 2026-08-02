/**
 * XP-specific embed builders for the Tensura bot.
 *
 * These live in @tensura/ui-kit (not in the render package) because they
 * produce Discord EmbedBuilder objects — the text-based Discord UI layer —
 * not canvas-rendered images. They share the same Cozy Café palette as
 * the render package via the `PALETTE` constants from theme.ts.
 *
 * Usage:
 *   await interaction.reply({ embeds: [levelUpEmbed(member, newLevel)] });
 */

import { EmbedBuilder } from 'discord.js';
import { BRAND, EMOJI, PALETTE } from './theme.js';
import { baseEmbed } from './embeds.js';

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL-UP EMBED
// Sent to the channel where the levelling message was posted (or the
// configured levelUpChannelId) when a member reaches a new level.
// ─────────────────────────────────────────────────────────────────────────────

export interface LevelUpEmbedOptions {
  displayName: string;
  userId: string;
  newLevel: number;
  /** Optional role name awarded at this level. */
  rewardRoleName?: string;
  /** Optional user avatar URL. */
  avatarUrl?: string;
}

export function levelUpEmbed(options: LevelUpEmbedOptions): EmbedBuilder {
  const { displayName, newLevel, rewardRoleName, avatarUrl } = options;

  let description = `${EMOJI.sparkle} **${displayName}** just reached **Level ${newLevel}**! ${EMOJI.sakura}`;

  if (rewardRoleName) {
    description += `\n\nYou've earned the **${rewardRoleName}** role as a reward. ${EMOJI.cup}`;
  }

  const thumbUrl = avatarUrl ?? `https://cdn.discordapp.com/embed/avatars/0.png`;

  return new EmbedBuilder()
    .setColor(PALETTE.blossomPink)
    .setTitle(`${EMOJI.sakura} Level Up!`)
    .setDescription(description)
    .setThumbnail(thumbUrl)
    .setFooter({ text: BRAND.footerText })
    .setTimestamp();
}

// ─────────────────────────────────────────────────────────────────────────────
// RANK EMBED  (wrapper around the rendered rank card image)
// The rank card image is sent as an attachment; this embed wraps it with
// context so it looks intentional rather than a bare image upload.
// ─────────────────────────────────────────────────────────────────────────────

export interface RankEmbedOptions {
  displayName: string;
  level: number;
  rank: number;
  /** The attachment filename — must match the AttachmentBuilder name. */
  imageFileName: string;
}

export function rankEmbed(options: RankEmbedOptions): EmbedBuilder {
  const { displayName, level, rank, imageFileName } = options;

  return new EmbedBuilder()
    .setColor(PALETTE.blossomPink)
    .setDescription(
      `${EMOJI.sakura} **${displayName}** — Level **${level}** · Rank **#${rank}**`,
    )
    .setImage(`attachment://${imageFileName}`)
    .setFooter({ text: BRAND.footerText });
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD EMBED  (wrapper around the rendered leaderboard image)
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaderboardEmbedOptions {
  guildName: string;
  page: number;
  totalPages: number;
  imageFileName: string;
}

export function leaderboardEmbed(options: LeaderboardEmbedOptions): EmbedBuilder {
  const { guildName, page, totalPages, imageFileName } = options;

  const pageText = totalPages > 1 ? ` · Page ${page}/${totalPages}` : '';

  return new EmbedBuilder()
    .setColor(PALETTE.warmGold)
    .setTitle(`${EMOJI.sparkle} ${guildName} Leaderboard${pageText}`)
    .setImage(`attachment://${imageFileName}`)
    .setFooter({ text: `${BRAND.footerText} · Use the buttons to navigate` });
}

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME EMBED  (wrapper around the rendered welcome card image)
// ─────────────────────────────────────────────────────────────────────────────

export interface WelcomeEmbedOptions {
  guildName: string;
  displayName: string;
  imageFileName: string;
}

export function welcomeEmbed(options: WelcomeEmbedOptions): EmbedBuilder {
  const { guildName, displayName, imageFileName } = options;

  return new EmbedBuilder()
    .setColor(PALETTE.blossomPink)
    .setDescription(
      `${EMOJI.cup} Welcome to **${guildName}**, **${displayName}**! Make yourself at home. ${EMOJI.sakura}`,
    )
    .setImage(`attachment://${imageFileName}`)
    .setFooter({ text: BRAND.footerText });
}

// ─────────────────────────────────────────────────────────────────────────────
// XP ADMIN FEEDBACK EMBEDS
// ─────────────────────────────────────────────────────────────────────────────

export function xpSetConfirmEmbed(displayName: string, newTotalXp: number, newLevel: number): EmbedBuilder {
  return baseEmbed({
    tone: 'success',
    title: `${EMOJI.sparkle} XP Updated`,
    description: `Set **${displayName}**'s XP to **${newTotalXp.toLocaleString()}** (Level **${newLevel}**).`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE REWARD EMBEDS
// ─────────────────────────────────────────────────────────────────────────────

export function rewardAddedEmbed(level: number, roleName: string): EmbedBuilder {
  return baseEmbed({
    tone: 'success',
    title: `${EMOJI.sakura} Reward Added`,
    description: `Members who reach **Level ${level}** will now receive the **${roleName}** role.`,
  });
}

export function rewardRemovedEmbed(level: number): EmbedBuilder {
  return baseEmbed({
    tone: 'info',
    description: `Removed the role reward for **Level ${level}**.`,
  });
}

export function rewardListEmbed(
  guildName: string,
  rewards: Array<{ level: number; roleId: string }>,
  stackLevelRoles = true,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(PALETTE.blossomPink)
    .setTitle(`${EMOJI.sakura} Level Role Rewards — ${guildName}`)
    .setFooter({ text: BRAND.footerText });

  const stackText = stackLevelRoles
    ? "🟢 Role rewards **stack** (members keep previous roles)."
    : "⚫ Role rewards **replace** (higher role replaces previous roles).";

  if (rewards.length === 0) {
    embed.setDescription(`No role rewards configured yet. Use \`/reward add\` to set one up.\n\n${stackText}`);
    return embed;
  }

  const lines = rewards
    .sort((a, b) => a.level - b.level)
    .map((r) => `**Level ${r.level}** → <@&${r.roleId}>`)
    .join('\n');

  embed.setDescription(`${lines}\n\n${stackText}`);
  return embed;
}
