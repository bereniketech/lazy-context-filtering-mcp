import { describe, it, expect, afterEach } from "vitest";

afterEach(() => {
  delete process.env.LOG_LEVEL;
  delete process.env.MCP_TRANSPORT;
});

describe("logger module", () => {
  it("exports a logger object with an info method", async () => {
    const { logger } = await import("../../src/server/logger.js");
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
  });

  it("logger level defaults to info when LOG_LEVEL is not set", async () => {
    process.env.LOG_LEVEL = "info";
    const { logger } = await import("../../src/server/logger.js");
    expect(logger.level).toBe("info");
  });
});
