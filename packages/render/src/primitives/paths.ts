/**
 * Canvas path helpers — shape primitives shared across all card templates.
 *
 * These functions only define paths (beginPath … closePath). Filling,
 * stroking, and clipping are the caller's responsibility, which keeps
 * the primitive layer composable and side-effect-free.
 */

import type { SKRSContext2D as CanvasRenderingContext2D } from '@napi-rs/canvas';

// ─────────────────────────────────────────────────────────────────────────────
// ROUNDED RECTANGLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Define a rounded rectangle path using arc-to so corners are true arcs.
 * Clamps `r` so it can never exceed half of the shorter side.
 */
export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const safeR = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeR, y);
  ctx.arcTo(x + w, y,     x + w, y + h, safeR);
  ctx.arcTo(x + w, y + h, x,     y + h, safeR);
  ctx.arcTo(x,     y + h, x,     y,     safeR);
  ctx.arcTo(x,     y,     x + w, y,     safeR);
  ctx.closePath();
}

/**
 * Define a rounded rectangle path with individually specified corner radii.
 * Order: [topLeft, topRight, bottomRight, bottomLeft]
 */
export function roundedRectVarying(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  [tl, tr, br, bl]: [number, number, number, number],
): void {
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  // top edge → top-right corner
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  // right edge → bottom-right corner
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  // bottom edge → bottom-left corner
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  // left edge → top-left corner
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

// ─────────────────────────────────────────────────────────────────────────────
// CIRCLE
// ─────────────────────────────────────────────────────────────────────────────

/** Define a full circle path centred at (cx, cy) with radius r. */
export function circlePath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
}

// ─────────────────────────────────────────────────────────────────────────────
// PILL  (width >= height, fully rounded ends)
// ─────────────────────────────────────────────────────────────────────────────

/** Define a pill (fully rounded rectangle) path. */
export function pillPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  roundedRect(ctx, x, y, w, h, h / 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIP HELPERS
// These combine path definition + ctx.clip() in one call.
// ─────────────────────────────────────────────────────────────────────────────

/** Save, clip to a circle, then call fn. Restores afterwards. */
export function withCircleClip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fn: () => void,
): void {
  ctx.save();
  circlePath(ctx, cx, cy, r);
  ctx.clip();
  fn();
  ctx.restore();
}

/** Save, clip to a rounded rect, then call fn. Restores afterwards. */
export function withRoundedRectClip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fn: () => void,
): void {
  ctx.save();
  roundedRect(ctx, x, y, w, h, r);
  ctx.clip();
  fn();
  ctx.restore();
}
