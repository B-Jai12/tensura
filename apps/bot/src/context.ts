import type { Client } from "discord.js";
import type { Redis } from "ioredis";
import type { Logger } from "@tensura/logger";
import type { Env } from "@tensura/config";
import type { CommandDefinition } from "./registry/command.types.js";

/**
 * Everything a handler needs, bundled once at bootstrap and threaded
 * through every event/command/component call. No handler should ever
 * reach for a module-level singleton directly — it all comes through
 * this context, which keeps the whole handler layer testable.
 */
export interface BotContext {
  client: Client;
  redis: Redis;
  logger: Logger;
  env: Env;
  commands: Map<string, CommandDefinition>;
}
