import { describe, it, expect } from "vitest";
import {
  DEFAULT_MAX_ITEMS,
  DEFAULT_MIN_SCORE,
  DEFAULT_CACHE_TTL_MS,
  DEFAULT_SESSION_TTL_MS,
  DashboardConfigSchema,
} from "./config-schema.js";

describe("config-schema", () => {
  it("exports DEFAULT_MAX_ITEMS = 20", () => {
    expect(DEFAULT_MAX_ITEMS).toBe(20);
  });

  it("exports DEFAULT_MIN_SCORE = 0", () => {
    expect(DEFAULT_MIN_SCORE).toBe(0);
  });

  it("exports DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000", () => {
    expect(DEFAULT_CACHE_TTL_MS).toBe(5 * 60 * 1000);
  });

  it("exports DEFAULT_SESSION_TTL_MS = 60 * 60 * 1000", () => {
    expect(DEFAULT_SESSION_TTL_MS).toBe(60 * 60 * 1000);
  });

  it("DashboardConfigSchema validates correct config", () => {
    const validConfig = {
      defaultMaxItems: 20,
      defaultMinScore: 0,
      filterCacheTtlMs: 300000,
      sessionTtlMs: 3600000,
    };
    const result = DashboardConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("DashboardConfigSchema rejects non-numeric values", () => {
    const invalidConfig = {
      defaultMaxItems: "not a number",
      defaultMinScore: 0,
      filterCacheTtlMs: 300000,
      sessionTtlMs: 3600000,
    };
    const result = DashboardConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });
});
