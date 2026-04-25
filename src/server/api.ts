import express from "express";
import type { Store } from "./store.js";
import { type DashboardConfig, DEFAULT_MAX_ITEMS, DEFAULT_MIN_SCORE, DEFAULT_CACHE_TTL_MS, DEFAULT_SESSION_TTL_MS } from "../shared/config-schema.js";
import { resolveEngineBaseUrl } from "./engine-client.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

type EngineHealthStatus = "healthy" | "unavailable";

type DashboardApiOptions = {
  store: Store;
  getUptimeSeconds?: () => number;
  checkEngineHealth?: () => Promise<EngineHealthStatus>;
  initialConfig?: Partial<DashboardConfig>;
};

function parsePositiveInt(input: unknown, fallback: number): number {
  if (typeof input === "string" && input.trim() !== "") {
    const parsed = Number(input);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
}

function parseNonNegativeNumber(input: unknown): number | null {
  if (typeof input !== "number" || !Number.isFinite(input) || input < 0) {
    return null;
  }

  return input;
}


async function defaultEngineHealthCheck(): Promise<EngineHealthStatus> {
  try {
    const response = await fetch(`${resolveEngineBaseUrl()}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(1000)
    });

    return response.ok ? "healthy" : "unavailable";
  } catch {
    return "unavailable";
  }
}

function toConfig(overrides?: Partial<DashboardConfig>): DashboardConfig {
  return {
    defaultMaxItems: overrides?.defaultMaxItems ?? DEFAULT_MAX_ITEMS,
    defaultMinScore: overrides?.defaultMinScore ?? DEFAULT_MIN_SCORE,
    filterCacheTtlMs: overrides?.filterCacheTtlMs ?? Number(process.env.FILTER_CACHE_TTL_MS ?? DEFAULT_CACHE_TTL_MS),
    sessionTtlMs: overrides?.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS
  };
}

export function createDashboardApiRouter(options: DashboardApiOptions): express.Router {
  const router = express.Router();
  const config = toConfig(options.initialConfig);
  const getUptimeSeconds = options.getUptimeSeconds ?? (() => process.uptime());
  const checkEngineHealth = options.checkEngineHealth ?? defaultEngineHealthCheck;

  router.get("/status", async (_req, res) => {
    const [contextItems, sessions, engineHealth] = await Promise.all([
      options.store.contextItems.list(Number.MAX_SAFE_INTEGER, 0),
      options.store.sessions.list(),
      checkEngineHealth()
    ]);

    res.status(200).json({
      uptime: Math.floor(getUptimeSeconds()),
      contextCount: contextItems.length,
      activeSessions: sessions.length,
      engineHealth
    });
  });

  router.get("/context", async (req, res) => {
    const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
    const perPage = Math.min(parsePositiveInt(req.query.perPage, DEFAULT_PER_PAGE), MAX_PER_PAGE);
    const offset = (page - 1) * perPage;

    const rawSearch = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const needle = rawSearch.toLowerCase();

    const allItemsRaw = await options.store.contextItems.list(Number.MAX_SAFE_INTEGER, 0);
    const allItems = needle
      ? allItemsRaw.filter((item) => {
          const metadata = JSON.stringify(item.metadata).toLowerCase();
          return (
            item.content.toLowerCase().includes(needle) ||
            item.source.toLowerCase().includes(needle) ||
            metadata.includes(needle)
          );
        })
      : allItemsRaw;

    const total = allItems.length;
    const items = allItems.slice(offset, offset + perPage);

    res.status(200).json({
      items,
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage))
    });
  });

  router.delete("/context/:id", async (req, res) => {
    const deleted = await options.store.contextItems.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({
        error: {
          code: "not_found",
          message: `Context item not found: ${req.params.id}`
        }
      });
      return;
    }

    res.status(204).send();
  });

  router.get("/sessions", async (_req, res) => {
    const sessions = await options.store.sessions.list();
    res.status(200).json({ sessions });
  });

  router.get("/config", (_req, res) => {
    res.status(200).json(config);
  });

  router.put("/config", (req, res) => {
    const updates = req.body as Partial<DashboardConfig>;

    const nextDefaultMaxItems =
      updates.defaultMaxItems === undefined ? config.defaultMaxItems : parseNonNegativeNumber(updates.defaultMaxItems);
    const nextDefaultMinScore =
      updates.defaultMinScore === undefined ? config.defaultMinScore : parseNonNegativeNumber(updates.defaultMinScore);
    const nextFilterCacheTtlMs =
      updates.filterCacheTtlMs === undefined ? config.filterCacheTtlMs : parseNonNegativeNumber(updates.filterCacheTtlMs);
    const nextSessionTtlMs =
      updates.sessionTtlMs === undefined ? config.sessionTtlMs : parseNonNegativeNumber(updates.sessionTtlMs);

    if (
      nextDefaultMaxItems === null ||
      nextDefaultMinScore === null ||
      nextFilterCacheTtlMs === null ||
      nextSessionTtlMs === null
    ) {
      res.status(400).json({
        error: {
          code: "invalid_config",
          message: "Config values must be finite, non-negative numbers"
        }
      });
      return;
    }

    config.defaultMaxItems = nextDefaultMaxItems;
    config.defaultMinScore = nextDefaultMinScore;
    config.filterCacheTtlMs = nextFilterCacheTtlMs;
    config.sessionTtlMs = nextSessionTtlMs;

    res.status(200).json(config);
  });

  router.get("/analytics", async (_req, res) => {
    const [sessions, filterCacheEntries] = await Promise.all([
      options.store.sessions.list(),
      options.store.filterCache.list()
    ]);

    const usageBySession = new Map<string, { tokenUsage: number; cacheEntries: number }>();
    for (const entry of filterCacheEntries) {
      let totalTokens = 0;

      try {
        const parsed = JSON.parse(entry.resultJson) as { totalTokens?: unknown };
        if (typeof parsed.totalTokens === "number" && Number.isFinite(parsed.totalTokens)) {
          totalTokens = parsed.totalTokens;
        }
      } catch {
        totalTokens = 0;
      }

      const existing = usageBySession.get(entry.sessionId) ?? {
        tokenUsage: 0,
        cacheEntries: 0
      };

      usageBySession.set(entry.sessionId, {
        tokenUsage: existing.tokenUsage + totalTokens,
        cacheEntries: existing.cacheEntries + 1
      });
    }

    const sessionStats = sessions.map((session) => {
      const usage = usageBySession.get(session.id) ?? {
        tokenUsage: 0,
        cacheEntries: 0
      };

      return {
        sessionId: session.id,
        queryCount: session.queryCount,
        tokenUsage: usage.tokenUsage,
        cacheEntries: usage.cacheEntries
      };
    });

    res.status(200).json({
      sessions: sessionStats,
      totals: {
        tokenUsage: sessionStats.reduce((sum, stat) => sum + stat.tokenUsage, 0),
        cacheEntries: sessionStats.reduce((sum, stat) => sum + stat.cacheEntries, 0),
        sessionCount: sessionStats.length
      }
    });
  });

  return router;
}
