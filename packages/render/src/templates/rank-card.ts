/**
 * Rank Card Template — 900 × 280 px  (Premium Redesign v2)
 *
 * Layout (left → right):
 *  [28px pad] [Avatar 140px Ø] [28px gap] [Name / Username·LVL / XP bar] [Rank chip]
 *
 * Background layers (back → front):
 *  1. Deep espresso gradient (level-themed)
 *  2. Warm radial glow behind avatar area
 *  3. Very soft bokeh atmosphere circles
 *  4. Floating glass card panel (rgba 4%, 24px radius)
 *  5. Bottom dark vignette
 *  6. Avatar (slim 2px ring + soft glow)
 *  7. Display name (pure white, 40px/700)
 *  8. Username · LVL row (single line, 22px/400 + 18px/600)
 *  9. XP progress bar (8px) + labels
 * 10. Rank chip (frosted glass, top-right)
 * 11. Corner sakura petals (very faint, corners only)
 * 12. Bottom accent line
 * 13. Watermark
 */

import { createCanvas } from '@napi-rs/canvas';
import {
  CARD_SIZES, COLORS, SHADOWS, TYPOGRAPHY, font, getLevelTheme,
} from '../tokens.js';
import type { RankCardData } from '../types.js';
import { drawCircularAvatar, loadAvatar } from '../primitives/avatar.js';
import {
  drawCardBackground, drawBottomVignette,
  drawGlassPanel, drawWatermark,
  drawBokehCircles, linearGradient,
  applyShadow, clearShadow,
} from '../primitives/effects.js';
import { drawSakuraPetals } from '../primitives/sakura.js';
import {
  drawText, formatXp, formatRank, truncate,
} from '../primitives/text.js';
import { roundedRect, pillPath } from '../primitives/paths.js';

// =============================================================================
// LAYOUT CONSTANTS
// =============================================================================

const { width, height } = CARD_SIZES.rank;

// Avatar — 140px diameter, vertically centered
const AVATAR_RADIUS = 70;
const AVATAR_CX     = 28 + AVATAR_RADIUS; // 98
const AVATAR_CY     = height / 2;          // 140

// Content area: right of avatar
const CONTENT_X = AVATAR_CX + AVATAR_RADIUS + 28; // 196

// Rank chip — top-right corner
const CHIP_W  = 124;
const CHIP_H  = 104;
const CHIP_X  = width - 28 - CHIP_W;    // 748
const CHIP_Y  = 24;
const CHIP_CX = CHIP_X + CHIP_W / 2;   // 810

// Content right boundary — gap before chip
const CONTENT_RIGHT = CHIP_X - 16; // 732
const CONTENT_W     = CONTENT_RIGHT - CONTENT_X; // 536

// Vertical rhythm
const NAME_Y  = 94;                    // display name baseline (40px font)
const META_Y  = 128;                   // username·LVL baseline (22px font)
const BAR_Y   = 174;                   // XP bar top
const BAR_H   = 8;                     // slim bar height
const LABEL_Y = BAR_Y + BAR_H + 18;   // labels baseline

// =============================================================================
// BACKGROUND ATMOSPHERE
// =============================================================================

function drawAtmosphere(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  avatarGlowColor: string,
): void {
  // Large warm radial glow behind avatar — a soft light source from left
  const glowGrad = ctx.createRadialGradient(
    AVATAR_CX - 10, AVATAR_CY - 10, 0,
    AVATAR_CX - 10, AVATAR_CY - 10, 250,
  );
  const midColor  = avatarGlowColor.replace(/[\d.]+\)$/, '0.07)');
  const edgeColor = 'rgba(0,0,0,0)';
  glowGrad.addColorStop(0.0, avatarGlowColor);
  glowGrad.addColorStop(0.45, midColor);
  glowGrad.addColorStop(1.0, edgeColor);

  ctx.save();
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Very subtle bokeh dots — café ambience
  drawBokehCircles(ctx, [
    { cx: 820, cy: 55,  r: 90,  color: 'rgb(244,194,215)', opacity: 0.04 },
    { cx: 700, cy: 240, r: 65,  color: 'rgb(232,184,109)', opacity: 0.03 },
    { cx: 50,  cy: 235, r: 110, color: 'rgb(244,194,215)', opacity: 0.03 },
  ]);
}

// =============================================================================
// RANK CHIP  (frosted glass, top-right)
// =============================================================================

