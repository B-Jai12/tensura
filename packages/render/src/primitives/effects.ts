/**
 * Visual effects primitives — glassmorphism panels, background layers,
 * gradient fills, shadow helpers, progress bars, and bokeh circles.
 *
 * Every function here is a self-contained side-effectful canvas draw call.
 * Call order matters — these build up in painter's order (back to front).
 */

import type { SKRSContext2D as CanvasRenderingContext2D } from '@napi-rs/canvas';
import type { GradientStop, ShadowDescriptor } from '../tokens.js';
import { COLORS, GRADIENTS, RADII, SHADOWS } from '../tokens.js';
import { circlePath, pillPath, roundedRect } from './paths.js';

// ─────────────────────────────────────────────────────────────────────────────
// GRADIENT UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Apply a list of colour stops to an already-created CanvasGradient. */
function applyStops(
  gradient: CanvasGradient,
  stops: readonly GradientStop[],
): CanvasGradient {
  for (const { offset, color } of stops) {
    gradient.addColorStop(offset, color);
  }
  return gradient;
}

/** Create a linear gradient spanning from (x0,y0) → (x1,y1). */
export function linearGradient(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number,
  x1: number, y1: number,
  stops: readonly GradientStop[],
): CanvasGradient {
  return applyStops(ctx.createLinearGradient(x0, y0, x1, y1), stops);
}

/** Create a radial gradient from inner circle to outer circle. */
export function radialGradient(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  innerR: number, outerR: number,
  stops: readonly GradientStop[],
): CanvasGradient {
  return applyStops(ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR), stops);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHADOW HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Apply a shadow descriptor to the context. Call clearShadow() when done. */
export function applyShadow(
  ctx: CanvasRenderingContext2D,
  shadow: ShadowDescriptor,
): void {
  ctx.shadowBlur    = shadow.blur;
  ctx.shadowColor   = shadow.color;
  ctx.shadowOffsetX = shadow.offsetX ?? 0;
  ctx.shadowOffsetY = shadow.offsetY ?? 0;
}

/** Reset all shadow state. Always call after applyShadow(). */
export function clearShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowBlur    = 0;
  ctx.shadowColor   = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND LAYER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw a full-card background with a diagonal linear gradient.
 * Covers the entire canvas — always the first draw call.
 */
export function drawCardBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stops: readonly GradientStop[] = GRADIENTS.rankCardBg,
): void {
  const gradient = linearGradient(ctx, 0, 0, width, height, stops);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw a subtle bottom-edge vignette to give cards depth and ground them.
 * Layer this on top of the card background, before content.
 */
export function drawBottomVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vignetteHeight = height * 0.35,
): void {
  const gradient = linearGradient(
    ctx,
    0, height - vignetteHeight,
    0, height,
    GRADIENTS.bottomVignette,
  );
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - vignetteHeight, width, vignetteHeight);
}

/**
 * Draw a thin horizontal stripe of subtly lighter colour near the top
 * to simulate a light source and give the card a 3D shelf feeling.
 */
export function drawTopSheen(
  ctx: CanvasRenderingContext2D,
  width: number,
  sheenHeight = 60,
): void {
  const gradient = linearGradient(ctx, 0, 0, 0, sheenHeight, [
    { offset: 0.0, color: 'rgba(255,243,230,0.04)' },
    { offset: 1.0, color: 'rgba(255,243,230,0.00)' },
  ]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, sheenHeight);
}

// ─────────────────────────────────────────────────────────────────────────────
// GLASSMORPHISM PANEL
// ─────────────────────────────────────────────────────────────────────────────

export interface GlassPanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  /** Gradient direction: 'vertical' | 'diagonal'. Default: 'vertical'. */
  direction?: 'vertical' | 'diagonal';
  /** Border width in pixels. Default: 1. */
  borderWidth?: number;
  borderColor?: string;
  fillStops?: readonly GradientStop[];
}

/**
 * Draw a glassmorphism-style panel — semi-transparent, gradient-filled, with
 * a soft pink border. Since canvas 2D has no true backdrop-filter, we
 * simulate the glass look via warm translucent fill + border + inner sheen.
 */
export function drawGlassPanel(
  ctx: CanvasRenderingContext2D,
  options: GlassPanelOptions,
): void {
  const {
    x, y, width, height,
    radius       = RADII.xl,
    direction    = 'vertical',
    borderWidth  = 1,
    borderColor  = COLORS.border.medium,
    fillStops    = GRADIENTS.glassPrimary,
  } = options;

  ctx.save();

  // --- Fill ---
  const x1 = direction === 'diagonal' ? x + width : x;
  const y1 = direction === 'diagonal' ? y : y + height;
  const gradient = linearGradient(ctx, x, y, x1, y1, fillStops);

  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = gradient;
  ctx.fill();

  // --- Inner top sheen ---
  const sheenGrad = linearGradient(ctx, x, y, x, y + height * 0.4, [
    { offset: 0.0, color: 'rgba(255,255,255,0.05)' },
    { offset: 1.0, color: 'rgba(255,255,255,0.00)' },
  ]);
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = sheenGrad;
  ctx.fill();

  // --- Border ---
  roundedRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth   = borderWidth;
  ctx.stroke();

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressBarOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Value in [0, 1]. Clamped automatically. */
  progress: number;
  trackColor?: string;
  fillStops?: readonly GradientStop[];
  /** Whether to draw a small white glow dot at the fill endpoint. */
  showEndGlow?: boolean;
}

