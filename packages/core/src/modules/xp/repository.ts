/**
 * XP Repository — raw Prisma queries for the XP module.
 * No business logic here — only data access.
 */

import { prisma } from '@tensura/database';
import type { XpProfile, LevelRoleReward } from '@tensura/database';

export type { XpProfile, LevelRoleReward };

// ─────────────────────────────────────────────────────────────────────────────
// XP PROFILES
// ─────────────────────────────────────────────────────────────────────────────

export async function findXpProfile(
  guildId: string,
  userId: string,
): Promise<XpProfile | null> {
  return prisma.xpProfile.findUnique({
    where: { guildId_userId: { guildId, userId } },
  });
}

/**
 * Atomically increment a member's XP values using an upsert.
 * Creates the profile row on first XP grant.
 */
export async function incrementXp(
  guildId: string,
  userId: string,
  xpGrant: number,
  newLevel: number,
  newCurrentXp: number,
): Promise<XpProfile> {
  return prisma.xpProfile.upsert({
    where:  { guildId_userId: { guildId, userId } },
    create: {
      guildId,
      userId,
      xp:           newCurrentXp,
      level:        newLevel,
      totalXp:      xpGrant,
      totalMessages: 1,
      lastXpAt:     new Date(),
    },
    update: {
      xp:           newCurrentXp,
      level:        newLevel,
      totalXp:      { increment: xpGrant },
      totalMessages: { increment: 1 },
      lastXpAt:     new Date(),
    },
  });
}

/**
 * Fetch the top `limit` members in a guild by total XP.
 * Offset-based pagination for leaderboard pages.
 */
export async function getLeaderboard(
  guildId: string,
  limit = 10,
  offset = 0,
): Promise<XpProfile[]> {
  return prisma.xpProfile.findMany({
    where:   { guildId },
    orderBy: { totalXp: 'desc' },
    take:    limit,
    skip:    offset,
  });
}

/** Total number of ranked members in a guild (for page count). */
export async function countRankedMembers(guildId: string): Promise<number> {
  return prisma.xpProfile.count({ where: { guildId } });
}

/**
 * Fetch a member's rank position within their guild (1-indexed).
 * Uses a count query — faster than a subquery for < 1M rows.
 */
export async function getMemberRank(
  guildId: string,
  _userId: string,
  memberTotalXp: number,
): Promise<number> {
  const above = await prisma.xpProfile.count({
    where: { guildId, totalXp: { gt: memberTotalXp } },
  });
  return above + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN OVERRIDES
// ─────────────────────────────────────────────────────────────────────────────

export async function setXpProfile(
  guildId: string,
  userId: string,
  totalXp: number,
  level: number,
  currentXp: number,
): Promise<XpProfile> {
  return prisma.xpProfile.upsert({
    where:  { guildId_userId: { guildId, userId } },
    create: { guildId, userId, xp: currentXp, level, totalXp },
    update: { xp: currentXp, level, totalXp },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE REWARDS
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertRoleReward(
  guildId: string,
  level: number,
  roleId: string,
): Promise<LevelRoleReward> {
  return prisma.levelRoleReward.upsert({
    where:  { guildId_level: { guildId, level } },
    create: { guildId, level, roleId },
    update: { roleId },
  });
}

export async function deleteRoleReward(
  guildId: string,
  level: number,
): Promise<void> {
  await prisma.levelRoleReward
    .delete({ where: { guildId_level: { guildId, level } } })
    .catch(() => undefined); // ignore not-found
}

export async function listRoleRewards(
  guildId: string,
): Promise<LevelRoleReward[]> {
  return prisma.levelRoleReward.findMany({
    where:   { guildId },
    orderBy: { level: 'asc' },
  });
}

/** Fetch rewards for the exact level reached (milestone-based role rewards). */
export async function getEligibleRewards(
  guildId: string,
  currentLevel: number,
): Promise<LevelRoleReward[]> {
  return prisma.levelRoleReward.findMany({
    where: { guildId, level: currentLevel },
  });
}
