/**
 * Leaderboard Card Template — 820 × 640 px
 *
 * Renders up to 10 leaderboard entries in a styled table layout.
 *
 * Layout:
 *  HEADER  — Guild name + "Server Leaderboard" + page indicator
 *  ROWS    — Medal / rank number | Avatar | Name + level | XP bar | XP count
 *  FOOTER  — Page X / Y + Tensura watermark
 *
 * Layers:
 *  1. Background
 *  2. Vignettes
 *  3. Sakura petals
 *  4. Header glass panel
 *  5. Per-row entries (alternating subtle tint for readability)
 *  6. Footer
 *  7. Watermark
 */

import { createCanvas } from '@napi-rs/canvas';
import {
  CARD_SIZES, COLORS, GRADIENTS, RADII,
  TYPOGRAPHY, RANK_MEDALS, font,
} from '../tokens.js';
import type { LeaderboardCardData, LeaderboardEntry } from '../types.js';
import { loadAvatar } from '../primitives/avatar.js';
import {
  drawCardBackground, drawBottomVignette, drawTopSheen,
  drawGlassPanel, drawProgressBar, drawWatermark,
} from '../primitives/effects.js';
import { drawSakuraPetals } from '../primitives/sakura.js';
import { withCircleClip, roundedRect } from '../primitives/paths.js';
import { drawText, formatCompact } from '../primitives/text.js';

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const { width, height } = CARD_SIZES.leaderboard;

const PAD         = 24;
const HEADER_H    = 88;
const ROW_H       = 52;
const ROW_GAP     = 4;
const FOOTER_H    = 36;
const ROWS_START  = HEADER_H + PAD;

// Column X positions
const COL_RANK    = PAD;           // rank number / medal
const COL_AVATAR  = COL_RANK + 44;
const COL_NAME    = COL_AVATAR + 48;
const COL_BAR     = width - 260;
const COL_XP      = width - PAD;
const NAME_MAX_W  = COL_BAR - COL_NAME - 16;

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────

