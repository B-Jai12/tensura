/**
 * guildMemberAdd event — sends a welcome card when a new member joins.
 *
 * Flow:
 *  1. Check that the `xp` module is enabled (welcome cards are bundled
 *     with XP for now; they'll become their own toggle in Phase 3).
 *  2. Render the welcome card via @tensura/render.
 *  3. Send to `welcomeChannelId` if configured, else the guild system channel.
 *  4. Ensure the user row exists in our database (User + GuildMember).
 *
 * Non-fatal: render failures are logged but never crash the event handler.
 */

import { AttachmentBuilder } from "discord.js";
import { prisma } from "@tensura/database";
import { configModule } from "@tensura/core";
import { renderWelcomeCard } from "@tensura/render";
import { welcomeEmbed } from "@tensura/ui-kit";
import type { EventDefinition } from "./event.types.js";
import { moduleLogger } from "@tensura/logger";

const event: EventDefinition<"guildMemberAdd"> = {
  name: "guildMemberAdd",
  async execute(ctx, member) {
    const logger = moduleLogger(ctx.logger, "welcome");
    const { guild } = member;
    const guildId   = guild.id;
    const userId    = member.user.id;

    // ── Ensure User + GuildMember rows exist ──────────────────────────────
    await ensureMemberRecord(guildId, userId, member.user.username).catch((err) => {
      logger.error({ err, guildId, userId }, "Failed to ensure member record on join");
    });

    // ── Config check ─────────────────────────────────────────────────────
    const config = await configModule.getGuildConfig(ctx.redis, guildId);
    if (!config) return;

    // Determine welcome channel
    const channelId = config.welcomeChannelId ?? guild.systemChannelId;
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !("send" in channel)) return;

    // ── Render welcome card ───────────────────────────────────────────────
    let cardBuffer: Buffer;
    try {
      cardBuffer = await renderWelcomeCard({
        user: {
          id:          userId,
          displayName: member.displayName,
          username:    member.user.username,
          avatarUrl:   member.user.displayAvatarURL({ extension: "png", size: 256 }),
        },
        guildName:   guild.name,
        guildIconUrl: guild.iconURL({ extension: "png", size: 128 }) ?? undefined,
        memberCount: guild.memberCount,
      });
    } catch (err) {
      logger.error({ err, guildId, userId }, "Failed to render welcome card");
      return;
    }

    const fileName   = `welcome-${userId}.png`;
    const attachment = new AttachmentBuilder(cardBuffer, { name: fileName });
    const embed      = welcomeEmbed({
      guildName:    guild.name,
      displayName:  member.displayName,
      imageFileName: fileName,
    });

    await channel.send({ embeds: [embed], files: [attachment] }).catch((err) => {
      logger.warn({ err, guildId, channelId }, "Failed to send welcome card");
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: ensure DB rows exist for the joining user
// ─────────────────────────────────────────────────────────────────────────────

async function ensureMemberRecord(
  guildId: string,
  userId: string,
  username: string,
): Promise<void> {
  await prisma.user.upsert({
    where:  { id: userId },
    create: { id: userId, username },
    update: { username },
  });

  await prisma.guildMember.upsert({
    where:  { guildId_userId: { guildId, userId } },
    create: { guildId, userId, joinedAt: new Date() },
    update: { leftAt: null, joinedAt: new Date() },
  });
}

export default event;