/**
 * Draw a rounded XP progress bar — dark track + gradient fill + end glow dot.
 * The gradient is always calculated over the full bar width so color
 * progression stays consistent regardless of fill amount.
 */
export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  options: ProgressBarOptions,
): void {
  const {
    x, y, width, height,
    progress,
    trackColor  = 'rgba(255,255,255,0.07)',
    fillStops   = GRADIENTS.xpBar,
    showEndGlow = true,
  } = options;

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const fillWidth = Math.max(height, width * clampedProgress); // at least a capsule
  const r = height / 2;

  ctx.save();

  // Track
  pillPath(ctx, x, y, width, height);
  ctx.fillStyle = trackColor;
  ctx.fill();

  // Fill — gradient spans full bar width for consistent color ramp
  if (clampedProgress > 0) {
    const fillGrad = linearGradient(ctx, x, y, x + width, y, fillStops);

    pillPath(ctx, x, y, fillWidth, height);
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Top sheen on fill
    const sheenGrad = linearGradient(ctx, x, y, x, y + height, GRADIENTS.xpBarSheen);
    pillPath(ctx, x, y, fillWidth, height);
    ctx.fillStyle = sheenGrad;
    ctx.fill();

    // End glow dot
    if (showEndGlow && fillWidth < width - r) {
      const dotX = x + fillWidth;
      const dotY = y + r;

      applyShadow(ctx, SHADOWS.progressGlow);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.90)';
      ctx.fill();
      clearShadow(ctx);
    }
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// BOKEH CIRCLES  (decorative background atmosphere)
// ─────────────────────────────────────────────────────────────────────────────

export interface BokehConfig {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity: number;
}

/**
 * Draw soft, out-of-focus bokeh circles that add atmospheric depth to the
 * card backgrounds. Use ctx.filter for blur if available; otherwise rely on
 * radial gradient transparency which gives a similar soft-edged feel.
 */
export function drawBokehCircles(
  ctx: CanvasRenderingContext2D,
  circles: BokehConfig[],
): void {
  ctx.save();
  for (const { cx, cy, r, color, opacity } of circles) {
    const grad = radialGradient(ctx, cx, cy, 0, r, [
      { offset: 0.0, color: color.replace(')', `,${opacity})`).replace('rgb', 'rgba') },
      { offset: 0.5, color: color.replace(')', `,${opacity * 0.4})`).replace('rgb', 'rgba') },
      { offset: 1.0, color: 'rgba(0,0,0,0)' },
    ]);
    circlePath(ctx, cx, cy, r);
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// DECORATIVE LINE / DIVIDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw a horizontal gradient divider line — fades in from the left,
 * holds full opacity in the centre, then fades out to the right.
 * Used in welcome cards between the greeting and the server name.
 */
export function drawDividerLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  color = COLORS.brand.pink,
  lineWidth = 1,
): void {
  const gradient = linearGradient(ctx, x, y, x + width, y, [
    { offset: 0.0, color: 'rgba(0,0,0,0)' },
    { offset: 0.2, color: color },
    { offset: 0.8, color: color },
    { offset: 1.0, color: 'rgba(0,0,0,0)' },
  ]);
  ctx.save();
  ctx.strokeStyle = gradient;
  ctx.lineWidth   = lineWidth;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// PILL BADGE  (level badge, rank tag, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export interface PillBadgeOptions {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textColor?: string;
  fillColor?: string;
  borderColor?: string;
  paddingX?: number;
  paddingY?: number;
  /** Shadow to apply behind the badge. */
  shadow?: ShadowDescriptor;
}

/**
 * Draw a pill-shaped badge (e.g. "LVL 12", "#42") and return the
 * measured width of the pill so callers can lay out adjacent elements.
 */
export function drawPillBadge(
  ctx: CanvasRenderingContext2D,
  options: PillBadgeOptions,
): number {
  const {
    x, y, text,
    fontSize    = 13,
    fontFamily  = 'Outfit',
    fontWeight  = 700,
    textColor   = COLORS.brand.pink,
    fillColor   = 'rgba(244,194,215,0.10)',
    borderColor = COLORS.border.medium,
    paddingX    = 12,
    paddingY    = 5,
    shadow,
  } = options;

  ctx.save();

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const textWidth  = ctx.measureText(text).width;
  const pillWidth  = textWidth + paddingX * 2;
  const pillHeight = fontSize + paddingY * 2;

  if (shadow) {
    applyShadow(ctx, shadow);
  }

  // Background fill
  pillPath(ctx, x, y, pillWidth, pillHeight);
  ctx.fillStyle = fillColor;
  ctx.fill();

  clearShadow(ctx);

  // Border
  pillPath(ctx, x, y, pillWidth, pillHeight);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text
  ctx.fillStyle   = textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign   = 'center';
  ctx.fillText(text, x + pillWidth / 2, y + pillHeight / 2);

  ctx.restore();

  return pillWidth;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAND WATERMARK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw the Tensura "🌸 Tensura" watermark at the bottom-right of the card.
 * Always the last draw call on any card — sits above everything.
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text = '🌸 Tensura',
): void {
  ctx.save();
  ctx.font          = `400 11px Inter, system-ui`;
  ctx.fillStyle     = 'rgba(202,180,165,0.40)';
  ctx.textAlign     = 'right';
  ctx.textBaseline  = 'bottom';
  ctx.fillText(text, width - 16, height - 10);
  ctx.restore();
}
