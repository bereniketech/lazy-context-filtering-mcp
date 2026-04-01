import { createHash } from "node:crypto";
import type { FilterResult } from "./types.js";

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 500;

export type FilterResultCacheEntry = {
  key: string;
  result: FilterResult;
  contextIds: string[];
  expiresAt: number;
};

export type FilterResultCache = {
  get(key: string): FilterResult | null;
  set(key: string, result: FilterResult, contextIds: string[], ttlMs?: number): void;
  invalidate(contextId: string): number;
  clear(): void;
};

type CacheManagerOptions = {
  ttlMs?: number;
  maxEntries?: number;
};

export class CacheManager implements FilterResultCache {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly cacheByKey = new Map<string, FilterResultCacheEntry>();
  private readonly keysByContextId = new Map<string, Set<string>>();

  public constructor(options?: CacheManagerOptions) {
    this.ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
    this.maxEntries = options?.maxEntries ?? DEFAULT_MAX_ENTRIES;
  }

  public get(key: string): FilterResult | null {
    const entry = this.cacheByKey.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.deleteEntry(entry);
      return null;
    }

    this.cacheByKey.delete(key);
    this.cacheByKey.set(key, entry);
    return structuredClone(entry.result);
  }

  public set(key: string, result: FilterResult, contextIds: string[], ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.ttlMs);

    const existing = this.cacheByKey.get(key);
    if (existing) {
      this.deleteEntry(existing);
    }

    const uniqueContextIds = [...new Set(contextIds)];
    const entry: FilterResultCacheEntry = {
      key,
      result: structuredClone(result),
      contextIds: uniqueContextIds,
      expiresAt
    };

    this.cacheByKey.set(key, entry);

    for (const contextId of uniqueContextIds) {
      const keys = this.keysByContextId.get(contextId) ?? new Set<string>();
      keys.add(key);
      this.keysByContextId.set(contextId, keys);
    }

    while (this.cacheByKey.size > this.maxEntries) {
      const oldestKey = this.cacheByKey.keys().next().value;
      if (!oldestKey) {
        break;
      }

      const oldestEntry = this.cacheByKey.get(oldestKey);
      if (!oldestEntry) {
        break;
      }

      this.deleteEntry(oldestEntry);
    }
  }

  public invalidate(contextId: string): number {
    const keys = this.keysByContextId.get(contextId);
    if (!keys || keys.size === 0) {
      return 0;
    }

    let deleted = 0;
    for (const key of keys) {
      const entry = this.cacheByKey.get(key);
      if (!entry) {
        continue;
      }

      this.deleteEntry(entry);
      deleted += 1;
    }

    return deleted;
  }

  public clear(): void {
    this.cacheByKey.clear();
    this.keysByContextId.clear();
  }

  private deleteEntry(entry: FilterResultCacheEntry): void {
    this.cacheByKey.delete(entry.key);

    for (const contextId of entry.contextIds) {
      const keys = this.keysByContextId.get(contextId);
      if (!keys) {
        continue;
      }

      keys.delete(entry.key);
      if (keys.size === 0) {
        this.keysByContextId.delete(contextId);
      }
    }
  }
}

export function createFilterCacheKey(input: {
  query: string;
  sessionId?: string;
  contextIds: string[];
}): string {
  const payload = JSON.stringify({
    query: input.query,
    sessionId: input.sessionId ?? "",
    contextIds: [...input.contextIds].sort()
  });

  return createHash("sha256").update(payload, "utf8").digest("hex");
}

function getDefaultTtlMs(): number {
  const ttlFromEnv = Number(process.env.FILTER_CACHE_TTL_MS);
  if (!Number.isFinite(ttlFromEnv) || ttlFromEnv <= 0) {
    return DEFAULT_TTL_MS;
  }

  return ttlFromEnv;
}

function getDefaultMaxEntries(): number {
  const maxEntriesFromEnv = Number(process.env.FILTER_CACHE_MAX_ENTRIES);
  if (!Number.isFinite(maxEntriesFromEnv) || maxEntriesFromEnv <= 0) {
    return DEFAULT_MAX_ENTRIES;
  }

  return maxEntriesFromEnv;
}

export const filterResultCache = new CacheManager({
  ttlMs: getDefaultTtlMs(),
  maxEntries: getDefaultMaxEntries()
});
