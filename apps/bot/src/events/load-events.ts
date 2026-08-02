import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { BotContext } from "../context.js";
import type { EventDefinition } from "./event.types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface BoundEvent {
  name: string;
  handler: (...args: any[]) => void;
}

export async function loadEvents(ctx: BotContext): Promise<() => void> {
  const files = (await readdir(__dirname)).filter(
    (f) => (f.endsWith(".event.js") || f.endsWith(".event.ts")) && f !== "event.types.ts",
  );

  const bound: BoundEvent[] = [];

  for (const file of files) {
    const filePath = path.join(__dirname, file);
    const imported = (await import(pathToFileURL(filePath).href)) as { default?: EventDefinition };

    if (!imported.default) {
      ctx.logger.warn({ file }, "Event file has no default export — skipped");
      continue;
    }

    const event = imported.default;
    const handler = (...args: unknown[]) => {
      event.execute(ctx, ...(args as never)).catch((err) => {
        ctx.logger.error({ err, event: event.name }, "Unhandled error in event handler");
      });
    };

    if (event.once) {
      ctx.client.once(event.name, handler);
    } else {
      ctx.client.on(event.name, handler);
    }

    bound.push({ name: event.name, handler });
    ctx.logger.debug({ event: event.name }, "Bound event");
  }

  return () => {
    for (const { name, handler } of bound) {
      ctx.client.off(name, handler);
    }
  };
}
