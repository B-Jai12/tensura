import { PrismaClient } from "@prisma/client";

/**
 * A single PrismaClient instance per process, reused across hot reloads
 * in dev to avoid exhausting the Postgres connection pool. Every app
 * (bot/api/workers) imports `prisma` from here rather than constructing
 * its own client.
 */
declare global {
  // eslint-disable-next-line no-var
  var __tensuraPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__tensuraPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV === "development") {
  globalThis.__tensuraPrisma = prisma;
}
