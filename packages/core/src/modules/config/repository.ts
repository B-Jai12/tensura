import { prisma } from "@tensura/database";
import type { Guild, GuildConfig } from "@tensura/database";

export async function findGuildConfig(guildId: string): Promise<GuildConfig | null> {
  return prisma.guildConfig.findUnique({ where: { guildId } });
}

export async function upsertGuild(guildId: string, name: string, ownerId: string): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: { name, ownerId },
    create: { id: guildId, name, ownerId },
  });
}

export async function createDefaultGuildConfig(
  guildId: string,
  modules: Record<string, boolean>,
): Promise<GuildConfig> {
  return prisma.guildConfig.upsert({
    where: { guildId },
    update: {},
    create: { guildId, modules },
  });
}

export async function updateGuildConfig(
  guildId: string,
  data: Partial<Pick<GuildConfig, "theme" | "locale" | "welcomeChannelId" | "levelUpChannelId" | "stackLevelRoles">> & {
    modules?: Record<string, boolean>;
    logChannels?: Record<string, string>;
  },
): Promise<GuildConfig> {
  return prisma.guildConfig.update({ where: { guildId }, data });
}
