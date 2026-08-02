/**
 * @tensura/design-system — Color Palette
 *
 * Core brand colors, seasonal palettes, semantic aliases, and numeric colors
 * for Discord text UI embeds.
 */

// ── RAW PALETTES ─────────────────────────────────────────────────────────────

export const PALETTE = {
  // Blossom (cherry pink)
  blossom: {
    50:  '#fff0f6',
    100: '#fdd8ea',
    200: '#fbb0d4',
    300: '#f784ae',
    400: '#f4c2d7', // PRIMARY: blossomPink (avatar rings, accents, labels)
    500: '#e89ab8',
    600: '#d47298',
    700: '#b05078',
    800: '#7a3058',
    900: '#501038',
  },

  // Gold (warm café honey)
  gold: {
    50:  '#fef9ed',
    100: '#fdf0ce',
    200: '#fadda0',
    300: '#f5c366',
    400: '#e8b86d', // PRIMARY: warmGold (progress fills, rank badges)
    500: '#d4a047',
    600: '#b8862e',
    700: '#8c601a',
    800: '#60400a',
    900: '#3a2404',
  },

  // Matcha (soft green)
  matcha: {
    300: '#c5dabe',
    400: '#a8c69f', // PRIMARY: success / nature accent
    500: '#8ab08a',
    600: '#6a9068',
  },

  // Espresso (dark backgrounds)
  espresso: {
    50:  '#f5ede8',
    100: '#e8d5c8',
    200: '#c8a890',
    300: '#9a7060',
    400: '#6a4838',
    500: '#4a2820',
    600: '#2d1810',
    700: '#1f1008',
    800: '#150c06',
    900: '#0a0603',
  },

  // Blue hour (Shinkai sky)
  sky: {
    200: '#dce8f8',
    300: '#b8c9e8', // info / moonlight accent
    400: '#8aabdc',
    500: '#5c88cc',
    600: '#3a60a8',
  },

  // Neutral (warm-tinted grays)
  neutral: {
    white:  '#ffffff',
    50:     '#faf6f2',
    100:    '#f5f0eb',
    200:    '#e8e0d8',
    300:    '#cfc4b8',
    400:    '#b0a098',
    500:    '#9a8878',
    600:    '#7a6560',
    700:    '#5a4840',
    800:    '#3a2c28',
    900:    '#1a1008',
    black:  '#000000',
  },
} as const;

// ── SEASONAL PALETTES ─────────────────────────────────────────────────────────

export interface SeasonalPalette {
  primary: string;
  secondary: string;
  accent: string;
  bgStart: string;
  bgEnd: string;
  glassTint: string;
}

export const SEASONAL_PALETTES: Record<'spring' | 'summer' | 'autumn' | 'winter', SeasonalPalette> = {
  // Spring (Sakura Bloom): soft cherry pinks and warm golds
  spring: {
    primary:   PALETTE.blossom[400],
    secondary: PALETTE.gold[400],
    accent:    PALETTE.matcha[400],
    bgStart:   '#180c18',
    bgEnd:     '#100a08',
    glassTint: 'rgba(244,194,215,0.08)',
  },
  // Summer (Sunny Meadow): vibrant blues, golds, and greens
  summer: {
    primary:   PALETTE.sky[400],
    secondary: PALETTE.gold[300],
    accent:    PALETTE.matcha[500],
    bgStart:   '#081420',
    bgEnd:     '#05080c',
    glassTint: 'rgba(138,171,220,0.08)',
  },
  // Autumn (Momiji Maple): warm ambers, deep oranges, and rich browns
  autumn: {
    primary:   PALETTE.gold[400],
    secondary: PALETTE.espresso[300],
    accent:    '#e07a5f',
    bgStart:   '#1e1008',
    bgEnd:     '#0e0804',
    glassTint: 'rgba(232,184,109,0.08)',
  },
  // Winter (Snowy Peak): ice blues, cool grays, and silver whites
  winter: {
    primary:   PALETTE.sky[300],
    secondary: PALETTE.neutral[300],
    accent:    PALETTE.sky[200],
    bgStart:   '#0c1018',
    bgEnd:     '#06080c',
    glassTint: 'rgba(184,201,232,0.08)',
  },
};

// ── NUMERIC EMBED COLORS ──────────────────────────────────────────────────────
// Discord EmbedBuilder requires raw hexadecimal numbers, e.g. 0xf4c2d7.
// These are mapped directly from our brand colors.

export const NUMERIC_COLORS = {
  blossomPink: 0xf4c2d7,
  matcha:      0xa8c69f,
  cream:       0xfff3e6,
  warmGold:    0xe8b86d,
  espresso:    0x4a3428,
  success:     0xa8c69f,
  warning:     0xe8b86d,
  danger:      0xe08a8a,
  info:        0xb8c9e8,
} as const;

// ── SEMANTIC COLOR ALIASES ────────────────────────────────────────────────────

