/**
 * Font registration for @tensura/render.
 *
 * Strategy (in priority order):
 *  1. Load from `assets/fonts/` (pre-downloaded TTF files for production use).
 *  2. Load from @fontsource npm packages (available after `pnpm install`).
 *  3. Fall back to system fonts via GlobalFonts.loadSystemFonts().
 *
 * Call `initFonts()` once at process start (from `initializeRenderer()`).
 * The function is idempotent — subsequent calls are no-ops.
 */

import { GlobalFonts } from '@napi-rs/canvas';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const _require = createRequire(import.meta.url);

/** Absolute path to the `assets/fonts/` directory in this package. */
const FONTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../assets/fonts',
);

let _initialized = false;

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Try to load a font file from a local path; return true on success. */
function tryRegister(filePath: string, family: string): boolean {
  if (!existsSync(filePath)) return false;
  try {
    GlobalFonts.registerFromPath(filePath, family);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a font file path from a @fontsource npm package.
 * @fontsource packages ship font files in `<package>/files/<name>`.
 * We prefer WOFF2 → WOFF → OTF in that order, as @napi-rs/canvas (Skia)
 * supports all three formats.
 */
function resolveFontsourceFont(pkg: string, fileName: string): string {
  try {
    const pkgJsonPath = _require.resolve(`${pkg}/package.json`);
    const pkgDir = path.dirname(pkgJsonPath);
    return path.join(pkgDir, 'files', fileName);
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FONT MANIFEST
// Maps: { family, weight, style } → list of candidate paths (first hit wins).
// ─────────────────────────────────────────────────────────────────────────────

interface FontEntry {
  family: string;
  localFile: string;       // relative to FONTS_DIR
  fontsourcePkg: string;
  fontsourceFile: string;  // relative to pkg/files/
}

const FONT_MANIFEST: FontEntry[] = [
  // ── Inter ─────────────────────────────────────────────────────────────────
  {
    family: 'Inter',
    localFile: 'inter-400.woff2',
    fontsourcePkg: '@fontsource/inter',
    fontsourceFile: 'inter-latin-400-normal.woff2',
  },
  {
    family: 'Inter',
    localFile: 'inter-500.woff2',
    fontsourcePkg: '@fontsource/inter',
    fontsourceFile: 'inter-latin-500-normal.woff2',
  },
  {
    family: 'Inter',
    localFile: 'inter-600.woff2',
    fontsourcePkg: '@fontsource/inter',
    fontsourceFile: 'inter-latin-600-normal.woff2',
  },
  {
    family: 'Inter',
    localFile: 'inter-700.woff2',
    fontsourcePkg: '@fontsource/inter',
    fontsourceFile: 'inter-latin-700-normal.woff2',
  },

  // ── Outfit ────────────────────────────────────────────────────────────────
  {
    family: 'Outfit',
    localFile: 'outfit-400.woff2',
    fontsourcePkg: '@fontsource/outfit',
    fontsourceFile: 'outfit-latin-400-normal.woff2',
  },
  {
    family: 'Outfit',
    localFile: 'outfit-500.woff2',
    fontsourcePkg: '@fontsource/outfit',
    fontsourceFile: 'outfit-latin-500-normal.woff2',
  },
  {
    family: 'Outfit',
    localFile: 'outfit-600.woff2',
    fontsourcePkg: '@fontsource/outfit',
    fontsourceFile: 'outfit-latin-600-normal.woff2',
  },
  {
    family: 'Outfit',
    localFile: 'outfit-700.woff2',
    fontsourcePkg: '@fontsource/outfit',
    fontsourceFile: 'outfit-latin-700-normal.woff2',
  },
  {
    family: 'Outfit',
    localFile: 'outfit-800.woff2',
    fontsourcePkg: '@fontsource/outfit',
    fontsourceFile: 'outfit-latin-800-normal.woff2',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export interface FontInitResult {
  loaded: string[];
  fallback: boolean;
}

/**
 * Register all Tensura brand fonts with @napi-rs/canvas's Skia font manager.
 * Must be called before the first call to any renderXxx() function.
 */
export function initFonts(): FontInitResult {
  if (_initialized) return { loaded: [], fallback: false };
  _initialized = true;

  const loaded: string[] = [];
  let anyLoaded = false;

  for (const entry of FONT_MANIFEST) {
    // Priority 1: pre-downloaded local file
    const localPath = path.join(FONTS_DIR, entry.localFile);
    if (tryRegister(localPath, entry.family)) {
      loaded.push(`[local] ${entry.family} (${entry.localFile})`);
      anyLoaded = true;
      continue;
    }

    // Priority 2: @fontsource npm package files
    const fontsourcePath = resolveFontsourceFont(
      entry.fontsourcePkg,
      entry.fontsourceFile,
    );
    if (fontsourcePath && tryRegister(fontsourcePath, entry.family)) {
      loaded.push(`[fontsource] ${entry.family} (${entry.fontsourceFile})`);
      anyLoaded = true;
      continue;
    }

    // Could not load this weight — canvas will fall back to system font
  }

  // Priority 3: always load system fonts so the fallback stack works
  try {
    (GlobalFonts as any).loadSystemFonts();
  } catch {
    // Non-fatal — some sandboxed environments block this
  }

  return { loaded, fallback: !anyLoaded };
}

/** Returns true if initFonts() has already been called. */
export function fontsReady(): boolean {
  return _initialized;
}
