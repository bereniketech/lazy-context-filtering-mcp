import pino from "pino";

const LOG_LEVEL = process.env.MCP_TRANSPORT === "stdio"
  ? "silent"
  : (process.env.LOG_LEVEL ?? "info");

export const logger = pino({
  level: LOG_LEVEL,
  base: {
    service: "lazy-context-filtering-mcp"
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

export type Logger = typeof logger;
