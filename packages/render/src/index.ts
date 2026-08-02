/**
 * @tensura/render — Public API
 *
 * This is the only import path external consumers should use:
 *
 *   import { renderRankCard, renderWelcomeCard, initializeRenderer } from '@tensura/render';
 *
 * The three render functions are the primary surface. `initializeRenderer()`
 * must be called once at bot startup (before any render call) to register
 * fonts with the canvas engine. It is idempotent and safe to await multiple times.
 */

export { renderRankCard }    from './templates/rank-card.js';
export { renderWelcomeCard } from './templates/welcome-card.js';
export { renderLeaderboardCard } from './templates/leaderboard-card.js';

// Types — re-exported so the bot layer never needs to import from deep paths
export type {
  RankCardData,
  WelcomeCardData,
  LeaderboardCardData,
  LeaderboardEntry,
  ProfileCardData,
  AchievementCardData,
  CardUser,
} from './types.js';

// Design tokens — exported for consumers that need to reference brand values
// (e.g. embed builders that want to use the same palette as card renders)
export {
  PALETTE,
  COLORS,
  GRADIENTS,
  TYPOGRAPHY,
  SPACING,
  RADII,
  SHADOWS,
  CARD_SIZES,
  SAKURA_CONFIG,
  BRAND,
  RANK_MEDALS,
  font,
} from './tokens.js';

// Font utilities
export { initFonts, fontsReady } from './fonts.js';
export type { FontInitResult } from './fonts.js';

// ─────────────────────────────────────────────────────────────────────────────
// ONE-CALL INITIALIZER
// ─────────────────────────────────────────────────────────────────────────────

import { initFonts as _initFonts } from './fonts.js';

/**
 * Initialize the renderer: register fonts, warm up any caches.
 * Call this once at bot startup before any renderXxx() invocation.
 *
 * @example
 * // In bootstrap.ts, after creating the Redis/DB connections:
 * const { loaded, fallback } = await initializeRenderer();
 * if (fallback) logger.warn('Render: using system font fallback — run pnpm fonts:download');
 * else logger.info({ fonts: loaded.length }, 'Render: fonts registered');
 */
export async function initializeRenderer(): Promise<{ loaded: string[]; fallback: boolean }> {
  return _initFonts();
}
