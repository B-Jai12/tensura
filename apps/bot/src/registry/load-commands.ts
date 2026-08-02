import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Logger } from "@tensura/logger";
import type { CommandDefinition } from "./command.types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_ROOT = path.join(__dirname, "..", "commands");

/**
 * Walks apps/bot/src/commands/<module>/*.command.ts and imports each as
 * a CommandDefinition. New commands are discovered automatically —
 * dropping a `*.command.ts` file in a module folder is enough, no
 * manual registration array to maintain.
 */
export async function loadCommands(logger: Logger): Promise<Map<string, CommandDefinition>> {
  const commands = new Map<string, CommandDefinition>();
  const moduleDirs = await readdir(COMMANDS_ROOT, { withFileTypes: true });

  for (const dir of moduleDirs) {
    if (!dir.isDirectory()) continue;

    const moduleDir = path.join(COMMANDS_ROOT, dir.name);
    const files = (await readdir(moduleDir)).filter((f) => f.endsWith(".command.js") || f.endsWith(".command.ts"));

    for (const file of files) {
      const modulePath = path.join(moduleDir, file);
      const imported = (await import(pathToFileURL(modulePath).href)) as { default?: CommandDefinition };

      if (!imported.default) {
        logger.warn({ file: modulePath }, "Command file has no default export — skipped");
        continue;
      }

      const command = imported.default;
      const name = command.data.name;

      if (commands.has(name)) {
        throw new Error(`Duplicate command name "${name}" found in ${modulePath}`);
      }

      commands.set(name, command);
      logger.debug({ command: name, module: command.module }, "Loaded command");
    }
  }

  logger.info({ count: commands.size }, "Commands loaded");
  return commands;
}
