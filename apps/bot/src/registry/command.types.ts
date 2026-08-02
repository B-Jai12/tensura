import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type { BotContext } from "../context.js";

export type CommandBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

/** Which per-guild module toggle gates this command (matches GuildModuleToggles keys). */
export type CommandModule =
  | "core"
  | "xp"
  | "moderation"
  | "automod"
  | "tickets"
  | "economy"
  | "dailyRewards"
  | "achievements"
  | "inventory"
  | "shop"
  | "pets"
  | "minigames"
  | "anime"
  | "events"
  | "birthdays"
  | "polls"
  | "analytics"
  | "logging"
  | "reputation"
  | "seasonal"
  | "aiAssistant";

export interface CommandDefinition {
  data: CommandBuilder;
  /** Which module this belongs to — "core" commands (like /ping) always run. */
  module: CommandModule;
  /** Seconds between uses, per user per guild. 0 disables the cooldown. */
  cooldownSeconds?: number;
  execute: (interaction: ChatInputCommandInteraction, ctx: BotContext) => Promise<void>;
}