function drawHeader(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  guildName: string,
  page: number,
  totalPages: number,
): void {
  drawGlassPanel(ctx, {
    x: PAD, y: PAD,
    width: width - PAD * 2, height: HEADER_H - 8,
    radius: RADII.xl,
    direction: 'diagonal',
    borderColor: COLORS.border.medium,
  });

  // Trophy emoji + "LEADERBOARD"
  drawText(ctx, {
    x: PAD + 20, y: PAD + 28,
    text: '🏆 LEADERBOARD',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'body',
    color: COLORS.brand.gold,
    alpha: 0.80,
  });

  // Guild name
  drawText(ctx, {
    x: PAD + 20, y: PAD + 58,
    text: guildName,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    fontFamily: 'display',
    color: COLORS.text.primary,
    maxWidth: width - PAD * 2 - 120,
  });

  // Page indicator
  if (totalPages > 1) {
    drawText(ctx, {
      x: width - PAD - 20, y: PAD + 58,
      text: `Page ${page} / ${totalPages}`,
      fontSize: TYPOGRAPHY.sizes.xs,
      fontWeight: TYPOGRAPHY.weights.regular,
      fontFamily: 'body',
      color: COLORS.text.muted,
      align: 'right',
      alpha: 0.60,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RANK INDICATOR (medal or number)
// ─────────────────────────────────────────────────────────────────────────────

function drawRankIndicator(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  rank: number,
  rowCy: number,
): void {
  const medal = RANK_MEDALS[rank as 1 | 2 | 3];

  if (medal) {
    // Gold / Silver / Bronze gradient circle
    const circleR = 16;
    const grad = ctx.createLinearGradient(
      COL_RANK + 20, rowCy - circleR,
      COL_RANK + 20, rowCy + circleR,
    );
    for (const { offset, color } of medal.gradient) {
      grad.addColorStop(offset, color);
    }

    ctx.save();
    ctx.shadowBlur  = 10;
    ctx.shadowColor = medal.glow;
    ctx.beginPath();
    ctx.arc(COL_RANK + 20, rowCy, circleR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur  = 0;
    ctx.shadowColor = 'transparent';

    // Rank number inside circle
    ctx.font         = font(TYPOGRAPHY.weights.extrabold, 12, 'display');
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = 'rgba(20,10,4,0.85)';
    ctx.fillText(String(rank), COL_RANK + 20, rowCy + 1);
    ctx.restore();
  } else {
    // Plain muted rank number
    drawText(ctx, {
      x: COL_RANK + 20, y: rowCy + 5,
      text: String(rank),
      fontSize: TYPOGRAPHY.sizes.sm,
      fontWeight: TYPOGRAPHY.weights.semibold,
      fontFamily: 'body',
      color: COLORS.text.muted,
      align: 'center',
      baseline: 'middle',
      alpha: 0.65,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD ROW
// ─────────────────────────────────────────────────────────────────────────────

async function drawRow(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  entry: LeaderboardEntry,
  rowY: number,
  maxXp: number,
): Promise<void> {
  const rowCy = rowY + ROW_H / 2;

  // Row background
  const rowFill = entry.isHighlighted
    ? 'rgba(244,194,215,0.08)'
    : rowY % (ROW_H * 2 + ROW_GAP) < ROW_H + ROW_GAP
      ? 'rgba(255,255,255,0.022)'
      : 'rgba(255,255,255,0.012)';

  ctx.save();
  roundedRect(ctx, PAD, rowY, width - PAD * 2, ROW_H, RADII.md);
  ctx.fillStyle = rowFill;
  ctx.fill();

  // Highlighted row border
  if (entry.isHighlighted) {
    roundedRect(ctx, PAD, rowY, width - PAD * 2, ROW_H, RADII.md);
    ctx.strokeStyle = COLORS.border.medium;
    ctx.lineWidth   = 1;
    ctx.stroke();
  }
  ctx.restore();

  // Rank indicator
  drawRankIndicator(ctx, entry.rank, rowCy);

  // Avatar (small circle)
  const avatarR = 18;
  const avatar  = await loadAvatar(
    entry.user.avatarUrl,
    entry.user.displayName,
    entry.user.id,
    64,
  );

  withCircleClip(ctx, COL_AVATAR + avatarR, rowCy, avatarR, () => {
    ctx.drawImage(
      avatar,
      COL_AVATAR, rowCy - avatarR,
      avatarR * 2, avatarR * 2,
    );
  });

  // Avatar ring
  ctx.save();
  ctx.strokeStyle = entry.isHighlighted
    ? COLORS.border.strong
    : COLORS.border.subtle;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(COL_AVATAR + avatarR, rowCy, avatarR + 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Display name
  drawText(ctx, {
    x: COL_NAME, y: rowCy - 7,
    text: entry.user.displayName,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontFamily: 'display',
    color: entry.isHighlighted ? COLORS.text.primary : COLORS.text.secondary,
    baseline: 'alphabetic',
    maxWidth: NAME_MAX_W,
  });

  // Level tag
  drawText(ctx, {
    x: COL_NAME, y: rowCy + 12,
    text: `Level ${entry.level}`,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.regular,
    fontFamily: 'body',
    color: COLORS.text.muted,
    baseline: 'alphabetic',
    alpha: 0.70,
  });

  // Mini XP progress bar
  const progress = maxXp > 0 ? entry.totalXp / maxXp : 0;
  const barW = COL_XP - COL_BAR - 74;

  drawProgressBar(ctx, {
    x: COL_BAR, y: rowCy - 6,
    width: barW, height: 8,
    progress,
    showEndGlow: false,
    fillStops: entry.rank <= 3
      ? (RANK_MEDALS[entry.rank as 1 | 2 | 3]?.gradient ?? GRADIENTS.xpBar)
      : GRADIENTS.xpBar,
  });

  // XP count
  drawText(ctx, {
    x: COL_XP, y: rowCy + 5,
    text: formatCompact(entry.totalXp),
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    fontFamily: 'body',
    color: COLORS.brand.gold,
    align: 'right',
    baseline: 'middle',
    alpha: 0.85,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: RENDER LEADERBOARD CARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render an 820×640 leaderboard card PNG.
 * Returns a Buffer containing the raw PNG bytes.
 */
export async function renderLeaderboardCard(
  data: LeaderboardCardData,
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext('2d');

  // ── Background ──────────────────────────────────────────────────────────
  drawCardBackground(ctx, width, height, GRADIENTS.leaderboardBg);
  drawTopSheen(ctx, width, 50);
  drawBottomVignette(ctx, width, height, height * 0.20);

  // ── Sakura (background) ──────────────────────────────────────────────────
  ctx.globalAlpha = 0.45;
  drawSakuraPetals(ctx, width, height, 'leaderboard', data.guildName);
  ctx.globalAlpha = 1.0;

  // ── Header ───────────────────────────────────────────────────────────────
  drawHeader(ctx, data.guildName, data.page, data.totalPages);

  // Compute maxXp for relative progress bars
  const maxXp = Math.max(...data.entries.map((e) => e.totalXp), 1);

  // ── Rows ─────────────────────────────────────────────────────────────────
  const maxRows = Math.min(data.entries.length, 10);
  for (let i = 0; i < maxRows; i++) {
    const entry = data.entries[i]!;
    const rowY  = ROWS_START + i * (ROW_H + ROW_GAP);
    await drawRow(ctx, entry, rowY, maxXp);
  }

  // ── Sakura (foreground) ──────────────────────────────────────────────────
  ctx.globalAlpha = 0.60;
  drawSakuraPetals(ctx, width, height, 'leaderboard', data.guildName + '_fg');
  ctx.globalAlpha = 1.0;

  // ── Footer divider ───────────────────────────────────────────────────────
  const footerY = height - FOOTER_H;
  const footGrad = ctx.createLinearGradient(PAD, footerY, width - PAD, footerY);
  footGrad.addColorStop(0.0, 'rgba(244,194,215,0.00)');
  footGrad.addColorStop(0.3, 'rgba(244,194,215,0.15)');
  footGrad.addColorStop(0.7, 'rgba(232,184,109,0.15)');
  footGrad.addColorStop(1.0, 'rgba(232,184,109,0.00)');
  ctx.save();
  ctx.strokeStyle = footGrad;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, footerY);
  ctx.lineTo(width - PAD, footerY);
  ctx.stroke();
  ctx.restore();

  // ── Watermark ────────────────────────────────────────────────────────────
  drawWatermark(ctx, width, height);

  return canvas.toBuffer('image/png');
}
