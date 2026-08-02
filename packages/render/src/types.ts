/**
 * Card data interfaces for the Tensura render system.
 *
 * Every template receives a strongly-typed data object rather than raw
 * Discord objects — this keeps the render package framework-agnostic and
 * testable in isolation. The bot commands are responsible for mapping
 * Discord/Prisma data into these shapes before calling renderXxx().
 */

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** A simplified user representation used across all card types. */
export interface CardUser {
  /** Discord user snowflake — used to seed deterministic decorative positions. */
  id: string;
  /** The display name shown prominently on cards. */
  displayName: string;
  /** The username / handle shown in subdued text. e.g. "jai" */
  username: string;
  /** Fully-qualified avatar URL (CDN link). Falls back to default avatar. */
  avatarUrl: string;
  /**
   * Optional per-user accent colour (hex string, e.g. "#f4c2d7").
   * When provided, overrides some brand-pink accents to personalise the card.
   * Sourced from a future user-profile table.
   */
  accentColor?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// RANK CARD
// ─────────────────────────────────────────────────────────────────────────────

export interface RankCardData {
  user: CardUser;
  /** Current XP within the present level (0 ≤ currentXp < requiredXp). */
  currentXp: number;
  /** XP required to reach the next level from level start. */
  requiredXp: number;
  /** Life-time total XP accumulated across all levels. */
  totalXp: number;
  /** Current level (0-indexed, but displayed as Level 1+). */
  level: number;
  /** Guild-scoped rank position by total XP (1 = top). */
  rank: number;
  /** Guild name — shown in the watermark region. */
  guildName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME CARD
// ─────────────────────────────────────────────────────────────────────────────

export interface WelcomeCardData {
  user: CardUser;
  /** The guild's display name shown on the card. */
  guildName: string;
  /** The guild's icon URL — shown as a small secondary image (optional). */
  guildIconUrl?: string;
  /**
   * Total member count at the time of welcome — displayed as "Member #1,234".
   * When undefined the count line is omitted.
   */
  memberCount?: number;
  /** Custom welcome message override. Defaults to "Welcome to the café," */
  customMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD CARD
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  /** Absolute rank position within the guild (1-indexed). */
  rank: number;
  user: CardUser;
  level: number;
  /** Total accumulated XP for ordering. */
  totalXp: number;
  /** Whether this entry represents the requesting user (highlighted row). */
  isHighlighted?: boolean;
}

export interface LeaderboardCardData {
  guildName: string;
  guildIconUrl?: string;
  entries: LeaderboardEntry[];
  /** Current page number (1-indexed). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE CARD  (Phase 3 — scaffolded here so types exist)
// ─────────────────────────────────────────────────────────────────────────────

/** Placeholder — full shape defined when the profile module ships. */
export interface ProfileCardData {
  user: CardUser;
  level: number;
  totalXp: number;
  rank: number;
  // … extended profile fields added in Phase 3
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENT CARD  (Phase 4 — scaffolded)
// ─────────────────────────────────────────────────────────────────────────────

export interface AchievementCardData {
  user: CardUser;
  achievementName: string;
  achievementDescription: string;
  achievementIconUrl?: string;
  unlockedAt: Date;
}
