/**
 * @tensura/design-system — Shadows System
 */

export interface ShadowDescriptor {
  blur: number;
  color: string;
  offsetX?: number;
  offsetY?: number;
}

export const SHADOWS = {
  avatarGlow: {
    blur: 32,
    color: 'rgba(244,194,215,0.45)',
    offsetX: 0,
    offsetY: 0,
  },
  avatarGlowGold: {
    blur: 32,
    color: 'rgba(232,184,109,0.35)',
    offsetX: 0,
    offsetY: 0,
  },
  textPink: {
    blur: 12,
    color: 'rgba(244,194,215,0.70)',
    offsetX: 0,
    offsetY: 0,
  },
  textGold: {
    blur: 10,
    color: 'rgba(232,184,109,0.60)',
    offsetX: 0,
    offsetY: 0,
  },
  rankNumber: {
    blur: 20,
    color: 'rgba(244,194,215,0.50)',
    offsetX: 0,
    offsetY: 4,
  },
  card: {
    blur: 48,
    color: 'rgba(0,0,0,0.80)',
    offsetX: 0,
    offsetY: 16,
  },
  progressGlow: {
    blur: 8,
    color: 'rgba(244,194,215,0.50)',
    offsetX: 0,
    offsetY: 0,
  },
  badgePink: {
    blur: 6,
    color: 'rgba(244,194,215,0.35)',
    offsetX: 0,
    offsetY: 2,
  },
} as const;