function drawRankChip(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  rank: number,
  rankGradient: readonly { offset: number; color: string }[],
): void {
  const r = 14;

  ctx.save();

  // Frosted background
  roundedRect(ctx, CHIP_X, CHIP_Y, CHIP_W, CHIP_H, r);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fill();

  // Inner top sheen
  const sheenGrad = linearGradient(
    ctx, CHIP_X, CHIP_Y, CHIP_X, CHIP_Y + CHIP_H * 0.5, [
      { offset: 0.0, color: 'rgba(255,255,255,0.09)' },
      { offset: 1.0, color: 'rgba(255,255,255,0.00)' },
    ],
  );
  roundedRect(ctx, CHIP_X, CHIP_Y, CHIP_W, CHIP_H, r);
  ctx.fillStyle = sheenGrad;
  ctx.fill();

  // Chip border highlight
  roundedRect(ctx, CHIP_X, CHIP_Y, CHIP_W, CHIP_H, r);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // "RANK" label — 11px/600 uppercase muted
  drawText(ctx, {
    x:          CHIP_CX,
    y:          CHIP_Y + 24,
    text:       'RANK',
    fontSize:   11,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'body',
    color:      COLORS.text.muted,
    align:      'center',
    baseline:   'alphabetic',
    alpha:      0.65,
  });

  // Rank number — gradient, size adapts to digit count
  const rankStr  = formatRank(rank);
  const fontSize = rank >= 1000 ? 40 : rank >= 100 ? 48 : 58;

  ctx.font         = font(TYPOGRAPHY.weights.extrabold, fontSize, 'display');
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';

  const textMetrics = ctx.measureText(rankStr);
  const gx  = CHIP_CX - textMetrics.width / 2;
  const gy  = CHIP_Y + CHIP_H - 16;

  applyShadow(ctx, SHADOWS.rankNumber);
  const grad = ctx.createLinearGradient(gx, gy - fontSize, gx, gy);
  for (const { offset, color } of rankGradient) {
    grad.addColorStop(offset, color);
  }
  ctx.fillStyle = grad;
  ctx.fillText(rankStr, CHIP_CX, gy);
  clearShadow(ctx);

  ctx.restore();
}

// =============================================================================
// USER INFO  (name + username·LVL on one line)
// =============================================================================

function drawUserInfo(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  data: RankCardData,
): void {
  // Display name — pure white, 40px/700, no gradient
  ctx.save();
  ctx.font         = font(TYPOGRAPHY.weights.bold, 40, 'display');
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign    = 'left';
  ctx.fillStyle    = 'rgba(255,255,255,0.96)';

  const displayName = truncate(ctx, data.user.displayName, CONTENT_W - 8);
  ctx.fillText(displayName, CONTENT_X, NAME_Y);
  ctx.restore();

  // Meta row: @username · LVL N
  const usernameText = `@${data.user.username}`;
  const dot          = '  ·  ';
  const lvlText      = `LVL ${data.level}`;

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign    = 'left';

  // @username — 22px/400 muted
  ctx.font      = font(TYPOGRAPHY.weights.regular, 22, 'body');
  ctx.fillStyle = COLORS.text.muted;
  const usernameW = ctx.measureText(usernameText).width;
  ctx.fillText(usernameText, CONTENT_X, META_Y);

  // dot separator — extra muted
  ctx.globalAlpha = 0.45;
  const dotW = ctx.measureText(dot).width;
  ctx.fillText(dot, CONTENT_X + usernameW, META_Y);
  ctx.globalAlpha = 1.0;

  // LVL N — 18px/600 brand pink
  ctx.font      = font(TYPOGRAPHY.weights.semibold, 18, 'body');
  ctx.fillStyle = COLORS.brand.pink;
  ctx.fillText(lvlText, CONTENT_X + usernameW + dotW, META_Y);

  ctx.restore();
}

// =============================================================================
// XP BAR + LABELS
// =============================================================================

function drawXpSection(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  data: RankCardData,
  xpBarGradient: readonly { offset: number; color: string }[],
): void {
  const barX      = CONTENT_X;
  const barWidth  = CONTENT_W;
  const progress  = data.requiredXp > 0
    ? Math.max(0, Math.min(1, data.currentXp / data.requiredXp))
    : 0;
  const fillWidth = Math.max(BAR_H, barWidth * progress);

  ctx.save();

  // Track
  pillPath(ctx, barX, BAR_Y, barWidth, BAR_H);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  if (progress > 0) {
    // Gradient fill
    const fillGrad = linearGradient(ctx, barX, BAR_Y, barX + barWidth, BAR_Y, xpBarGradient);
    pillPath(ctx, barX, BAR_Y, fillWidth, BAR_H);
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Top micro-sheen
    const sheenGrad = linearGradient(ctx, barX, BAR_Y, barX, BAR_Y + BAR_H, [
      { offset: 0.0, color: 'rgba(255,255,255,0.22)' },
      { offset: 1.0, color: 'rgba(255,255,255,0.00)' },
    ]);
    pillPath(ctx, barX, BAR_Y, fillWidth, BAR_H);
    ctx.fillStyle = sheenGrad;
    ctx.fill();

    // Soft end glow (6px blur, opacity 0.25)
    const halfBar = BAR_H / 2;
    if (fillWidth < barWidth - halfBar) {
      ctx.save();
      ctx.shadowBlur  = 6;
      ctx.shadowColor = 'rgba(246,198,217,0.25)';
      ctx.beginPath();
      ctx.arc(barX + fillWidth, BAR_Y + halfBar, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.80)';
      ctx.fill();
      ctx.shadowBlur  = 0;
      ctx.shadowColor = 'transparent';
      ctx.restore();
    }
  }

  ctx.restore();

  // Left label: "125 / 155 XP" — 13px/500
  drawText(ctx, {
    x:          barX,
    y:          LABEL_Y,
    text:       `${formatXp(data.currentXp)} / ${formatXp(data.requiredXp)} XP`,
    fontSize:   13,
    fontWeight: TYPOGRAPHY.weights.medium,
    fontFamily: 'body',
    color:      COLORS.text.muted,
    alpha:      0.70,
  });

  // Right label: "Level N → N+1" — 13px/500
  drawText(ctx, {
    x:          barX + barWidth,
    y:          LABEL_Y,
    text:       `Level ${data.level} \u2192 ${data.level + 1}`,
    fontSize:   13,
    fontWeight: TYPOGRAPHY.weights.medium,
    fontFamily: 'body',
    color:      COLORS.text.disabled,
    align:      'right',
    alpha:      0.55,
  });
}

