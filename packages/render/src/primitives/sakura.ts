/**
 * Sakura petal renderer — programmatic cherry blossom decorations.
 *
 * Petals are 5-lobed flowers drawn with bezier curves, scattered at
 * deterministic positions so the same card data always produces the same
 * decoration (seeded from the user's ID). Each petal varies in:
 *  - size      (within SAKURA_CONFIG.sizeRange)
 *  - rotation  (0 – 2π)
 *  - opacity   (within SAKURA_CONFIG.opacityRange)
 *  - color     (sampled from SAKURA_CONFIG.petalColors)
 */

import type { SKRSContext2D as CanvasRenderingContext2D } from '@napi-rs/canvas';
import { SAKURA_CONFIG } from '../tokens.js';

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC PRNG  (Mulberry32 — fast, good quality, 32-bit seed)
// ─────────────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a user ID string into a 32-bit numeric seed. */
function idToSeed(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = Math.imul(31, hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE PETAL DRAWING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw one sakura petal flower at (cx, cy).
 * A petal flower = 5 petals rotated 72° apart.
 * Each petal is drawn as a pair of cubic bezier curves forming a teardrop.
 */
function drawSakuraPetal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  color: string,
  opacity: number,
): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle   = color;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const PETAL_COUNT = 5;
  const angleStep   = (Math.PI * 2) / PETAL_COUNT;

  for (let i = 0; i < PETAL_COUNT; i++) {
    ctx.save();
    ctx.rotate(i * angleStep);

    // Each petal: a teardrop pointing "up" (negative Y) from origin.
    // Control points create a heart/leaf shape.
    const tip = -size;           // tip of the petal
    const side = size * 0.55;    // half-width at the widest part
    const cpY  = size * -0.35;   // Y of the control points (upper half)

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
       side,  cpY,     // cp1
       side,  tip,     // cp2
       0,     tip,     // end
    );
    ctx.bezierCurveTo(
      -side,  tip,     // cp1
      -side,  cpY,     // cp2
       0,     0,       // back to origin
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Small central circle detail
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${opacity * 0.6})`;
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export type CardLayoutKey = keyof typeof SAKURA_CONFIG.layouts;

/**
 * Draw all sakura petals for a card using the pre-defined layout grid for
 * that card type. Pass `userId` to get deterministic, per-user placement
 * within each zone's bounds. Pass `'default'` for a fixed arrangement.
 */
export function drawSakuraPetals(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layoutKey: CardLayoutKey,
  userId = 'default',
): void {
  const layout = SAKURA_CONFIG.layouts[layoutKey];
  const rng    = mulberry32(idToSeed(userId));
  const [minOpacity, maxOpacity] = SAKURA_CONFIG.opacityRange;
  const [minSize,    maxSize]    = SAKURA_CONFIG.sizeRange;

  ctx.save();

  for (const [xPct, yPct, sizeMult] of layout) {
    // Add tiny random jitter (±2% of card dimension) so two users in the same
    // zone don't overlap perfectly, but the composition stays stable.
    const jitterX = (rng() - 0.5) * 0.04 * width;
    const jitterY = (rng() - 0.5) * 0.04 * height;

    const cx = xPct * width  + jitterX;
    const cy = yPct * height + jitterY;

    const size     = minSize + rng() * (maxSize - minSize) * sizeMult;
    const rotation = rng() * Math.PI * 2;
    const opacity  = minOpacity + rng() * (maxOpacity - minOpacity);
    const colorIdx = Math.floor(rng() * SAKURA_CONFIG.petalColors.length);
    const color    = SAKURA_CONFIG.petalColors[colorIdx]!;

    drawSakuraPetal(ctx, cx, cy, size, rotation, color, opacity);
  }

  ctx.restore();
}

/**
 * Draw a single sakura petal flower (useful for inline decorations,
 * e.g. next to a header text or inside a badge).
 */
export function drawInlineSakura(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size = 10,
  rotation = 0,
  opacity = 0.55,
): void {
  drawSakuraPetal(
    ctx, cx, cy, size, rotation,
    SAKURA_CONFIG.petalColors[0]!,
    opacity,
  );
}
