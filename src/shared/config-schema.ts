import { z } from "zod";

export const DEFAULT_MAX_ITEMS = 20;
export const DEFAULT_MIN_SCORE = 0;
export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_SESSION_TTL_MS = 60 * 60 * 1000;

export const DashboardConfigSchema = z.object({
  defaultMaxItems: z.number(),
  defaultMinScore: z.number(),
  filterCacheTtlMs: z.number(),
  sessionTtlMs: z.number(),
});

export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
