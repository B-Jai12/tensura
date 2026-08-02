/**
 * @tensura/design-system — Typography Scale
 */

export const TYPOGRAPHY = {
  families: {
    display:  'Outfit',   // headings, large numbers, level badges, display text
    body:     'Inter',    // labels, descriptions, counts, fine print
    fallback: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif',
  },

  weights: {
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  } as const,

  // Pixel sizes used across all card types
  sizes: {
    micro:    10,
    xs:       11,
    sm:       13,
    base:     15,
    md:       17,
    lg:       20,
    xl:       24,
    '2xl':    30,
    '3xl':    38,
    '4xl':    48,
    '5xl':    60,
    display:  80,
  } as const,

  // Letter-spacing hints (em units, converted to px at render time)
  tracking: {
    tight:   -0.02,
    normal:  0,
    wide:    0.04,
    wider:   0.08,
    widest:  0.15,
  } as const,
} as const;

/**
 * Build a CSS-style font string for canvas `ctx.font`.
 * e.g. font(800, 48, 'display') → "800 48px Outfit, system-ui..."
 */
export function font(
  weight: number,
  size: number,
  family: 'display' | 'body' = 'body',
): string {
  const familyName = TYPOGRAPHY.families[family];
  return `${weight} ${size}px ${familyName}, ${TYPOGRAPHY.families.fallback}`;
}
