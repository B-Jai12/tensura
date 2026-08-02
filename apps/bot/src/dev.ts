import { bootstrap } from "./bootstrap.js";

// Local dev runs a single Client directly instead of going through
// ShardingManager — faster reloads, and no guild count justifies
// sharding in dev anyway. Production always goes through
// shard-manager.ts (see package.json "start" script).
bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[dev] Fatal startup error:", err);
  process.exit(1);
});