export const COLORS = {
  bg: {
    void:        PALETTE.espresso[900], // #0a0603
    deepCard:    '#0f0a06',             // main card backgrounds
    card:        '#1a1008',             // elevated panels
    panel:       '#251408',             // secondary panels
    panelHover:  '#301a0c',             // hover state
  },

  brand: {
    pink:        PALETTE.blossom[400],  // #f4c2d7
    pinkLight:   PALETTE.blossom[200],  // #fbb0d4
    pinkDeep:    PALETTE.blossom[600],  // #d47298
    gold:        PALETTE.gold[400],     // #e8b86d
    goldLight:   PALETTE.gold[200],     // #fadda0
    goldDeep:    PALETTE.gold[600],     // #b8862e
    matcha:      PALETTE.matcha[400],   // #a8c69f
    sky:         PALETTE.sky[300],      // #b8c9e8
  },

  text: {
    primary:    PALETTE.neutral[100],   // #f5f0eb
    secondary:  PALETTE.neutral[300],   // #cfc4b8
    muted:      PALETTE.neutral[500],   // #9a8878
    disabled:   PALETTE.neutral[700],   // #5a4840
    accent:     PALETTE.blossom[400],   // blossomPink
    gold:       PALETTE.gold[300],      // warmGold
    inverse:    PALETTE.espresso[800],  // on light surfaces
  },

  border: {
    strong:     'rgba(244,194,215,0.40)',   // blossomPink border
    medium:     'rgba(244,194,215,0.20)',   // subtle pink border
    subtle:     'rgba(244,194,215,0.08)',   // barely-there
    goldStrong: 'rgba(232,184,109,0.35)',   // gold border
    goldMedium: 'rgba(232,184,109,0.18)',
    glass:      'rgba(255,243,230,0.10)',   // glass panel border
    glassLight: 'rgba(255,255,255,0.06)',
  },

  glass: {
    primary:    'rgba(255,243,230,0.06)', // warm white glass
    secondary:  'rgba(255,243,230,0.03)',
    pink:       'rgba(244,194,215,0.08)', // tinted pink glass
    dark:       'rgba(0,0,0,0.25)',       // darkening layer
  },

  semantic: {
    success:  PALETTE.matcha[400],
    warning:  PALETTE.gold[400],
    danger:   '#e08a8a',
    info:     PALETTE.sky[300],
  },
} as const;

// ── GRADIENT SPECIFICATIONS ──────────────────────────────────────────────────

export type GradientStop = { offset: number; color: string };

export const GRADIENTS = {
  xpBar: [
    { offset: 0.00, color: '#f4c2d7' }, // blossomPink
    { offset: 0.45, color: '#ecaa88' }, // peach transition
    { offset: 1.00, color: '#e8b86d' }, // warmGold
  ],

  xpBarSheen: [
    { offset: 0.0, color: 'rgba(255,255,255,0.18)' },
    { offset: 0.5, color: 'rgba(255,255,255,0.06)' },
    { offset: 1.0, color: 'rgba(255,255,255,0.00)' },
  ],

  rankCardBg: [
    { offset: 0.00, color: '#141008' },
    { offset: 0.50, color: '#0f0a06' },
    { offset: 1.00, color: '#0c0806' },
  ],

  welcomeBg: [
    { offset: 0.00, color: '#180c18' },
    { offset: 0.40, color: '#100a08' },
    { offset: 1.00, color: '#080c10' },
  ],

  leaderboardBg: [
    { offset: 0.00, color: '#120c08' },
    { offset: 1.00, color: '#0a0808' },
  ],

  glassPrimary: [
    { offset: 0.0, color: 'rgba(255,243,230,0.07)' },
    { offset: 1.0, color: 'rgba(255,243,230,0.02)' },
  ],

  glassDiagonal: [
    { offset: 0.0, color: 'rgba(255,243,230,0.08)' },
    { offset: 0.5, color: 'rgba(255,243,230,0.04)' },
    { offset: 1.0, color: 'rgba(255,243,230,0.01)' },
  ],

  avatarRing: [
    { offset: 0.00, color: '#f4c2d7' },
    { offset: 0.50, color: '#e8b86d' },
    { offset: 1.00, color: '#f4c2d7' },
  ],

  rankDisplay: [
    { offset: 0.0, color: '#fdd8ea' },
    { offset: 1.0, color: '#e89ab8' },
  ],

  rankGold: [
    { offset: 0.0, color: '#fdf0ce' },
    { offset: 1.0, color: '#d4a047' },
  ],

  rankSilver: [
    { offset: 0.0, color: '#f0f0f5' },
    { offset: 1.0, color: '#a0a0c0' },
  ],

  rankBronze: [
    { offset: 0.0, color: '#f5dfc0' },
    { offset: 1.0, color: '#c06030' },
  ],

  heroName: [
    { offset: 0.0, color: '#ffffff' },
    { offset: 1.0, color: '#f4c2d7' },
  ],

  bottomVignette: [
    { offset: 0.0, color: 'rgba(0,0,0,0.00)' },
    { offset: 1.0, color: 'rgba(0,0,0,0.45)' },
  ],

  leftFade: [
    { offset: 0.0, color: 'rgba(15,10,6,0.85)' },
    { offset: 1.0, color: 'rgba(15,10,6,0.00)' },
  ],
} as const;
