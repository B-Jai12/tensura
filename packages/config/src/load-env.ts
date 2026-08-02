import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function findAndLoadEnv() {
  let currentDir = process.cwd();
  try {
    const filename = fileURLToPath(import.meta.url);
    currentDir = path.dirname(filename);
  } catch {
    // fallback to CWD
  }

  const root = path.parse(currentDir).root;
  while (currentDir && currentDir !== root) {
    const envPath = path.join(currentDir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback to process.cwd() dot env config
  dotenv.config();
}

findAndLoadEnv();

import { envSchema, type Env } from "./env.schema.js";

let cachedEnv: Env | undefined;

/**
 * Validates process.env against the shared schema exactly once per process
 * and caches the result. Throws immediately with a human-readable summary
 * if anything required is missing or malformed — we never want a module
 * to discover a bad config value halfway through a Discord interaction.
 */
export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    // eslint-disable-next-line no-console
    console.error(`\n[config] Invalid environment configuration:\n${issues}\n`);
    process.exit(1);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
