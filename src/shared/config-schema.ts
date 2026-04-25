import { z } from "zod";

export const DashboardConfigSchema = z.object({
  defaultMaxItems: z.number(),
  defaultMinScore: z.number(),
  filterCacheTtlMs: z.number(),
  sessionTtlMs: z.number(),
});

export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
