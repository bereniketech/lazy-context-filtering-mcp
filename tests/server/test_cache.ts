import { describe, expect, it, vi } from "vitest";
import { CacheManager } from "../../src/server/cache.js";
import type { FilterResult } from "../../src/server/types.js";

function makeResult(id: string): FilterResult {
  return {
    sessionId: "session-1",
    query: `query-${id}`,
    selectedItems: [],
    totalTokens: 0,
    minScore: 0,
    totalCandidates: 0,
    droppedItemIds: []
  };
}

describe("CacheManager", () => {
  it("returns null on miss and value on hit", () => {
    const cache = new CacheManager({ ttlMs: 1_000, maxEntries: 10 });

    expect(cache.get("missing")).toBeNull();

    cache.set("k1", makeResult("1"), ["ctx-1"]);

    expect(cache.get("k1")?.query).toBe("query-1");
  });

  it("expires entries after TTL", () => {
    vi.useFakeTimers();
    try {
      const cache = new CacheManager({ ttlMs: 10, maxEntries: 10 });
      cache.set("k1", makeResult("1"), ["ctx-1"]);

      expect(cache.get("k1")).not.toBeNull();

      vi.advanceTimersByTime(11);
      expect(cache.get("k1")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("invalidates entries by context id", () => {
    const cache = new CacheManager({ ttlMs: 1_000, maxEntries: 10 });
    cache.set("k1", makeResult("1"), ["ctx-1", "ctx-2"]);
    cache.set("k2", makeResult("2"), ["ctx-2"]);

    const deleted = cache.invalidate("ctx-2");
    expect(deleted).toBe(2);
    expect(cache.get("k1")).toBeNull();
    expect(cache.get("k2")).toBeNull();
  });

  it("evicts least recently used entry when capacity is exceeded", () => {
    const cache = new CacheManager({ ttlMs: 1_000, maxEntries: 2 });
    cache.set("k1", makeResult("1"), ["ctx-1"]);
    cache.set("k2", makeResult("2"), ["ctx-2"]);

    cache.get("k1");
    cache.set("k3", makeResult("3"), ["ctx-3"]);

    expect(cache.get("k1")).not.toBeNull();
    expect(cache.get("k2")).toBeNull();
    expect(cache.get("k3")).not.toBeNull();
  });
});
