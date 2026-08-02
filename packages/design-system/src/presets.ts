/**
 * @tensura/design-system — Preset styles and visual templates
 */

import { PALETTE, GRADIENTS, type GradientStop } from './colors.js';


// ── CARD SIZES ────────────────────────────────────────────────────────────────

export const CARD_SIZES = {
  rank:        { width: 900,  height: 280 },
  welcome:     { width: 1024, height: 400 },
  leaderboard: { width: 820,  height: 640 },
  profile:     { width: 1080, height: 540 },
  achievement: { width: 640,  height: 200 },
  shop:        { width: 420,  height: 520 },
  event:       { width: 900,  height: 320 },
} as const;

// ── GLASSMORPHISM PRESETS ────────────────────────────────────────────────────

export const GLASSMORPHISM = {
  card: {
    fill: 'rgba(255, 243, 230, 0.06)',
    stroke: 'rgba(255, 243, 230, 0.10)',
    blur: 16,
  },
  overlay: {
    fill: 'rgba(0, 0, 0, 0.25)',
    stroke: 'rgba(255, 255, 255, 0.06)',
    blur: 8,
  },
  pinkTint: {
    fill: 'rgba(244, 194, 215, 0.08)',
    stroke: 'rgba(244, 194, 215, 0.20)',
    blur: 12,
  },
} as const;

// ── PROGRESS BAR STYLES ──────────────────────────────────────────────────────

export const PROGRESS_BAR = {
  height: 12,
  trackFill: 'rgba(255, 243, 230, 0.08)',
  gradient: GRADIENTS.xpBar,
  glow: 'rgba(244, 194, 215, 0.50)',
} as const;

// ── BADGE STYLES ─────────────────────────────────────────────────────────────

export const BADGES = {
  size: 32,
  radius: 8,
  bg: 'rgba(255, 243, 230, 0.07)',
  border: 'rgba(244, 194, 215, 0.20)',
  shadowColor: 'rgba(244, 194, 215, 0.35)',
} as const;

// ── AVATAR FRAME STYLES ──────────────────────────────────────────────────────

export const AVATAR_FRAMES = {
  sizes: {
    rank: 75, // radius
    welcome: 90, // radius
    leaderboard: 25, // radius
  },
  glowColor: 'rgba(244, 194, 215, 0.45)',
  ringGradient: GRADIENTS.avatarRing,
} as const;

// ── SAKURA DECORATION CONFIG ──────────────────────────────────────────────────

export const SAKURA_CONFIG = {
  petalColors: [
    PALETTE.blossom[400], // #f4c2d7
    PALETTE.blossom[300], // #f784ae
    PALETTE.blossom[200], // #fbb0d4
    PALETTE.blossom[100], // #fdd8ea
    '#fde8f0',
    '#f9d0e4',
  ] as string[],

  // Much more subtle — petals are decorative, not obstructive
  opacityRange: [0.04, 0.16] as [number, number],
  sizeRange: [5, 16] as [number, number],

  layouts: {
    // Rank card: 5 petals strictly in corners, away from all text/UI areas
    rank: [
      // Top-right corner cluster
      [0.94, 0.06, 1.1], [0.98, 0.20, 0.8],
      // Bottom-right corner
      [0.96, 0.82, 0.9], [0.91, 0.94, 0.7],
      // Bottom-left corner (where avatar glow fades)
      [0.04, 0.90, 0.8],
      // Top-left (very faint, behind avatar glow)
      [0.03, 0.08, 0.6],
      // Center-bottom subtle
      [0.50, 0.92, 0.5],
    ] as [number, number, number][],

    welcome: [
      [0.03, 0.05, 1.4], [0.08, 0.15, 1.0], [0.96, 0.04, 1.2],
      [0.92, 0.14, 0.9], [0.88, 0.26, 0.7],
      [0.94, 0.80, 1.1], [0.98, 0.92, 0.8],
      [0.45, 0.08, 0.6], [0.60, 0.90, 0.9], [0.35, 0.85, 0.7],
      [0.70, 0.06, 0.5], [0.15, 0.92, 0.6],
    ] as [number, number, number][],

    leaderboard: [
      [0.03, 0.03, 1.3], [0.08, 0.10, 0.9], [0.96, 0.04, 1.1],
      [0.93, 0.10, 0.8], [0.04, 0.90, 1.0], [0.09, 0.96, 0.7],
      [0.94, 0.88, 1.2], [0.98, 0.95, 0.8], [0.50, 0.02, 0.6],
    ] as [number, number, number][],
  },
} as const;