// =============================================================================
// BOTTOM ACCENT LINE
// =============================================================================

function drawBottomAccentLine(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  accentColor: string,
): void {
  const y = height - 2;
  // Extract base color channel for a matched tint
  const grad = ctx.createLinearGradient(0, y, width, y);
  grad.addColorStop(0.00, 'rgba(0,0,0,0)');
  grad.addColorStop(0.25, accentColor.replace(/[\d.]+\)$/, '0.22)'));
  grad.addColorStop(0.75, accentColor.replace(/[\d.]+\)$/, '0.16)'));
  grad.addColorStop(1.00, 'rgba(0,0,0,0)');

  ctx.save();
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(36, y);
  ctx.lineTo(width - 36, y);
  ctx.stroke();
  ctx.restore();
}

// =============================================================================
// PUBLIC: renderRankCard
// =============================================================================

/**
 * Render a 900×280 premium rank card PNG.
 * Returns a Buffer ready to attach to a Discord message.
 *
 * The card's visual theme evolves with the user's level:
 *  🌸 Lv  0–19 → Sakura       (pink/gold warmth — the beginning)
 *  🌙 Lv 20–39 → Night Café   (moonlit indigo)
 *  🌌 Lv 40–59 → Aurora       (teal/emerald northern lights)
 *  👑 Lv 60–79 → Royal Palace (violet & imperial gold)
 *  🔥 Lv 80+   → Legendary    (crimson & ember)
 */
export async function renderRankCard(data: RankCardData): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext('2d');

  // Select the visual theme driven by the user's level
  const theme = getLevelTheme(data.level);

  // ── 1. Background gradient (level-themed) ─────────────────────────────────
  drawCardBackground(ctx, width, height, theme.bgGradient);

  // ── 2. Warm radial glow + bokeh atmosphere ────────────────────────────────
  drawAtmosphere(ctx, theme.avatarGlowColor);

  // ── 3. Corner sakura petals (very faint — decorative only) ───────────────
  ctx.globalAlpha = 0.40;
  drawSakuraPetals(ctx, width, height, 'rank', data.user.id);
  ctx.globalAlpha = 1.0;

  // ── 4. Floating glass panel ───────────────────────────────────────────────
  drawGlassPanel(ctx, {
    x:           12,
    y:           12,
    width:       width - 24,
    height:      height - 24,
    radius:      24,
    direction:   'diagonal',
    fillStops: [
      { offset: 0.0, color: 'rgba(255,255,255,0.04)' },
      { offset: 1.0, color: 'rgba(255,255,255,0.015)' },
    ],
    borderColor: theme.glassBorder,
    borderWidth: 1,
  });

  // ── 5. Bottom vignette ────────────────────────────────────────────────────
  drawBottomVignette(ctx, width, height, height * 0.36);

  // ── 6. Avatar ─────────────────────────────────────────────────────────────
  const avatar = await loadAvatar(
    data.user.avatarUrl,
    data.user.displayName,
    data.user.id,
    200,
  );

  drawCircularAvatar(ctx, avatar, {
    cx:           AVATAR_CX,
    cy:           AVATAR_CY,
    radius:       AVATAR_RADIUS,
    // Slightly more saturated glow than the background radial
    glowColor:    theme.avatarGlowColor.replace(/[\d.]+\)$/, '0.35)'),
    drawRing:     true,
    ringWidth:    2,
    ringGradient: theme.ringGradient,
    drawGlow:     true,
  });

  // ── 7–8. User info ────────────────────────────────────────────────────────
  drawUserInfo(ctx, data);

  // ── 9. XP bar + labels ───────────────────────────────────────────────────
  drawXpSection(ctx, data, theme.xpBarGradient);

  // ── 10. Rank chip ─────────────────────────────────────────────────────────
  drawRankChip(ctx, data.rank, theme.rankGradient);

  // ── 11. Bottom accent line ────────────────────────────────────────────────
  drawBottomAccentLine(ctx, theme.avatarGlowColor);

  // ── 12. Watermark ─────────────────────────────────────────────────────────
  drawWatermark(ctx, width, height);

  return canvas.toBuffer('image/png');
}
