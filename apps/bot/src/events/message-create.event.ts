/**
 * messageCreate event — XP grant on every valid guild message.
 *
 * Guard conditions (skip XP grant if any fail):
 *  - Message is in a guild
 *  - Author is not a bot / webhook
 *  - xp module is enabled for the guild
 *  - User is not on cooldown (handled inside xpService.grantXp)
 *
 * On level-up:
 *  - Sends a level-up embed to the message's channel (falls back to
 *    levelUpChannelId if configured).
 *  - Assigns all role rewards up to the new level (idempotent — Discord
 *    ignores adding a role the member already has).
 */

import { xpModule, configModule } from "@tensura/core";
import { levelUpEmbed } from "@tensura/ui-kit";
import type { GuildMember } from "discord.js";
import type { EventDefinition } from "./event.types.js";
import { moduleLogger } from "@tensura/logger";

const event: EventDefinition<"messageCreate"> = {
  name: "messageCreate",
  async execute(ctx, message) {
    const logger = moduleLogger(ctx.logger, "xp");

    // 1. Event received
    console.log("[XP Trace] 1. Event received");

    // 2. Guild ID
    console.log(`[XP Trace] 2. Guild ID: ${message.guildId}`);

    // 3. Channel ID
    console.log(`[XP Trace] 3. Channel ID: ${message.channelId}`);

    // 4. Author ID
    console.log(`[XP Trace] 4. Author ID: ${message.author?.id}`);

    // 5. Author is bot?
    const isBotOrSystem = !!(message.author?.bot || message.author?.system);
    console.log(`[XP Trace] 5. Author is bot?: ${isBotOrSystem}`);
    if (isBotOrSystem) {
      console.log("[XP Trace] Exit: author is bot");
      return;
    }

    // 6. Message has guild?
    console.log(`[XP Trace] 6. Message has guild?: ${!!message.guildId}`);
    if (!message.guildId) {
      console.log("[XP Trace] Exit: DM message");
      return;
    }
    const guildId = message.guildId;

    // 7. Message content length
    console.log(`[XP Trace] 7. Message content length: ${message.content?.length ?? 0}`);

    // 8. Guild initialization status
    const hasMember = !!message.member;
    console.log(`[XP Trace] 8. Member available: ${hasMember}`);

    const userId = message.author.id;

    // 9. Config loaded
    const config = await configModule.getGuildConfig(ctx.redis, guildId);
    console.log(`[XP Trace] 9. GuildConfig loaded successfully: ${!!config}`);
    if (!config) {
      console.log("[XP Trace] Exit: Guild config missing");
      return;
    }

    // 10. XP module enabled?
    const xpEnabled = configModule.isModuleEnabled(config, "xp");
    console.log(`[XP Trace] 10. moduleToggles.xp value: ${xpEnabled}`);
    if (!xpEnabled) {
      console.log("[XP Trace] Exit: XP module disabled");
      return;
    }

    // 12. Before grantXp()
    console.log("[XP Trace] 12. Before grantXp()");

    // ── Grant XP (handles cooldown internally) ────────────────────────────
    const result = await xpModule.xpService.grantXp(ctx.redis, guildId, userId);

    // 13. After grantXp()
    console.log("[XP Trace] 13. After grantXp()");

    // 14. Database update
    if (!result.onCooldown) {
      console.log(`[XP Trace] 14. Database update: successfully updated xp_profiles (totalXp=${result.profile.totalXp})`);
    }

    // 15. Cache invalidated
    if (!result.onCooldown) {
      console.log("[XP Trace] 15. Cache invalidated: completed");
    }

    // 11. Cooldown result
    console.log(`[XP Trace] 11. Cooldown result: onCooldown=${result.onCooldown}`);
    if (result.onCooldown) {
      console.log("[XP Trace] Exit: Cooldown active");
      return;
    }

    // 16. Level-up result
    console.log(`[XP Trace] [Msg ${message.id}] 16. Level-up result: leveledUp=${result.leveledUp}`);
    if (!result.leveledUp) {
      console.log("[XP Trace] Exit: Did not level up");
      return;
    }

    // ── Level-up handling ─────────────────────────────────────────────────
    const { newLevel, earnedRewards } = result;

    // Determine announcement channel
    const announceChannel = config.levelUpChannelId
      ? message.guild?.channels.cache.get(config.levelUpChannelId) ?? message.channel
      : message.channel;

    // Build level-up embed — show first earned role reward if any
    const firstReward = earnedRewards[0];
    let rewardRoleName: string | undefined;

    if (firstReward) {
      const role = message.guild?.roles.cache.get(firstReward.roleId);
      rewardRoleName = role?.name;
    }

    // Retrieve member robustly
    const member = message.member ?? await message.guild?.members.fetch(userId).catch(() => undefined);
    if (!member) {
      console.log("[XP Trace] Exit: Member unavailable");
      return;
    }

    const embed = levelUpEmbed({
      displayName: member.displayName,
      userId,
      newLevel,
      rewardRoleName,
      avatarUrl: message.author.displayAvatarURL({ extension: "png", size: 128 }),
    });

    // Send the announcement (non-fatal if channel is unpostable)
    if ("send" in announceChannel) {
      console.log(`[XP Trace] [Msg ${message.id}] Sending single level-up embed to channel ${announceChannel.id} for level ${newLevel}...`);
      await announceChannel.send({ embeds: [embed] }).catch((err) => {
        logger.warn({ err, guildId, userId }, "Failed to send level-up message");
      });
      console.log(`[XP Trace] [Msg ${message.id}] Level-up embed sent successfully.`);
    }

    // Assign all earned role rewards idempotently
    if (earnedRewards.length > 0) {
      await handleRoleProgression(
        member,
        earnedRewards.map((r) => r.roleId),
        guildId,
        config.stackLevelRoles,
        logger,
      );
    }
  },
};

async function handleRoleProgression(
  member: GuildMember,
  rolesToAdd: string[],
  guildId: string,
  stackLevelRoles: boolean,
  logger: { info(obj: object, msg: string): void; warn(obj: object, msg: string): void },
): Promise<void> {
  const toAdd = rolesToAdd.filter((roleId) => !member.roles.cache.has(roleId));
  let toRemove: string[] = [];

  if (!stackLevelRoles) {
    try {
      const allRewards = await xpModule.xpRewards.listRoleRewards(guildId);
      const otherRoleIds = allRewards
        .map((r) => r.roleId)
        .filter((roleId) => !rolesToAdd.includes(roleId));

      toRemove = otherRoleIds.filter((roleId) => member.roles.cache.has(roleId));
    } catch (err) {
      logger.warn({ err, userId: member.id }, "Failed to fetch level rewards for progression cleanup");
    }
  }

  if (toRemove.length > 0) {
    await member.roles.remove(toRemove).catch((err: unknown) => {
      logger.warn({ err, userId: member.id, roleIds: toRemove }, "Failed to remove previous level progression roles");
    });
    logger.info({ userId: member.id, roleIds: toRemove }, "Automatically removed previous level progression roles");
  }

  if (toAdd.length > 0) {
    await member.roles.add(toAdd).catch((err: unknown) => {
      logger.warn({ err, userId: member.id, roleIds: toAdd }, "Failed to assign new level progression roles");
    });
    logger.info({ userId: member.id, roleIds: toAdd }, "Automatically assigned level progression roles");
  }
}

export default event;
