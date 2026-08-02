/**
 * The full catalog of domain events published across Tensura's modules.
 * A module publishes its events here as it lands (e.g. xp adds
 * "xp.levelup" in Phase 3); consumers like achievements subscribe by
 * key without importing the publishing module directly. This is what
 * keeps 20+ modules decoupled from each other.
 *
 * Phase 1 ships the bus contract with zero events registered — first
 * real entries land with the XP module in Phase 3.
 */
export interface DomainEventMap {
  // "xp.levelup": { guildId: string; userId: string; newLevel: number };
}

export type DomainEventName = keyof DomainEventMap;
