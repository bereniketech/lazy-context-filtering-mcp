import { describe, it, expect, vi } from "vitest";
import { listAllContextItems, isExpired } from "./store-utils.js";
import type { ContextItemRecord, Store } from "./store.js";

describe("listAllContextItems", () => {
  it("returns all items across multiple batches", async () => {
    // Create first batch with exactly 500 items
    const batch1: ContextItemRecord[] = [];
    for (let i = 1; i <= 500; i++) {
      batch1.push({
        id: String(i),
        content: `content-${i}`,
        source: `src-${i}`,
        contentHash: `hash-${i}`,
        tokenCount: i,
        metadata: {},
        createdAt: "2025-01-01",
        updatedAt: "2025-01-01",
      });
    }

    // Create second batch with fewer items
    const batch2: ContextItemRecord[] = [
      {
        id: "501",
        content: "content-501",
        source: "src-501",
        contentHash: "hash-501",
        tokenCount: 501,
        metadata: {},
        createdAt: "2025-01-01",
        updatedAt: "2025-01-01",
      },
    ];

    const mockStore = {
      contextItems: {
        list: vi.fn()
          .mockResolvedValueOnce(batch1)
          .mockResolvedValueOnce(batch2),
        create: vi.fn(),
        getById: vi.fn(),
        getByIds: vi.fn(),
        getByHash: vi.fn(),
        delete: vi.fn(),
      },
      sessions: {
        create: vi.fn(),
        getById: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteExpired: vi.fn(),
      },
      filterCache: {
        get: vi.fn(),
        list: vi.fn(),
        set: vi.fn(),
        invalidate: vi.fn(),
        deleteExpired: vi.fn(),
      },
    } as Store;

    const result = await listAllContextItems(mockStore);
    expect(result.length).toBeGreaterThan(500);
    expect(result.length).toBe(501);
    expect(mockStore.contextItems.list).toHaveBeenCalledTimes(2);
  });

  it("returns empty array when no items exist", async () => {
    const mockStore = {
      contextItems: {
        list: vi.fn().mockResolvedValueOnce([]),
        create: vi.fn(),
        getById: vi.fn(),
        getByIds: vi.fn(),
        getByHash: vi.fn(),
        delete: vi.fn(),
      },
      sessions: {
        create: vi.fn(),
        getById: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteExpired: vi.fn(),
      },
      filterCache: {
        get: vi.fn(),
        list: vi.fn(),
        set: vi.fn(),
        invalidate: vi.fn(),
        deleteExpired: vi.fn(),
      },
    } as Store;

    const result = await listAllContextItems(mockStore);
    expect(result).toEqual([]);
  });
});

describe("isExpired", () => {
  it("returns true when expiresAt <= nowMs", () => {
    const result = isExpired("2025-01-01T12:00:00Z", Date.parse("2025-01-01T12:00:00Z"));
    expect(result).toBe(true);
  });

  it("returns true when expiresAt < nowMs", () => {
    const result = isExpired("2025-01-01T12:00:00Z", Date.parse("2025-01-01T12:00:01Z"));
    expect(result).toBe(true);
  });

  it("returns false when expiresAt > nowMs", () => {
    const result = isExpired("2025-01-01T12:00:01Z", Date.parse("2025-01-01T12:00:00Z"));
    expect(result).toBe(false);
  });

  it("returns false when expiresAt is null", () => {
    const result = isExpired(null, Date.now());
    expect(result).toBe(false);
  });
});
