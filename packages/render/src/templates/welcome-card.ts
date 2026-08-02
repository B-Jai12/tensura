/**
 * Welcome Card Template — 1024 × 400 px
 *
 * Layout:
 *  LEFT HALF   — Avatar with double ring, bokeh atmosphere
 *  RIGHT HALF  — Welcome text panel (glassmorphism)
 *    - "Welcome to the café,"  (small, muted)
 *    - Username                (large, gradient)
 *    - Divider line            (pink gradient)
 *    - Server name             (medium, secondary)
 *    - Member count            (small, gold)
 *
 * Layers (back to front):
 *  1. Background gradient
 *  2. Bokeh atmosphere circles
 *  3. Left-side atmospheric fade
 *  4. Top/bottom vignettes
 *  5. Sakura petals (background)
 *  6. Glass right panel
 *  7. Avatar (double ring + glow)
 *  8. Text content
 *  9. Sakura petals (foreground accent)
 * 10. Bottom accent line
 * 11. Watermark
 */

import { createCanvas } from '@napi-rs/canvas';
import {
  CARD_SIZES, COLORS, GRADIENTS, RADII, SHADOWS, TYPOGRAPHY, font,
} from '../tokens.js';
import type { WelcomeCardData } from '../types.js';
import { drawDoubleRingAvatar, loadAvatar } from '../primitives/avatar.js';
import {
  drawCardBackground, drawBottomVignette, drawTopSheen,
  drawGlassPanel, drawBokehCircles, drawDividerLine, drawWatermark,
} from '../primitives/effects.js';
import { drawSakuraPetals } from '../primitives/sakura.js';
import { drawText, formatMemberCount } from '../primitives/text.js';

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const { width, height } = CARD_SIZES.welcome;

const AVATAR_CX     = 220;
const AVATAR_CY     = height / 2;
const AVATAR_RADIUS = 105;

// Right panel: starts just past the avatar area
const PANEL_X      = 360;
const PANEL_WIDTH  = width - PANEL_X - 24;
const TEXT_X       = PANEL_X + 36;
const TEXT_MAX_W   = PANEL_WIDTH - 56;

// ─────────────────────────────────────────────────────────────────────────────
// BOKEH ATMOSPHERE (left half — behind avatar)
// ─────────────────────────────────────────────────────────────────────────────

