/**
 * Moderation Repository — raw Prisma queries.
 * No business logic here, just data access.
 */

import { prisma } from '@tensura/database';

// ─────────────────────────────────────────────────────────────────────────────
// WARNING TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ModerationCase {
  id: string;
  guildId: string;
  userId: string;
  moderatorId: string;
  action: string;         // 'warn' | 'mute' | 'kick' | 'ban' | 'unban' | 'unmute'
  reason: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

/** Create a moderation case (auto-increments caseNumber on Postgres). */
export async function createCase(data: {
  guildId: string;
  userId: string;
  moderatorId: string;
  action: string;
  reason?: string | null;
  expiresAt?: Date | null;
}): Promise<ModerationCase> {
  return prisma.moderationCase.create({
    data: {
      guildId:     data.guildId,
      userId:      data.userId,
      moderatorId: data.moderatorId,
      action:      data.action,
      reason:      data.reason ?? null,
      expiresAt:   data.expiresAt ?? null,
    },
  });
}

export async function findCases(guildId: string, userId: string): Promise<ModerationCase[]> {
  return prisma.moderationCase.findMany({
    where:   { guildId, userId },
    orderBy: { createdAt: 'desc' },
    take:    25,
  });
}

export async function countCases(guildId: string, userId: string): Promise<number> {
  return prisma.moderationCase.count({ where: { guildId, userId } });
}

export async function findCaseById(id: string): Promise<ModerationCase | null> {
  return prisma.moderationCase.findUnique({ where: { id } });
}

export async function updateCaseReason(id: string, reason: string): Promise<ModerationCase> {
  return prisma.moderationCase.update({ where: { id }, data: { reason } });
}

export async function deleteCase(id: string): Promise<void> {
  await prisma.moderationCase.delete({ where: { id } });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE MUTES (timed punishments)
// ─────────────────────────────────────────────────────────────────────────────

export async function findActiveMute(guildId: string, userId: string): Promise<ModerationCase | null> {
  return prisma.moderationCase.findFirst({
    where: {
      guildId,
      userId,
      action: 'mute',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
}
