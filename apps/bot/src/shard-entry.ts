import { bootstrap } from "./bootstrap.js";

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[shard-entry] Fatal startup error:", err);
  process.exit(1);
});
