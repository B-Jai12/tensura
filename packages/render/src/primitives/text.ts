/**
 * Text rendering utilities for canvas card templates.
 *
 * Provides:
 *  - Consistent font string construction
 *  - Text truncation with ellipsis (respects measured width)
 *  - Gradient-fill text (for hero usernames and rank numbers)
 *  - Formatted number helpers (XP: "12,450", rank: "#42")
 */

import type { SKRSContext2D as CanvasRenderingContext2D } from '@napi-rs/canvas';
import type { GradientStop } from '../tokens.js';
import { COLORS, TYPOGRAPHY, font } from '../tokens.js';
import { applyShadow, clearShadow } from './effects.js';
import type { ShadowDescriptor } from '../tokens.js';

// ─────────────────────────────────────────────────────────────────────────────
// MEASUREMENT & TRUNCATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Truncate `text` so it fits within `maxWidth` pixels using the current
 * ctx.font, appending "…" if truncation was needed.
 */
export function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let lo = 0;
  let hi = text.length;
  const ellipsis = '…';
  const ellipsisWidth = ctx.measureText(ellipsis).width;

  while (lo < hi) {
    const mid  = Math.floor((lo + hi) / 2);
    const slice = text.slice(0, mid) + ellipsis;
    if (ctx.measureText(slice).width <= maxWidth - ellipsisWidth) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return text.slice(0, lo - 1) + ellipsis;
}

// ─────────────────────────────────────────────────────────────────────────────
// GRADIENT TEXT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw text filled with a horizontal linear gradient.
 * The gradient spans the measured text width so colour distribution is
 * always consistent regardless of text length.
 */
export function fillGradientText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  stops: readonly GradientStop[],
  shadow?: ShadowDescriptor,
): void {
  const metrics    = ctx.measureText(text);
  const textWidth  = metrics.width;

  const gradient = ctx.createLinearGradient(x, y, x + textWidth, y);
  for (const { offset, color } of stops) {
    gradient.addColorStop(offset, color);
  }

  ctx.save();
  if (shadow) {
    applyShadow(ctx, shadow);
  }
  ctx.fillStyle = gradient;
  ctx.fillText(text, x, y);
  clearShadow(ctx);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// STANDARD TEXT DRAW HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export interface TextOptions {
  x: number;
  y: number;
  text: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: 'display' | 'body';
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxWidth?: number;
  shadow?: ShadowDescriptor;
  alpha?: number;
}

/**
 * Draw plain text with full configuration. This is the workhorse for
 * all non-gradient, non-special text in cards.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  options: TextOptions,
): void {
  const {
    x, y, text,
    color       = COLORS.text.primary,
    fontSize    = TYPOGRAPHY.sizes.md,
    fontWeight  = TYPOGRAPHY.weights.regular,
    fontFamily  = 'body',
    align       = 'left',
    baseline    = 'alphabetic',
    maxWidth,
    shadow,
    alpha       = 1,
  } = options;

  ctx.save();

  ctx.font         = font(fontWeight, fontSize, fontFamily);
  ctx.textAlign    = align;
  ctx.textBaseline = baseline;
  ctx.globalAlpha  = alpha;

  if (shadow) applyShadow(ctx, shadow);

  const displayText = maxWidth
    ? truncate(ctx, text, maxWidth)
    : text;

  ctx.fillStyle = color;
  ctx.fillText(displayText, x, y);

  clearShadow(ctx);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

/** Format an XP value with locale commas: 12450 → "12,450" */
export function formatXp(xp: number): string {
  return xp.toLocaleString('en-US');
}

/** Format a rank position: 1 → "#1", 42 → "#42" */
export function formatRank(rank: number): string {
  return `#${rank.toLocaleString('en-US')}`;
}

/** Format a member count: 1234 → "Member #1,234" */
export function formatMemberCount(count: number): string {
  return `Member #${count.toLocaleString('en-US')}`;
}

/** Format a level: 5 → "LEVEL 5" */
export function formatLevel(level: number): string {
  return `LEVEL ${level}`;
}

/** Format a level badge: 5 → "LVL 5" */
export function formatLevelBadge(level: number): string {
  return `LVL ${level}`;
}

/** Compact large numbers: 12450 → "12.4K", 1234567 → "1.2M" */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
