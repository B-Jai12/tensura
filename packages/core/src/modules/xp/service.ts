/**
 * XP Service — business logic layer for XP granting and leveling.
 *
 * All Redis cache keys are namespaced under `xp:` to avoid collisions.
 * Cache strategy:
 *  - xp:cooldown:{guildId}:{userId}  — 60s TTL, set-on-grant, blocks re-grant
 *  - xp:profile:{guildId}:{userId}   — 5min TTL, cache-aside read
 *  - xp:rank:{guildId}:{userId}      — 2min TTL, for /rank command
 */

import type { Redis } from 'ioredis';
import type { LevelRoleReward, XpProfile } from './repository.js';
import * as repo from './repository.js';
import {
  randomXpGrant,
  decomposeXp,
  getXpCooldownSeconds,
} from './formula.js';

// ─────────────────────────────────────────────────────────────────────────────
// CACHE KEY BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

const xpCooldownKey = (guildId: string, userId: string) =>
  `tensura:xp:cooldown:${guildId}:${userId}`;

const xpProfileKey = (guildId: string, userId: string) =>
  `tensura:xp:profile:${guildId}:${userId}`;

const xpRankKey = (guildId: string, userId: string) =>
  `tensura:xp:rank:${guildId}:${userId}`;

// ─────────────────────────────────────────────────────────────────────────────
// RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface XpGrantResult {
  /** XP actually granted (0 if on cooldown). */
  xpGranted: number;
  profile: XpProfile;
  /** Whether the user levelled up on this grant. */
  leveledUp: boolean;
  /** Previous level (relevant when leveledUp = true). */
  previousLevel: number;
  /** New level (same as profile.level). */
  newLevel: number;
  /** Role rewards earned at newLevel (for the bot to apply). */
  earnedRewards: LevelRoleReward[];
  /** Whether the grant was skipped due to cooldown. */
  onCooldown: boolean;
}

