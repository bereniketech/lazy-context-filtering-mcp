import { describe, expect, it, vi } from "vitest";
import { InMemoryStore } from "../../src/server/memory-store.js";
import { filterContext } from "../../src/server/tools/filter.js";

async function seedItems(store: InMemoryStore): Promise<void> {
  await store.contextItems.create({
    id: "ctx-1",
    content: "Alpha content body",
    source: "unit-test",
    contentHash: "hash-1",
    tokenCount: 6,
    metadata: {
      topic: "alpha"
    }
  });

  await store.contextItems.create({
    id: "ctx-2",
    content: "Beta content body",
    source: "unit-test",
    contentHash: "hash-2",
    tokenCount: 4,
    metadata: {
      topic: "beta"
    }
  });

  await store.contextItems.create({
    id: "ctx-3",
    content: "Gamma content body",
    source: "unit-test",
    contentHash: "hash-3",
    tokenCount: 3,
    metadata: {
      topic: "gamma"
    }
  });
}

describe("filter_context tool", () => {
  it("returns items ranked by relevance score", async () => {
    const store = new InMemoryStore();
    await seedItems(store);

    const score = vi.fn().mockResolvedValue([
      { id: "ctx-2", text: "Beta content body", score: 0.95 },
      { id: "ctx-1", text: "Alpha content body", score: 0.75 },
      { id: "ctx-3", text: "Gamma content body", score: 0.5 }
    ]);

    const result = await filterContext({
      store,
      engineClient: {
        score,
        tokenize: vi.fn().mockResolvedValue(0)
      },
      input: {
        query: "beta topic",
        sessionId: "session-1"
      }
    });

    expect(result.selectedItems.map((item) => item.id)).toEqual(["ctx-2", "ctx-1", "ctx-3"]);
    expect(result.selectedItems.map((item) => item.rank)).toEqual([1, 2, 3]);
    expect(result.totalTokens).toBe(13);
    expect(score).toHaveBeenCalledOnce();
  });

  it("applies minScore filtering", async () => {
    const store = new InMemoryStore();
    await seedItems(store);

    const result = await filterContext({
      store,
      engineClient: {
        score: vi.fn().mockResolvedValue([
          { id: "ctx-1", text: "Alpha content body", score: 0.91 },
          { id: "ctx-2", text: "Beta content body", score: 0.65 },
          { id: "ctx-3", text: "Gamma content body", score: 0.12 }
        ]),
        tokenize: vi.fn().mockResolvedValue(0)
      },
      input: {
        query: "alpha",
        sessionId: "session-2",
        minScore: 0.8
      }
    });

    expect(result.selectedItems.map((item) => item.id)).toEqual(["ctx-1"]);
    expect(result.minScore).toBe(0.8);
  });

  it("enforces token budget using greedy packing", async () => {
    const store = new InMemoryStore();
    await seedItems(store);

    const result = await filterContext({
      store,
      engineClient: {
        score: vi.fn().mockResolvedValue([
          { id: "ctx-1", text: "Alpha content body", score: 0.9 },
          { id: "ctx-2", text: "Beta content body", score: 0.8 },
          { id: "ctx-3", text: "Gamma content body", score: 0.7 }
        ]),
        tokenize: vi.fn().mockResolvedValue(0)
      },
      input: {
        query: "all",
        sessionId: "session-3",
        tokenBudget: 9
      }
    });

    expect(result.selectedItems.map((item) => item.id)).toEqual(["ctx-1", "ctx-3"]);
    expect(result.totalTokens).toBe(9);
    expect(result.totalTokens).toBeLessThanOrEqual(9);
    expect(result.droppedItemIds).toEqual(["ctx-2"]);
  });

  it("truncates the top item when it alone exceeds budget", async () => {
    const store = new InMemoryStore();
    await seedItems(store);

    const tokenize = vi.fn(async (text: string) => {
      return text.length;
    });

    const result = await filterContext({
      store,
      engineClient: {
        score: vi.fn().mockResolvedValue([
          { id: "ctx-1", text: "Alpha content body", score: 0.98 },
          { id: "ctx-2", text: "Beta content body", score: 0.7 },
          { id: "ctx-3", text: "Gamma content body", score: 0.6 }
        ]),
        tokenize
      },
      input: {
        query: "alpha",
        sessionId: "session-4",
        tokenBudget: 5
      }
    });

    expect(result.selectedItems).toHaveLength(1);
    expect(result.selectedItems[0]?.id).toBe("ctx-1");
    expect(result.selectedItems[0]?.truncated).toBe(true);
    expect(result.selectedItems[0]?.tokenCount).toBeLessThanOrEqual(5);
    expect(result.totalTokens).toBeLessThanOrEqual(5);
    expect(tokenize).toHaveBeenCalled();
  });
});
