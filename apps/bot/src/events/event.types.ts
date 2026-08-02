import type { ClientEvents } from "discord.js";
import type { BotContext } from "../context.js";

export interface EventDefinition<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (ctx: BotContext, ...args: ClientEvents[K]) => Promise<void>;
}
