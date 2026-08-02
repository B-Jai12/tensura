/**
 * Avatar fetching and circular rendering.
 *
 * Features:
 *  - Fetches Discord CDN avatar URLs with a proper User-Agent header
 *  - In-memory LRU cache to avoid re-downloading during the same process
 *  - Falls back to a beautifully styled initial-based default avatar
 *  - Draws the avatar as a clipped circle with a gradient ring and glow
 */

import { createCanvas, loadImage, type Image } from '@napi-rs/canvas';
import type { SKRSContext2D as CanvasRenderingContext2D } from '@napi-rs/canvas';
import { GRADIENTS, SHADOWS, font } from '../tokens.js';
import { circlePath, withCircleClip } from './paths.js';
import { applyShadow, clearShadow, linearGradient, radialGradient } from './effects.js';

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR CACHE
// Simple in-process LRU (bounded Map — evicts oldest on overflow).
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_MAX = 512;
const avatarCache = new Map<string, Buffer>();
const inFlightRequests = new Map<string, Promise<Buffer>>();

function cacheGet(url: string): Buffer | undefined {
  const val = avatarCache.get(url);
  if (val !== undefined) {
    // Move to end (most-recently-used)
    avatarCache.delete(url);
    avatarCache.set(url, val);
  }
  return val;
}

function cacheSet(url: string, buf: Buffer): void {
  if (avatarCache.size >= CACHE_MAX) {
    // Evict the oldest entry (first key in insertion order)
    const oldest = avatarCache.keys().next().value;
    if (oldest) avatarCache.delete(oldest);
  }
  avatarCache.set(url, buf);
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────────────────────────────────────

async function fetchAvatarBuffer(url: string): Promise<Buffer> {
  const cached = cacheGet(url);
  if (cached) return cached;

  let promise = inFlightRequests.get(url);
  if (!promise) {
    promise = (async () => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Tensura Discord Bot/1.0 (github.com/tensura)' },
          signal: AbortSignal.timeout(8_000),
        });

        if (!res.ok) throw new Error(`Avatar fetch failed: ${res.status}`);

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        cacheSet(url, buffer);
        return buffer;
      } finally {
        inFlightRequests.delete(url);
      }
    })();
    inFlightRequests.set(url, promise);
  }

  return promise;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT AVATAR (initials-based fallback)
// ─────────────────────────────────────────────────────────────────────────────

/** A palette of warm accent colors for fallback avatar backgrounds. */
const FALLBACK_COLORS = [
  '#c06880', '#a06888', '#806898', '#6870a8',
  '#5890a8', '#48a098', '#60a880', '#88a068',
];

function userIdToFallbackColor(userId: string): string {
  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]!;
}

/**
 * Render a square PNG buffer as a default avatar: coloured background with
 * the first character of the display name centred in Outfit font.
 */
