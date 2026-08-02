import pino, { type Logger } from "pino";

export interface CreateLoggerOptions {
  level?: string;
  /** e.g. "bot", "api", "workers" — becomes the `process` field on every line */
  process: string;
  pretty?: boolean;
}

/**
 * Creates the root logger for a process (bot/api/workers). Every module
 * within that process should call `.child({ module: "xp" })` on this
 * rather than instantiating pino directly — this is what keeps logs
 * greppable across a 20+ module codebase.
 */
export function createLogger(options: CreateLoggerOptions): Logger {
  const { level = "info", process: processName, pretty = false } = options;

  return pino({
    level,
    base: { process: processName },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: pretty
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        }
      : undefined,
  });
}

/** Convenience helper for modules that already have a root logger in scope. */
export function moduleLogger(root: Logger, moduleName: string): Logger {
  return root.child({ module: moduleName });
}

export type { Logger };
