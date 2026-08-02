import { Client, GatewayIntentBits, Partials } from "discord.js";

/**
 * Intents are additive as modules land — e.g. GuildVoiceStates arrives
 * with the XP module's voice-time tracking, GuildMessageReactions with
 * reaction-role/poll modules. Kept deliberately minimal in Phase 1 so
 * the bot only requests what it actually uses.
 */
export function createDiscordClient(): Client {
  // Delete SHARD_COUNT if it is 'auto' so discord.js doesn't try to parse it as a number and crash
  if (process.env.SHARD_COUNT === "auto") {
    delete process.env.SHARD_COUNT;
  }

  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      // Added with XP module — needed to count messages across shards correctly
      GatewayIntentBits.GuildMessageReactions, // reaction-roles / polls (Phase 3+)
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
  });
}
