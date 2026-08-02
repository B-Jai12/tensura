/**
 * XP Formula — pure functions, no I/O, fully testable in isolation.
 *
 * Formula (industry-standard "Mee6-style" progression):
 *   xpToReachLevel(n) = 5n² + 50n + 100
 *   xpToNextLevel(currentLevel) = xpToReachLevel(currentLevel + 1)
 *
 * This gives a gentle early progression that steepens at higher levels:
 *   Level 1 → 2:  155 XP
 *   Level 5 → 6:  475 XP
 *   Level 10→ 11: 1,050 XP
 *   Level 25→ 26: 4,050 XP
 *   Level 50→ 51: 13,100 XP
 *
 * XP per message: random integer in [MIN_XP_PER_MSG, MAX_XP_PER_MSG].
 * Cooldown: XP_COOLDOWN_SECONDS — no XP granted within this window per user.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TUNING CONSTANTS
// These are the only knobs to turn if XP progression needs adjusting.
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_LEVEL            = 500; // hard cap (prevents overflow)

export function getMinXpPerMsg(): number {
  if (process.env.XP_MIN) {
    const val = parseInt(process.env.XP_MIN, 10);
    if (!isNaN(val)) return val;
  }
  return 25;
}

export function getMaxXpPerMsg(): number {
  if (process.env.XP_MAX) {
    const val = parseInt(process.env.XP_MAX, 10);
    if (!isNaN(val)) return val;
  }
  return 40;
}

export function getXpCooldownSeconds(): number {
  if (process.env.XP_COOLDOWN_SECONDS) {
    const val = parseInt(process.env.XP_COOLDOWN_SECONDS, 10);
    if (!isNaN(val)) return val;
  }
  return process.env.NODE_ENV === "production" ? 60 : 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMULA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * XP required to pass FROM the given level to the next.
 * (This is the progress bar's denominator at `currentLevel`.)
 */
export function xpToNextLevel(currentLevel: number): number {
  const n = currentLevel + 1;
  return 5 * n * n + 50 * n + 100;
}

/**
 * Total cumulative XP needed to reach `targetLevel` from level 0.
 * Derived from the summation of 5n² + 50n + 100.
 */
export function totalXpForLevel(targetLevel: number): number {
  if (targetLevel <= 0) return 0;
  return Math.floor((targetLevel * (10 * targetLevel * targetLevel + 165 * targetLevel + 755)) / 6);
}

/**
 * Given a life-time `totalXp` value, compute the corresponding level and
 * the XP progress within that level.
 *
 * Returns:
 *  - `level`      — the highest level fully achieved
 *  - `currentXp`  — XP accumulated within this level (< xpToNextLevel(level))
 *  - `requiredXp` — XP needed to complete this level
 */
export function decomposeXp(totalXp: number): {
  level: number;
  currentXp: number;
  requiredXp: number;
} {
  if (totalXp <= 0) {
    return { level: 0, currentXp: 0, requiredXp: xpToNextLevel(0) };
  }

  // Binary search for level to achieve O(1) lookup (max 9 steps for MAX_LEVEL=500)
  let low = 0;
  let high = MAX_LEVEL;
  let level = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (totalXpForLevel(mid) <= totalXp) {
      level = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const baseXp = totalXpForLevel(level);
  const remaining = totalXp - baseXp;

  return {
    level,
    currentXp:  remaining,
    requiredXp: xpToNextLevel(level),
  };
}

/**
 * Generate a random XP grant in the configured range.
 * Kept as a pure function for testability (callers can mock Math.random).
 */
export function randomXpGrant(): number {
  const min = getMinXpPerMsg();
  const max = getMaxXpPerMsg();
  return Math.floor(
    Math.random() * (max - min + 1) + min,
  );
}
