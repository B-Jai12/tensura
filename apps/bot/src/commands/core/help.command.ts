/**
 * /help — Interactive command reference.
 *
 * Lists all available commands grouped by module. Uses a select menu
 * so the response stays compact even as the command count grows.
 * Commands belonging to disabled modules are greyed out with a note.
 *
 * Design:
 *  - Initial reply shows the module list as a select menu.
 *  - Selecting a module shows that module's commands in an embed.
 *  - Collector expires after 60s; buttons are disabled on expiry.
 */

import {
  ActionRowBuilder,
  ComponentType,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { baseEmbed, EMOJI, PALETTE } from "@tensura/ui-kit";
import type { CommandDefinition, CommandModule } from "../../registry/command.types.js";

// Human-readable labels + emoji for each module group
const MODULE_LABELS: Record<CommandModule, { label: string; emoji: string; description: string }> = {
  core:         { label: "Core",           emoji: "⚙️",  description: "Essential bot commands" },
  xp:           { label: "XP & Levels",   emoji: "🌸", description: "Leveling, rank cards, leaderboard" },
  moderation:   { label: "Moderation",    emoji: "🛡️", description: "Kick, ban, warn, mute, logs" },
  automod:      { label: "AutoMod",       emoji: "🤖", description: "Automated moderation rules" },
  tickets:      { label: "Tickets",       emoji: "🎫", description: "Support ticket system" },
  economy:      { label: "Economy",       emoji: "💰", description: "Coins, shop, and trading" },
  dailyRewards: { label: "Daily",         emoji: "🗓️", description: "Daily check-in rewards" },
  achievements: { label: "Achievements",  emoji: "🏆", description: "Unlock badges and achievements" },
  inventory:    { label: "Inventory",     emoji: "🎒", description: "Your item collection" },
  shop:         { label: "Shop",          emoji: "🏪", description: "Buy items and upgrades" },
  pets:         { label: "Pets",          emoji: "🐾", description: "Adopt and raise a companion" },
  minigames:    { label: "Minigames",     emoji: "🎮", description: "Fun games to play" },
  anime:        { label: "Anime",         emoji: "🎌", description: "Anime info and character search" },
  events:       { label: "Events",        emoji: "🎉", description: "Community events and giveaways" },
  birthdays:    { label: "Birthdays",     emoji: "🎂", description: "Birthday announcements" },
  polls:        { label: "Polls",         emoji: "📊", description: "Create polls and votes" },
  analytics:    { label: "Analytics",     emoji: "📈", description: "Server statistics and insights" },
  logging:      { label: "Logging",       emoji: "📝", description: "Audit and activity logs" },
  reputation:   { label: "Reputation",    emoji: "⭐", description: "Community reputation system" },
  seasonal:     { label: "Seasonal",      emoji: "🌺", description: "Holiday and seasonal content" },
  aiAssistant:  { label: "AI Assistant",  emoji: "✨", description: "AI-powered server helper" },
};

const command: CommandDefinition = {
  module: "core",
  cooldownSeconds: 5,

  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Browse all Tensura commands by module."),

  async execute(interaction, ctx) {
    // Collect which modules have at least one loaded command
    const moduleGroups = new Map<CommandModule, typeof command[]>();
    for (const cmd of ctx.commands.values()) {
      const group = moduleGroups.get(cmd.module) ?? [];
      group.push(cmd as typeof command);
      moduleGroups.set(cmd.module, group);
    }

    // Build select menu options (one per module)
    const options = Array.from(moduleGroups.keys()).map((mod) => {
      const info = MODULE_LABELS[mod];
      return new StringSelectMenuOptionBuilder()
        .setLabel(info.label)
        .setDescription(info.description)
        .setValue(mod)
        .setEmoji(info.emoji);
    });

    const select = new StringSelectMenuBuilder()
      .setCustomId("help_module")
      .setPlaceholder("Choose a module to explore…")
      .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    const embed = baseEmbed({
      title: `${EMOJI.sakura} Tensura Command Reference`,
      description:
        `Welcome to the Tensura help menu! ${EMOJI.cup}\n\n` +
        `Select a module below to browse its commands.\n\n` +
        `**${ctx.commands.size}** commands loaded across **${moduleGroups.size}** modules.`,
    }).setColor(PALETTE.blossomPink);

    const reply = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    // Collector — only the invoker can navigate
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id,
      time: 60_000,
    });

    collector.on("collect", async (selectInteraction) => {
      await selectInteraction.deferUpdate();
      const selectedModule = selectInteraction.values[0] as CommandModule;
      const cmds = moduleGroups.get(selectedModule) ?? [];
      const info = MODULE_LABELS[selectedModule];

      const cmdLines = cmds.map((c) => `**/${c.data.name}** — ${c.data.description}`).join("\n");

      const moduleEmbed = baseEmbed({
        title: `${info.emoji} ${info.label} Commands`,
        description: cmdLines || "No commands in this module yet.",
      }).setColor(PALETTE.blossomPink);

      await selectInteraction.editReply({ embeds: [moduleEmbed], components: [row] });
    });

    collector.on("end", () => {
      interaction.editReply({ components: [] }).catch(() => undefined);
    });
  },
};

export default command;
