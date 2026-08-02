import * as repo from './repository.js';
export * as xpService  from './service.js';
export * as xpFormula  from './formula.js';
export * as xpRepo     from './repository.js';
export type { XpGrantResult, XpProfileView, LeaderboardPage } from './service.js';
export type { LevelRoleReward } from './repository.js';

export const xpRewards = {
  addRoleReward: repo.upsertRoleReward,
  removeRoleReward: repo.deleteRoleReward,
  listRoleRewards: repo.listRoleRewards,
};
