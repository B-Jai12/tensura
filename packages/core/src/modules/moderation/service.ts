/**
 * Moderation Service — business logic layer.
 *
 * Every moderation action:
 *  1. Performs the Discord action (ban/kick/timeout).
 *  2. Creates a ModerationCase audit log entry.
 *  3. Optionally posts to the guild's moderation log channel.
 *
 * All functions are designed to be called from slash command handlers.
 * They do NOT reply to interactions — the command layer handles that.
 */

import type { Guild, GuildMember, User } from 'discord.js';
import * as repo from './repository.js';
import type { ModerationCase } from './repository.js';

export type { ModerationCase };

// ─────────────────────────────────────────────────────────────────────────────
// WARN
// ─────────────────────────────────────────────────────────────────────────────

export interface WarnResult {
  case: ModerationCase;
  totalWarnings: number;
}

export async function warnMember(
  guild: Guild,
  target: GuildMember,
  moderator: User,
  reason: string,
): Promise<WarnResult> {
  const newCase = await repo.createCase({
    guildId:     guild.id,
    userId:      target.user.id,
    moderatorId: moderator.id,
    action:      'warn',
    reason,
  });

  const totalWarnings = await repo.countCases(guild.id, target.user.id);

  // DM the user (non-fatal)
  await target.send(
    `${guild.name} has issued you a **warning**: ${reason}\n\nCase ID: \`${newCase.id}\``,
  ).catch(() => undefined);

  return { case: newCase, totalWarnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// KICK
// ─────────────────────────────────────────────────────────────────────────────

export async function kickMember(
  guild: Guild,
  target: GuildMember,
  moderator: User,
  reason: string,
): Promise<ModerationCase> {
  // DM before kick so the message can actually be delivered
  await target.send(
    `You have been **kicked** from **${guild.name}**.\nReason: ${reason}`,
  ).catch(() => undefined);

  await target.kick(reason);

  return repo.createCase({
    guildId:     guild.id,
    userId:      target.user.id,
    moderatorId: moderator.id,
    action:      'kick',
    reason,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BAN / UNBAN
// ─────────────────────────────────────────────────────────────────────────────

export async function banMember(
  guild: Guild,
  target: GuildMember | User,
  moderator: User,
  reason: string,
  deleteMessageDays = 1,
): Promise<ModerationCase> {
  const user = 'user' in target ? target.user : target;

  if ('user' in target) {
    await target.send(
      `You have been **banned** from **${guild.name}**.\nReason: ${reason}`,
    ).catch(() => undefined);
  }

  await guild.members.ban(user.id, { reason, deleteMessageSeconds: deleteMessageDays * 86_400 });

  return repo.createCase({
    guildId:     guild.id,
    userId:      user.id,
    moderatorId: moderator.id,
    action:      'ban',
    reason,
  });
}

export async function unbanMember(
  guild: Guild,
  userId: string,
  moderator: User,
  reason: string,
): Promise<ModerationCase> {
  await guild.members.unban(userId, reason);

  return repo.createCase({
    guildId:     guild.id,
    userId,
    moderatorId: moderator.id,
    action:      'unban',
    reason,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMEOUT / MUTE (Discord native timeout)
// ─────────────────────────────────────────────────────────────────────────────

/** Apply a Discord timeout (max 28 days). durationMs = null removes the timeout. */
export async function timeoutMember(
  guild: Guild,
  target: GuildMember,
  moderator: User,
  reason: string,
  durationMs: number | null,
): Promise<ModerationCase> {
  const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;

  await target.timeout(durationMs, reason);

  return repo.createCase({
    guildId:     guild.id,
    userId:      target.user.id,
    moderatorId: moderator.id,
    action:      durationMs === null ? 'unmute' : 'mute',
    reason,
    expiresAt,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export async function getMemberCases(
  guildId: string,
  userId: string,
): Promise<ModerationCase[]> {
  return repo.findCases(guildId, userId);
}

export async function getMemberCaseCount(
  guildId: string,
  userId: string,
): Promise<number> {
  return repo.countCases(guildId, userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Parse a human-readable duration string into milliseconds. */
export function parseDuration(input: string): number | null {
  const match = input.match(/^(\d+)\s*(s|m|h|d|w)$/i);
  if (!match) return null;

  const [, value, unit] = match;
  const n = parseInt(value!, 10);

  switch (unit!.toLowerCase()) {
    case 's': return n * 1_000;
    case 'm': return n * 60_000;
    case 'h': return n * 3_600_000;
    case 'd': return n * 86_400_000;
    case 'w': return n * 604_800_000;
    default:  return null;
  }
}

/** Max Discord timeout duration: 28 days in ms */
export const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1_000;
