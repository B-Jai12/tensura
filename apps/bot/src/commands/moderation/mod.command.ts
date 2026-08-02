/**
 * /mod — Complete moderation suite.
 *
 * Subcommands:
 *   /mod warn <user> <reason>                  — Issue a formal warning
 *   /mod kick <user> [reason]                  — Remove from server
 *   /mod ban <user> [reason] [delete-days]     — Permanently ban
 *   /mod unban <user-id> [reason]              — Lift a ban
 *   /mod timeout <user> <duration> [reason]    — Discord native timeout (1s–28d)
 *   /mod untimeout <user> [reason]             — Remove timeout
 *   /mod cases <user>                          — View audit history
 *
 * Requires: ModerateMembers (BanMembers is checked per-subcommand at runtime).
 */

import {
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { moderationModule } from "@tensura/core";
import { baseEmbed, BRAND, EMOJI, PALETTE } from "@tensura/ui-kit";
import type { CommandDefinition } from "../../registry/command.types.js";

const ACTION_EMOJI: Record<string, string> = {
  warn:   "⚠️",
  kick:   "👟",
  ban:    "🔨",
  unban:  "🔓",
  mute:   "🔇",
  unmute: "🔊",
};

const command: CommandDefinition = {
  module: "moderation",
  cooldownSeconds: 2,

  data: new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Moderation toolkit for server staff.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("warn")
        .setDescription("Issue a formal warning to a member.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Member to warn").setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason for the warning").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("kick")
        .setDescription("Remove a member from the server.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Member to kick").setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("ban")
        .setDescription("Permanently ban a user from the server.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to ban").setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason").setRequired(false),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("delete-days")
            .setDescription("Days of messages to delete (0–7)")
            .setMinValue(0)
            .setMaxValue(7)
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("unban")
        .setDescription("Lift a ban. Provide the user's Discord ID.")
        .addStringOption((opt) =>
          opt.setName("user-id").setDescription("Discord user ID").setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("timeout")
        .setDescription("Apply a temporary timeout to a member (max 28d).")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Member to timeout").setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("duration")
            .setDescription("Duration, e.g. 10m, 2h, 7d (max 28d)")
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("untimeout")
        .setDescription("Remove a timeout from a member.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Member to un-timeout").setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("cases")
        .setDescription("View a member's moderation history.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Member to look up").setRequired(true),
        ),
    ),

  async execute(interaction, _ctx) {
    const sub   = interaction.options.getSubcommand(true);
    const guild = interaction.guild!;
    const mod   = interaction.user;

    await interaction.deferReply({ ephemeral: true });

    // ── Helper: resolve a full GuildMember from the "user" option ────────────
    const resolveMember = async (optionName: string): Promise<GuildMember | null> => {
      const user = interaction.options.getUser(optionName);
      if (!user) return null;
      // Try cache first, then fetch
      return (
        (guild.members.cache.get(user.id) as GuildMember | undefined) ??
        await guild.members.fetch(user.id).catch(() => null)
      );
    };

    // ── Cases ─────────────────────────────────────────────────────────────────
    if (sub === "cases") {
      const target = interaction.options.getUser("user", true);
      const cases  = await moderationModule.moderationService.getMemberCases(guild.id, target.id);

      if (cases.length === 0) {
        await interaction.editReply({
          embeds: [baseEmbed({ tone: "info", description: `${target.username} has a clean record. ${EMOJI.sakura}` })],
        });
        return;
      }

      const lines = cases.slice(0, 10).map((c) => {
        const emoji     = ACTION_EMOJI[c.action] ?? "📋";
        const timestamp = `<t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`;
        const reason    = c.reason ? ` — ${c.reason.slice(0, 60)}` : "";
        return `${emoji} **${c.action}** ${timestamp}${reason}\n\`${c.id}\``;
      });

      const embed = new EmbedBuilder()
        .setColor(PALETTE.blossomPink)
        .setTitle(`📋 Moderation History — ${target.username}`)
        .setDescription(lines.join("\n\n"))
        .setFooter({ text: `${cases.length} total cases · ${BRAND.footerText}` });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // ── Warn ──────────────────────────────────────────────────────────────────
    if (sub === "warn") {
      const target = await resolveMember("user");
      if (!target) {
        await interaction.editReply({ embeds: [baseEmbed({ tone: "danger", description: "Member not found in this server." })] });
        return;
      }

      const reason = interaction.options.getString("reason", true);
      const { case: newCase, totalWarnings } = await moderationModule.moderationService.warnMember(guild, target, mod, reason);

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone:  "warning",
            title: "⚠️ Warning Issued",
            description: [
              `**Member:** ${target.user.tag} (<@${target.user.id}>)`,
              `**Reason:** ${reason}`,
              `**Total warnings:** ${totalWarnings}`,
              `**Case ID:** \`${newCase.id}\``,
            ].join("\n"),
          }),
        ],
      });
      return;
    }

    // ── Kick ──────────────────────────────────────────────────────────────────
    if (sub === "kick") {
      const target = await resolveMember("user");
      if (!target) {
        await interaction.editReply({ embeds: [baseEmbed({ tone: "danger", description: "Member not found." })] });
        return;
      }
      if (!target.kickable) {
        await interaction.editReply({ embeds: [baseEmbed({ tone: "danger", description: "I can't kick that member — they may have a higher role than me." })] });
        return;
      }

      const reason  = interaction.options.getString("reason") ?? "No reason provided";
      const newCase = await moderationModule.moderationService.kickMember(guild, target, mod, reason);

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone:  "warning",
            title: "👟 Member Kicked",
            description: `**${target.user.tag}** has been kicked.\n**Reason:** ${reason}\n**Case:** \`${newCase.id}\``,
          }),
        ],
      });
      return;
    }

    // ── Ban ───────────────────────────────────────────────────────────────────
    if (sub === "ban") {
      const user       = interaction.options.getUser("user", true);
      const reason     = interaction.options.getString("reason") ?? "No reason provided";
      const deleteDays = interaction.options.getInteger("delete-days") ?? 1;
      const target     = await resolveMember("user");

      if (target && !target.bannable) {
        await interaction.editReply({ embeds: [baseEmbed({ tone: "danger", description: "I can't ban that member — check my role position." })] });
        return;
      }

      const newCase = await moderationModule.moderationService.banMember(guild, target ?? user, mod, reason, deleteDays);

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone:  "danger",
            title: "🔨 User Banned",
            description: `**${user.tag}** has been banned.\n**Reason:** ${reason}\n**Case:** \`${newCase.id}\``,
          }),
        ],
      });
      return;
    }

    // ── Unban ─────────────────────────────────────────────────────────────────
    if (sub === "unban") {
      const userId = interaction.options.getString("user-id", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";

      try {
        const newCase = await moderationModule.moderationService.unbanMember(guild, userId, mod, reason);
        await interaction.editReply({
          embeds: [
            baseEmbed({
              tone:  "success",
              title: "🔓 User Unbanned",
              description: `User <@${userId}> has been unbanned.\n**Case:** \`${newCase.id}\``,
            }),
          ],
        });
      } catch {
        await interaction.editReply({ embeds: [baseEmbed({ tone: "danger", description: "That user is not banned, or the ID is invalid." })] });
      }
      return;
    }

    // ── Timeout ───────────────────────────────────────────────────────────────
    if (sub === "timeout") {
      const target      = await resolveMember("user");
      const durationStr = interaction.options.getString("duration", true);
      const reason      = interaction.options.getString("reason") ?? "No reason provided";

      if (!target) {
        await interaction.editReply({ embeds: [baseEmbed({ tone: "danger", description: "Member not found." })] });
        return;
      }

      const durationMs = moderationModule.moderationService.parseDuration(durationStr);
      if (!durationMs) {
        await interaction.editReply({ embeds: [baseEmbed({ tone: "warning", description: "Invalid duration. Examples: `10m`, `2h`, `7d`" })] });
        return;
      }
      if (durationMs > moderationModule.moderationService.MAX_TIMEOUT_MS) {
        await interaction.editReply({ embeds: [baseEmbed({ tone: "warning", description: "Maximum timeout duration is 28 days." })] });
        return;
      }

      const newCase = await moderationModule.moderationService.timeoutMember(guild, target, mod, reason, durationMs);
      const until   = `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>`;

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone:  "warning",
            title: "🔇 Member Timed Out",
            description: `**${target.user.tag}** has been timed out until ${until}.\n**Reason:** ${reason}\n**Case:** \`${newCase.id}\``,
          }),
        ],
      });
      return;
    }

    // ── Untimeout ─────────────────────────────────────────────────────────────
    if (sub === "untimeout") {
      const target = await resolveMember("user");
      const reason = interaction.options.getString("reason") ?? "Timeout removed";

      if (!target) {
        await interaction.editReply({ embeds: [baseEmbed({ tone: "danger", description: "Member not found." })] });
        return;
      }

      const newCase = await moderationModule.moderationService.timeoutMember(guild, target, mod, reason, null);

      await interaction.editReply({
        embeds: [
          baseEmbed({
            tone:  "success",
            title: "🔊 Timeout Removed",
            description: `**${target.user.tag}**'s timeout has been lifted.\n**Case:** \`${newCase.id}\``,
          }),
        ],
      });
    }
  },
};

export default command;
