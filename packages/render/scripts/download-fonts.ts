/**
 * Font Download Script — @tensura/render
 *
 * Downloads Inter and Outfit font files (WOFF2 format) from the Google
 * Fonts CDN and saves them to `assets/fonts/` so the render package
 * can operate fully offline after this one-time setup.
 *
 * Usage:
 *   pnpm --filter @tensura/render fonts:download
 *
 * Font files are intentionally git-ignored (binary blobs). This script
 * is the canonical way to populate them in a fresh checkout or Docker build.
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.resolve(__dirname, '../assets/fonts');

// ─────────────────────────────────────────────────────────────────────────────
// FONT MANIFEST
// Direct WOFF2 URLs from Google Fonts static CDN.
// These are stable URLs for specific font versions — update deliberately.
// ─────────────────────────────────────────────────────────────────────────────

const FONTS = [
  // ── Inter ──────────────────────────────────────────────────────────────
  {
    localName: 'inter-400.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJlN.woff2',
  },
  {
    localName: 'inter-500.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJlN.woff2',
  },
  {
    localName: 'inter-600.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJlN.woff2',
  },
  {
    localName: 'inter-700.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJlN.woff2',
  },

  // ── Outfit ────────────────────────────────────────────────────────────
  {
    localName: 'outfit-400.woff2',
    url: 'https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1C4G-EiAou6Y.woff2',
  },
  {
    localName: 'outfit-500.woff2',
    url: 'https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1B4G-EiAou6Y.woff2',
  },
  {
    localName: 'outfit-600.woff2',
    url: 'https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC164O-EiAou6Y.woff2',
  },
  {
    localName: 'outfit-700.woff2',
    url: 'https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1y4O-EiAou6Y.woff2',
  },
  {
    localName: 'outfit-800.woff2',
    url: 'https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1o4O-EiAou6Y.woff2',
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD LOGIC
// ─────────────────────────────────────────────────────────────────────────────

async function downloadFont(url: string, dest: string): Promise<void> {
  if (existsSync(dest)) {
    console.log(`  ✓  [skip] ${path.basename(dest)} (already exists)`);
    return;
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Tensura Font Setup Script/1.0' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} downloading ${url}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  writeFileSync(dest, Buffer.from(arrayBuffer));
  console.log(`  ↓  [done] ${path.basename(dest)} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);
}

async function main(): Promise<void> {
  console.log('\n🌸 Tensura — Font Setup\n');
  console.log(`Target directory: ${FONTS_DIR}\n`);

  if (!existsSync(FONTS_DIR)) {
    mkdirSync(FONTS_DIR, { recursive: true });
    console.log('Created assets/fonts/ directory\n');
  }

  let success = 0;
  let failed  = 0;

  for (const { localName, url } of FONTS) {
    const dest = path.join(FONTS_DIR, localName);
    try {
      await downloadFont(url, dest);
      success++;
    } catch (err) {
      console.error(`  ✗  [fail] ${localName}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n──────────────────────────────────────`);
  console.log(`Downloaded: ${success}  |  Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠  Some fonts failed to download.');
    console.log('   The render package will fall back to @fontsource npm files or system fonts.');
    console.log('   Re-run `pnpm --filter @tensura/render fonts:download` to retry.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All fonts downloaded. The renderer is ready.\n');
  }
}

main().catch((err) => {
  console.error('\nFatal:', err);
  process.exit(1);
});