export interface XpProfileView {
  profile: XpProfile;
  rank: number;
  currentXp: number;
  requiredXp: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// GRANT XP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempt to grant XP to a guild member for sending a message.
 *
 * Flow:
 *  1. Check Redis cooldown key — return early if still cooling down.
 *  2. Roll random XP amount.
 *  3. Load current profile (or default to zero).
 *  4. Compute new totalXp → new level via decomposeXp().
 *  5. Persist via upsert (atomic).
 *  6. Set cooldown key in Redis.
 *  7. Invalidate cached profile.
 *  8. If levelled up, fetch any newly-earned role rewards.
 */
export async function grantXp(
  redis: Redis,
  guildId: string,
  userId: string,
): Promise<XpGrantResult> {
  const cooldownKey = xpCooldownKey(guildId, userId);

  // Cooldown check — single Redis GET
  const cooldownHit = await redis.exists(cooldownKey);
  if (cooldownHit) {
    // Still cooling down — fetch cached profile for completeness
    const profile = await getXpProfile(redis, guildId, userId);
    return {
      xpGranted: 0,
      profile:   profile ?? buildEmptyProfile(guildId, userId),
      leveledUp: false,
      previousLevel: profile?.level ?? 0,
      newLevel:  profile?.level ?? 0,
      earnedRewards: [],
      onCooldown: true,
    };
  }

  // Roll XP
  const xpGranted   = randomXpGrant();
  const currentProfile = await getXpProfile(redis, guildId, userId);
  const oldTotalXp  = currentProfile?.totalXp ?? 0;
  const oldLevel    = currentProfile?.level ?? 0;
  const newTotalXp  = oldTotalXp + xpGranted;

  // Compute new level + within-level XP
  const { level: newLevel, currentXp } = decomposeXp(newTotalXp);
  const leveledUp = newLevel > oldLevel;

  // Persist
  const profile = await repo.incrementXp(
    guildId,
    userId,
    xpGranted,
    newLevel,
    currentXp,
  );

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[XP Debug] Database row updated:`, {
      userId,
      guildId,
      xpBefore: oldTotalXp,
      xpGranted,
      xpAfter: profile.totalXp,
      levelBefore: oldLevel,
      levelAfter: profile.level,
      updatedRow: profile,
    });
  }

  // Set cooldown
  const cooldownSec = getXpCooldownSeconds();
  redis.set(cooldownKey, '1', 'EX', cooldownSec).catch(() => undefined);

  // Invalidate profile cache (await to ensure consistency)
  await Promise.all([
    redis.del(xpProfileKey(guildId, userId)),
    redis.del(xpRankKey(guildId, userId)),
  ]).catch(() => undefined);

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[XP Debug] Cache invalidated for keys:`, [
      xpProfileKey(guildId, userId),
      xpRankKey(guildId, userId)
    ]);
  }

  // Role rewards (only if levelled up — fetch all rewards up to new level)
  let earnedRewards: LevelRoleReward[] = [];
  if (leveledUp) {
    earnedRewards = await repo.getEligibleRewards(guildId, newLevel);
  }

  return {
    xpGranted,
    profile,
    leveledUp,
    previousLevel: oldLevel,
    newLevel,
    earnedRewards,
    onCooldown: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE READ
// ─────────────────────────────────────────────────────────────────────────────

const PROFILE_TTL = 300; // 5 minutes

/** Cache-aside profile read — used by /rank and similar commands. */
export async function getXpProfile(
  redis: Redis,
  guildId: string,
  userId: string,
): Promise<XpProfile | null> {
  const key    = xpProfileKey(guildId, userId);
  const cached = await redis.get(key);
  if (cached !== null) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log(`[XP Debug] Cache HIT for key: ${key}`);
    }
    return JSON.parse(cached) as XpProfile;
  }

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[XP Debug] Cache MISS for key: ${key}`);
  }

  const profile = await repo.findXpProfile(guildId, userId);
  if (profile) {
    await redis.set(key, JSON.stringify(profile), 'EX', PROFILE_TTL);
  }
  return profile;
}

/**
 * Fetch a full profile view (profile + rank position + decomposed XP).
 * Used by the /rank command.
 */
export async function getXpProfileView(
  redis: Redis,
  guildId: string,
  userId: string,
): Promise<XpProfileView | null> {
  const profile = await getXpProfile(redis, guildId, userId);
  if (!profile) return null;

  // Rank (cache separately — slightly stale is OK for rank display)
  const rankKey    = xpRankKey(guildId, userId);
  const cachedRank = await redis.get(rankKey);
  let rank: number;

  if (cachedRank !== null) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log(`[XP Debug] Cache HIT for rank key: ${rankKey}`);
    }
    rank = parseInt(cachedRank, 10);
  } else {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log(`[XP Debug] Cache MISS for rank key: ${rankKey}`);
    }
    rank = await repo.getMemberRank(guildId, userId, profile.totalXp);
    await redis.set(rankKey, String(rank), 'EX', 120);
  }

  const { currentXp, requiredXp } = decomposeXp(profile.totalXp);

  return { profile, rank, currentXp, requiredXp };
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaderboardPage {
  entries: XpProfile[];
  totalCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

export async function getLeaderboardPage(
  guildId: string,
  page = 1,
  pageSize = 10,
): Promise<LeaderboardPage> {
  const offset     = (page - 1) * pageSize;
  const [entries, totalCount] = await Promise.all([
    repo.getLeaderboard(guildId, pageSize, offset),
    repo.countRankedMembers(guildId),
  ]);

  return {
    entries,
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    pageSize,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN OVERRIDES
// ─────────────────────────────────────────────────────────────────────────────

export async function setMemberXp(
  redis: Redis,
  guildId: string,
  userId: string,
  totalXp: number,
): Promise<XpProfile> {
  const { level, currentXp } = decomposeXp(totalXp);
  const profile = await repo.setXpProfile(guildId, userId, totalXp, level, currentXp);

  // Bust caches
  await Promise.all([
    redis.del(xpProfileKey(guildId, userId)),
    redis.del(xpRankKey(guildId, userId)),
  ]);

  return profile;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildEmptyProfile(guildId: string, userId: string): XpProfile {
  const now = new Date();
  return {
    guildId,
    userId,
    xp:           0,
    level:        0,
    totalXp:      0,
    totalMessages: 0,
    lastXpAt:     now,
    createdAt:    now,
    updatedAt:    now,
  };
}