async function renderDefaultAvatar(
  displayName: string,
  userId: string,
  size: number,
): Promise<Image> {
  const canvas = createCanvas(size, size);
  const ctx    = canvas.getContext('2d');
  const bg     = userIdToFallbackColor(userId);
  const letter = (displayName[0] ?? '?').toUpperCase();

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Subtle gradient overlay
  const grad = radialGradient(ctx, size / 2, size / 2, 0, size * 0.7, [
    { offset: 0.0, color: 'rgba(255,255,255,0.15)' },
    { offset: 1.0, color: 'rgba(0,0,0,0.15)' },
  ]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Initial letter
  const fontSize = size * 0.42;
  ctx.font         = font(700, fontSize, 'display');
  ctx.fillStyle    = 'rgba(255,255,255,0.92)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, size / 2, size / 2 + size * 0.02);

  const buffer = canvas.toBuffer('image/png');
  return loadImage(buffer);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load a Discord avatar, falling back to an initials avatar on any error.
 * Returns an @napi-rs/canvas Image ready for drawImage().
 */
export async function loadAvatar(
  avatarUrl: string,
  displayName: string,
  userId: string,
  size = 256,
): Promise<Image> {
  try {
    const buffer = await fetchAvatarBuffer(
      // Request a nicely sized version from Discord CDN
      avatarUrl.includes('?') ? avatarUrl : `${avatarUrl}?size=${size}`,
    );
    return loadImage(buffer);
  } catch {
    return renderDefaultAvatar(displayName, userId, size);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CIRCULAR AVATAR DRAWING
// ─────────────────────────────────────────────────────────────────────────────

export interface AvatarDrawOptions {
  /** Centre X of the circular avatar. */
  cx: number;
  /** Centre Y of the circular avatar. */
  cy: number;
  /** Radius of the visible avatar circle. */
  radius: number;
  /** Outer glow shadow colour (rgba string). Default: blossomPink glow. */
  glowColor?: string;
  /** Whether to draw the gradient ring around the avatar. Default: true. */
  drawRing?: boolean;
  /** Width of the gradient ring in pixels. Default: 3. */
  ringWidth?: number;
  /** Custom gradient stops for the ring. Defaults to avatarRing gradient. */
  ringGradient?: readonly { offset: number; color: string }[];
  /** Whether to draw a subtle drop shadow behind the avatar. Default: true. */
  drawGlow?: boolean;
}

/**
 * Draw a circular avatar with:
 *  1. A soft pink glow behind the circle
 *  2. The avatar image clipped to a circle
 *  3. A gradient ring (blossomPink → warmGold → blossomPink)
 *  4. A thin inner border to separate the ring from the image
 */
export function drawCircularAvatar(
  ctx: CanvasRenderingContext2D,
  avatar: Image,
  options: AvatarDrawOptions,
): void {
  const {
    cx, cy, radius,
    glowColor   = SHADOWS.avatarGlow.color,
    drawRing    = true,
    ringWidth   = 3,
    ringGradient = GRADIENTS.avatarRing,
    drawGlow    = true,
  } = options;

  ctx.save();

  // 1. Outer glow shadow
  if (drawGlow) {
    ctx.save();
    applyShadow(ctx, { ...SHADOWS.avatarGlow, color: glowColor });
    circlePath(ctx, cx, cy, radius + 4);
    ctx.fillStyle = 'transparent';
    // Draw a transparent circle just to trigger the shadow
    ctx.fillStyle = glowColor.replace(/[\d.]+\)$/, '0.01)');
    ctx.fill();
    clearShadow(ctx);
    ctx.restore();
  }

  // 2. Avatar image (clipped to circle)
  withCircleClip(ctx, cx, cy, radius, () => {
    ctx.drawImage(avatar, cx - radius, cy - radius, radius * 2, radius * 2);
  });

  // 3. Gradient ring
  if (drawRing) {
    const ringOuter = radius + ringWidth + 1;
    const ringGrad  = ctx.createLinearGradient(
      cx - ringOuter, cy - ringOuter,
      cx + ringOuter, cy + ringOuter,
    );
    for (const { offset, color } of ringGradient) {
      ringGrad.addColorStop(offset, color);
    }

    ctx.lineWidth   = ringWidth;
    ctx.strokeStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + Math.ceil(ringWidth / 2), 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. Inner shadow (separates image from ring)
  ctx.save();
  withCircleClip(ctx, cx, cy, radius, () => {
    const innerGrad = radialGradient(ctx, cx, cy, radius - 8, radius, [
      { offset: 0.0, color: 'rgba(0,0,0,0.00)' },
      { offset: 1.0, color: 'rgba(0,0,0,0.25)' },
    ]);
    ctx.fillStyle = innerGrad;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  });
  ctx.restore();

  ctx.restore();
}


/**
 * Draw a double-ring avatar (welcome card variant).
 * Outer ring: white/semi-transparent; inner ring: blossomPink gradient.
 */
export function drawDoubleRingAvatar(
  ctx: CanvasRenderingContext2D,
  avatar: Image,
  cx: number,
  cy: number,
  radius: number,
): void {
  ctx.save();

  // Glow
  applyShadow(ctx, SHADOWS.avatarGlow);
  circlePath(ctx, cx, cy, radius + 8);
  ctx.fillStyle = 'rgba(244,194,215,0.05)';
  ctx.fill();
  clearShadow(ctx);

  // Outer white ring
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2);
  ctx.stroke();

  // Inner pink ring (gradient)
  const innerGrad = linearGradient(
    ctx,
    cx - radius - 3, cy - radius - 3,
    cx + radius + 3, cy + radius + 3,
    GRADIENTS.avatarRing,
  );
  ctx.strokeStyle = innerGrad;
  ctx.lineWidth   = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
  ctx.stroke();

  // Avatar image
  withCircleClip(ctx, cx, cy, radius, () => {
    ctx.drawImage(avatar, cx - radius, cy - radius, radius * 2, radius * 2);
  });

  ctx.restore();
}