function drawAtmosphere(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
): void {
  drawBokehCircles(ctx, [
    // Top-left blossom cluster
    { cx: 60,  cy: 70,  r: 90,  color: 'rgb(180,80,120)',  opacity: 0.08 },
    { cx: 140, cy: 40,  r: 60,  color: 'rgb(244,194,215)', opacity: 0.06 },
    // Bottom-left
    { cx: 80,  cy: 360, r: 100, color: 'rgb(150,60,100)',  opacity: 0.07 },
    // Mid area (behind avatar)
    { cx: 220, cy: 200, r: 140, color: 'rgb(60,30,20)',    opacity: 0.25 },
    // Right side subtle tones
    { cx: 700, cy: 80,  r: 80,  color: 'rgb(100,60,40)',   opacity: 0.05 },
    { cx: 950, cy: 340, r: 70,  color: 'rgb(180,100,80)',  opacity: 0.05 },
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// LEFT-SIDE FADE  (smooth transition from left atmosphere to right panel)
// ─────────────────────────────────────────────────────────────────────────────

function drawLeftFade(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
): void {
  const grad = ctx.createLinearGradient(PANEL_X - 60, 0, PANEL_X + 60, 0);
  grad.addColorStop(0.0, 'rgba(15,10,6,0.00)');
  grad.addColorStop(0.4, 'rgba(15,10,6,0.50)');
  grad.addColorStop(1.0, 'rgba(15,10,6,0.85)');

  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(PANEL_X - 80, 0, 140, height);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME TEXT
// ─────────────────────────────────────────────────────────────────────────────

function drawWelcomeText(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  data: WelcomeCardData,
): void {
  const greeting = data.customMessage ?? 'Welcome to the café,';

  let currentY = 115;

  // ── Greeting line  (small, muted) ────────────────────────────────────────
  drawText(ctx, {
    x: TEXT_X, y: currentY,
    text: greeting,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    fontFamily: 'body',
    color: COLORS.text.muted,
    alpha: 0.85,
    maxWidth: TEXT_MAX_W,
  });
  currentY += 48;

  // ── Username  (large, gradient) ───────────────────────────────────────────
  const displayFontSize = data.user.displayName.length > 14
    ? TYPOGRAPHY.sizes['3xl']
    : TYPOGRAPHY.sizes['4xl'];

  ctx.save();
  ctx.font         = font(TYPOGRAPHY.weights.extrabold, displayFontSize, 'display');
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign    = 'left';

  // Truncate name to fit panel
  let displayName = data.user.displayName;
  while (ctx.measureText(displayName).width > TEXT_MAX_W && displayName.length > 1) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName.length < data.user.displayName.length) displayName += '…';

  const nameGrad = ctx.createLinearGradient(TEXT_X, currentY - displayFontSize, TEXT_X + TEXT_MAX_W, currentY);
  for (const { offset, color } of GRADIENTS.heroName) {
    nameGrad.addColorStop(offset, color);
  }
  ctx.shadowBlur  = SHADOWS.textPink.blur;
  ctx.shadowColor = SHADOWS.textPink.color;
  ctx.fillStyle   = nameGrad;
  ctx.fillText(displayName, TEXT_X, currentY);
  ctx.shadowBlur  = 0;
  ctx.shadowColor = 'transparent';
  ctx.restore();

  currentY += 18;

  // ── Sakura divider line ────────────────────────────────────────────────────
  drawDividerLine(ctx, TEXT_X, currentY, TEXT_MAX_W, COLORS.brand.pink, 1.5);
  currentY += 28;

  // ── Server name ────────────────────────────────────────────────────────────
  drawText(ctx, {
    x: TEXT_X, y: currentY,
    text: data.guildName,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'display',
    color: COLORS.text.secondary,
    maxWidth: TEXT_MAX_W,
    alpha: 0.90,
  });
  currentY += 38;

  // ── Member count ───────────────────────────────────────────────────────────
  if (data.memberCount !== undefined) {
    drawText(ctx, {
      x: TEXT_X, y: currentY,
      text: formatMemberCount(data.memberCount),
      fontSize: TYPOGRAPHY.sizes.base,
      fontWeight: TYPOGRAPHY.weights.medium,
      fontFamily: 'body',
      color: COLORS.brand.gold,
      alpha: 0.80,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM ACCENT LINE
// ─────────────────────────────────────────────────────────────────────────────

function drawBottomLine(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
): void {
  const grad = ctx.createLinearGradient(0, height - 2, width, height - 2);
  grad.addColorStop(0.0, 'rgba(244,194,215,0.00)');
  grad.addColorStop(0.2, 'rgba(244,194,215,0.30)');
  grad.addColorStop(0.5, 'rgba(232,184,109,0.30)');
  grad.addColorStop(1.0, 'rgba(232,184,109,0.00)');

  ctx.save();
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, height - 1);
  ctx.lineTo(width, height - 1);
  ctx.stroke();
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: RENDER WELCOME CARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a 1024×400 welcome card PNG for a new guild member.
 * Returns a Buffer containing the raw PNG bytes, ready to attach to Discord.
 */
export async function renderWelcomeCard(data: WelcomeCardData): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext('2d');

  // ── Layer 1: Background gradient ────────────────────────────────────────
  drawCardBackground(ctx, width, height, GRADIENTS.welcomeBg);

  // ── Layer 2: Bokeh atmosphere ────────────────────────────────────────────
  drawAtmosphere(ctx);

  // ── Layer 3: Left atmospheric fade ──────────────────────────────────────
  drawLeftFade(ctx);

  // ── Layer 4: Vignettes ───────────────────────────────────────────────────
  drawTopSheen(ctx, width, 80);
  drawBottomVignette(ctx, width, height, height * 0.30);

  // ── Layer 5: Background sakura ───────────────────────────────────────────
  ctx.globalAlpha = 0.50;
  drawSakuraPetals(ctx, width, height, 'welcome', data.user.id);
  ctx.globalAlpha = 1.0;

  // ── Layer 6: Right glass panel ───────────────────────────────────────────
  drawGlassPanel(ctx, {
    x: PANEL_X, y: 20,
    width: PANEL_WIDTH, height: height - 40,
    radius: RADII['2xl'],
    direction: 'vertical',
    fillStops: GRADIENTS.glassDiagonal,
    borderColor: COLORS.border.subtle,
  });

  // ── Layer 7: Avatar ──────────────────────────────────────────────────────
  const avatar = await loadAvatar(
    data.user.avatarUrl,
    data.user.displayName,
    data.user.id,
    256,
  );

  drawDoubleRingAvatar(ctx, avatar, AVATAR_CX, AVATAR_CY, AVATAR_RADIUS);

  // ── Layer 8: Welcome text ────────────────────────────────────────────────
  drawWelcomeText(ctx, data);

  // ── Layer 9: Foreground sakura ───────────────────────────────────────────
  ctx.globalAlpha = 0.75;
  drawSakuraPetals(ctx, width, height, 'welcome', data.user.id + '_fg');
  ctx.globalAlpha = 1.0;

  // ── Layer 10: Bottom accent line ─────────────────────────────────────────
  drawBottomLine(ctx);

  // ── Layer 11: Watermark ──────────────────────────────────────────────────
  drawWatermark(ctx, width, height);

  return canvas.toBuffer('image/png');
}