// ── LEADERBOARD RANK MEDALS ──────────────────────────────────────────────────

export const RANK_MEDALS: Record<1 | 2 | 3, { gradient: readonly GradientStop[]; glow: string }> = {
  1: {
    gradient: GRADIENTS.rankGold,
    glow: 'rgba(232,184,109,0.60)',
  },
  2: {
    gradient: GRADIENTS.rankSilver,
    glow: 'rgba(160,160,192,0.45)',
  },
  3: {
    gradient: GRADIENTS.rankBronze,
    glow: 'rgba(192,96,48,0.40)',
  },
};

// ── LEVEL PROGRESSION THEMES ─────────────────────────────────────────────────
// Each theme is activated by the user's current level. The card's background
// gradient, radial glow, accent colours, and petal palette evolve with the
// user's progression — giving a visible sense of achievement.
//
// 🌸 Lv 0–19   Sakura        (warm cherry blossom)
// 🌙 Lv 20–39  Night Café    (moonlit indigo)
// 🌌 Lv 40–59  Aurora        (teal/emerald northern lights)
// 👑 Lv 60–79  Royal Palace  (deep violet & gold)
// 🔥 Lv 80+    Legendary     (crimson & ember)

export interface LevelTheme {
  /** Display name for the theme. */
  name: string;
  /** Emoji representing the theme. */
  emoji: string;
  /** Diagonal card background gradient stops. */
  bgGradient: readonly GradientStop[];
  /** Color of the large radial glow behind the avatar (rgba string). */
  avatarGlowColor: string;
  /** Avatar ring gradient stops. */
  ringGradient: readonly GradientStop[];
  /** XP bar fill gradient stops. */
  xpBarGradient: readonly GradientStop[];
  /** Rank number gradient stops. */
  rankGradient: readonly GradientStop[];
  /** Glass panel border highlight color. */
  glassBorder: string;
}

