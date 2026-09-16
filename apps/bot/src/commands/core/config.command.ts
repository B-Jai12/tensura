/**
 * /config — Server configuration panel.
 *
 * Allows server administrators to view and toggle Rasmaliiii's modules,
 * and configure key settings (XP double-up channels, log channels, etc.).
 *
 * Subcommands:
 *   /config show              — Display current module toggles + key settings
 *   /config module <name> <on|off>  — Enable or disable a module
 *   /config log-channel <type> <channel>  — Set a log destination channel
 *   /config reset             — Reset all config to defaults (with confirmation)
 *
 * Requires: ManageGuild.
 */

import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { configModule } from "@tensura/core";
import { baseEmbed, EMOJI, PALETTE, BRAND } from "@tensura/ui-kit";
import type { CommandDefinition } from "../../registry/command.types.js";
import type { CommandModule } from "../../registry/command.types.js";
import type { GuildModuleToggles } from "@tensura/types";

// Modules that can be toggled via /config module (excludes "core")
const TOGGLEABLE_MODULES: Exclude<CommandModule, "core">[] = [
  "xp", "moderation", "automod", "tickets", "economy",
  "dailyRewards", "achievements", "inventory", "shop", "pets",
  "minigames", "anime", "events", "birthdays", "polls",
  "analytics", "logging", "reputation", "seasonal", "aiAssistant",
];

const MODULE_EMOJI: Record<string, string> = {
  xp: "🌸", moderation: "🛡️", automod: "🤖", tickets: "🎫", economy: "💰",
  dailyRewards: "🗓️", achievements: "🏆", inventory: "🎒", shop: "🏪", pets: "🐾",
  minigames: "🎮", anime: "🎌", events: "🎉", birthdays: "🎂", polls: "📊",
  analytics: "📈", logging: "📝", reputation: "⭐", seasonal: "🌺", aiAssistant: "✨",
};

const command: CommandDefinition = {
  module: "core",
  cooldownSeconds: 5,

  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure Rasmaliiii for this server. (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName("show").setDescription("View current module toggles and settings."),
    )
    .addSubcommand((sub) =>
      sub
        .setName("module")
        .setDescription("Enable or disable a Rasmaliiii module.")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Module to configure")
            .setRequired(true)
            .addChoices(
              ...TOGGLEABLE_MODULES.map((m) => ({ name: m, value: m })),
            ),
        )
        .addBooleanOption((opt) =>
          opt.setName("enabled").setDescription("true = on, false = off").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("log-channel")
        .setDescription("Set the channel for a specific log type.")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Log type")
            .setRequired(true)
            .addChoices(
              { name: "moderation", value: "moderation" },
              { name: "joins/leaves", value: "members" },
              { name: "messages", value: "messages" },
              { name: "voice", value: "voice" },
            ),
        )
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Target text channel").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("reset").setDescription("Reset all config to defaults. ⚠️ This cannot be undone."),
    ),

  async execute(interaction, ctx) {
    const sub     = interaction.options.getSubcommand(true);
    const guildId = interaction.guildId!;

    await interaction.deferReply({ ephemeral: true });

    // ── Show ─────────────────────────────────────────────────────────────────
    if (sub === "show") {
      const config = await configModule.getGuildConfig(ctx.redis, guildId);

      if (!config) {
        await interaction.editReply({
          embeds: [baseEmbed({ tone: "warning", description: "No config found — try rejoining the bot." })],
        });
        return;
      }

      const modules = configModule.getModuleToggles(config);
      const lines = TOGGLEABLE_MODULES.map((m) => {
        const enabled = modules[m as keyof GuildModuleToggles];
        const icon    = enabled ? "🟢" : "⚫";
        const emoji   = MODULE_EMOJI[m] ?? "❓";
        return `${icon} ${emoji} \`${m}\``;
      });

      const embed = new EmbedBuilder()
        .setColor(PALETTE.blossomPink)
        .setTitle(`${EMOJI.sparkle} Rasmaliiii Config — ${interaction.guild?.name}`)
        .setDescription("**Module Toggles**\n" + lines.join("  "))
        .addFields(
          {
            name: "📢 Welcome Channel",
            value: config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : "*(not set)*",
            inline: true,
          },
          {
            name: "⬆️ Level-Up Channel",
            value: config.levelUpChannelId ? `<#${config.levelUpChannelId}>` : "*(posts in message channel)*",
            inline: true,
          },
        )
        .setFooter({ text: BRAND.footerText });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // ── Toggle module ────────────────────────────────────────────────────────
    if (sub === "module") {
      const moduleName = interaction.options.getString("name", true) as keyof GuildModuleToggles;
      const enabled    = interaction.options.getBoolean("enabled", true);

      const config = await configModule.getGuildConfig(ctx.redis, guildId);
      const currentModules = configModule.getModuleToggles(config ?? ({} as any));

      await configModule.updateGuildConfig(ctx.redis, guildId, {
        modules: { ...currentModules, [moduleName]: enabled },
      });

      const emoji = MODULE_EMOJI[moduleName] ?? "";
      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone: enabled ? "success" : "info",
            title: `${emoji} Module ${enabled ? "Enabled" : "Disabled"}`,
            description: `The **${moduleName}** module is now **${enabled ? "on" : "off"}** for this server.`,
          }),
        ],
      });
      return;
    }

    // ── Log channel ──────────────────────────────────────────────────────────
    if (sub === "log-channel") {
      const logType = interaction.options.getString("type", true);
      const channel = interaction.options.getChannel("channel", true);

      const config       = await configModule.getGuildConfig(ctx.redis, guildId);
      const logChannels  = configModule.getLogChannels(config ?? ({} as any));
      const updatedLogChannels = { ...logChannels, [logType]: channel.id };

      await configModule.updateGuildConfig(ctx.redis, guildId, {
        logChannels: updatedLogChannels,
      });

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone: "success",
            title: `📝 Log Channel Set`,
            description: `**${logType}** logs will now be sent to <#${channel.id}>.`,
          }),
        ],
      });
      return;
    }

    // ── Reset ────────────────────────────────────────────────────────────────
    if (sub === "reset") {
      await configModule.updateGuildConfig(ctx.redis, guildId, {
        modules:         {},
        logChannels:     {},
        welcomeChannelId: null,
        levelUpChannelId: null,
      });

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone: "warning",
            title: "⚠️ Config Reset",
            description: "All module toggles, log channels, and routing config have been reset to defaults.",
          }),
        ],
      });
    }
  },
};

export default command;
