/**
 * Keys mirror the module map in TENSURA_ARCHITECTURE.md §5. This is the
 * shape stored in GuildConfig.modules (Json). Kept as a plain interface
 * (not a Zod schema) here to avoid a runtime dependency in packages/types;
 * the Zod validator for this shape lives in packages/config alongside
 * the module that owns writes to it.
 */
export interface GuildModuleToggles {
  xp: boolean;
  moderation: boolean;
  automod: boolean;
  tickets: boolean;
  economy: boolean;
  dailyRewards: boolean;
  achievements: boolean;
  inventory: boolean;
  shop: boolean;
  pets: boolean;
  minigames: boolean;
  anime: boolean;
  events: boolean;
  birthdays: boolean;
  polls: boolean;
  analytics: boolean;
  logging: boolean;
  reputation: boolean;
  seasonal: boolean;
  aiAssistant: boolean;
}

export const DEFAULT_MODULE_TOGGLES: GuildModuleToggles = {
  xp: true,
  moderation: true,
  automod: true,
  tickets: true,
  economy: true,
  dailyRewards: true,
  achievements: true,
  inventory: true,
  shop: true,
  pets: false,
  minigames: false,
  anime: false,
  events: true,
  birthdays: true,
  polls: true,
  analytics: true,
  logging: true,
  reputation: true,
  seasonal: false,
  aiAssistant: false,
};