export const LEVEL_THEMES = {
  // 🌸 Sakura (Level 0–19): Cherry blossom warmth — the beginning
  sakura: {
    name: 'Sakura',
    emoji: '🌸',
    bgGradient: [
      { offset: 0.00, color: '#181008' },
      { offset: 0.55, color: '#0f0a06' },
      { offset: 1.00, color: '#0c0806' },
    ],
    avatarGlowColor: 'rgba(244,194,215,0.18)',
    ringGradient: [
      { offset: 0.00, color: '#f4c2d7' },
      { offset: 0.50, color: '#e8b86d' },
      { offset: 1.00, color: '#f4c2d7' },
    ],
    xpBarGradient: [
      { offset: 0.00, color: '#F6C6D9' },
      { offset: 1.00, color: '#F8D89B' },
    ],
    rankGradient: [
      { offset: 0.0, color: '#fdd8ea' },
      { offset: 1.0, color: '#e89ab8' },
    ],
    glassBorder: 'rgba(244,194,215,0.10)',
  } satisfies LevelTheme,

  // 🌙 Night Café (Level 20–39): Moonlit indigo & silver
  nightCafe: {
    name: 'Night Café',
    emoji: '🌙',
    bgGradient: [
      { offset: 0.00, color: '#0c0c1a' },
      { offset: 0.55, color: '#080810' },
      { offset: 1.00, color: '#060608' },
    ],
    avatarGlowColor: 'rgba(138,171,220,0.20)',
    ringGradient: [
      { offset: 0.00, color: '#b8c9e8' },
      { offset: 0.50, color: '#8aabdc' },
      { offset: 1.00, color: '#b8c9e8' },
    ],
    xpBarGradient: [
      { offset: 0.00, color: '#b8c9e8' },
      { offset: 1.00, color: '#8aabdc' },
    ],
    rankGradient: [
      { offset: 0.0, color: '#dce8f8' },
      { offset: 1.0, color: '#8aabdc' },
    ],
    glassBorder: 'rgba(138,171,220,0.10)',
  } satisfies LevelTheme,

  // 🌌 Aurora (Level 40–59): Northern lights teal & emerald
  aurora: {
    name: 'Aurora',
    emoji: '🌌',
    bgGradient: [
      { offset: 0.00, color: '#0a1a12' },
      { offset: 0.55, color: '#060e0a' },
      { offset: 1.00, color: '#040806' },
    ],
    avatarGlowColor: 'rgba(168,198,159,0.20)',
    ringGradient: [
      { offset: 0.00, color: '#c5dabe' },
      { offset: 0.50, color: '#6fa882' },
      { offset: 1.00, color: '#c5dabe' },
    ],
    xpBarGradient: [
      { offset: 0.00, color: '#c5dabe' },
      { offset: 1.00, color: '#6fa882' },
    ],
    rankGradient: [
      { offset: 0.0, color: '#d8edd4' },
      { offset: 1.0, color: '#6fa882' },
    ],
    glassBorder: 'rgba(168,198,159,0.10)',
  } satisfies LevelTheme,

  // 👑 Royal Palace (Level 60–79): Deep violet & imperial gold
  royal: {
    name: 'Royal Palace',
    emoji: '👑',
    bgGradient: [
      { offset: 0.00, color: '#120a18' },
      { offset: 0.55, color: '#0c060e' },
      { offset: 1.00, color: '#08040a' },
    ],
    avatarGlowColor: 'rgba(180,140,220,0.22)',
    ringGradient: [
      { offset: 0.00, color: '#c8a0e8' },
      { offset: 0.50, color: '#e8b86d' },
      { offset: 1.00, color: '#c8a0e8' },
    ],
    xpBarGradient: [
      { offset: 0.00, color: '#c8a0e8' },
      { offset: 1.00, color: '#e8b86d' },
    ],
    rankGradient: [
      { offset: 0.0, color: '#e0c8f8' },
      { offset: 1.0, color: '#c8a0e8' },
    ],
    glassBorder: 'rgba(180,140,220,0.10)',
  } satisfies LevelTheme,

  // 🔥 Legendary (Level 80+): Crimson flame & smouldering ember
  legendary: {
    name: 'Legendary',
    emoji: '🔥',
    bgGradient: [
      { offset: 0.00, color: '#1a0808' },
      { offset: 0.55, color: '#0f0604' },
      { offset: 1.00, color: '#0a0402' },
    ],
    avatarGlowColor: 'rgba(220,100,80,0.22)',
    ringGradient: [
      { offset: 0.00, color: '#e86040' },
      { offset: 0.50, color: '#e8b86d' },
      { offset: 1.00, color: '#e86040' },
    ],
    xpBarGradient: [
      { offset: 0.00, color: '#e86040' },
      { offset: 1.00, color: '#e8b86d' },
    ],
    rankGradient: [
      { offset: 0.0, color: '#f8c0a0' },
      { offset: 1.0, color: '#e86040' },
    ],
    glassBorder: 'rgba(220,100,80,0.12)',
  } satisfies LevelTheme,
} as const;

/** Select the correct visual theme based on the user's current level. */
export function getLevelTheme(level: number): LevelTheme {
  if (level >= 80) return LEVEL_THEMES.legendary;
  if (level >= 60) return LEVEL_THEMES.royal;
  if (level >= 40) return LEVEL_THEMES.aurora;
  if (level >= 20) return LEVEL_THEMES.nightCafe;
  return LEVEL_THEMES.sakura;
}
