import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { CacheManager, createFilterCacheKey } from "../../src/server/cache.js";
import { InMemoryStore } from "../../src/server/memory-store.js";
import { filterContext } from "../../src/server/tools/filter.js";
import { MAX_CONTEXT_BYTES, registerContext } from "../../src/server/tools/register.js";

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

describe("register_context tool", () => {
  it("invalidates cached filter results on context changes", async () => {
    const cacheManager = new CacheManager({ ttlMs: 60_000, maxEntries: 100 });
    const store = new InMemoryStore(cacheManager);

    await store.contextItems.create({
      id: "ctx-existing",
      content: "Existing content",
      source: "seed",
      contentHash: hashContent("Existing content"),
      tokenCount: 2,
      metadata: {}
    });

    await filterContext({
      store,
      cacheManager,
      engineClient: {
        score: vi.fn().mockResolvedValue([{ id: "ctx-existing", text: "Existing content", score: 0.9 }]),
        tokenize: vi.fn().mockResolvedValue(0)
      },
      input: {
        query: "existing",
        sessionId: "session-register"
      }
    });

    const beforeRegisterKey = createFilterCacheKey({
      query: "existing",
      sessionId: "session-register",
      contextIds: ["ctx-existing"]
    });
    expect(cacheManager.get(beforeRegisterKey)).not.toBeNull();

    await registerContext({
      store,
      cacheManager,
      engineClient: {
        summarize: vi.fn().mockResolvedValue("new summary"),
        tokenize: vi.fn().mockResolvedValue(10)
      },
      input: {
        content: "Brand new context"
      }
    });

    expect(cacheManager.get(beforeRegisterKey)).toBeNull();
  });

  it("registers new content and stores summary + token count", async () => {
    const store = new InMemoryStore();
    const summarize = vi.fn().mockResolvedValue("Short summary");
    const tokenize = vi.fn().mockResolvedValue(12);

    const result = await registerContext({
      store,
      engineClient: {
        summarize,
        tokenize
      },
      input: {
        content: "This is test content.",
        source: "unit-test",
        metadata: {
          category: "docs"
        }
      }
    });

    const stored = await store.contextItems.getById(result.id);
    expect(stored).not.toBeNull();
    expect(stored?.contentHash).toBe(result.contentHash);
    expect(stored?.tokenCount).toBe(12);
    expect(stored?.metadata.category).toBe("docs");
    expect(stored?.metadata.summary).toBe("Short summary");
    expect(result.summary).toBe("Short summary");
    expect(result.tokenCount).toBe(12);
    expect(summarize).toHaveBeenCalledWith("This is test content.");
    expect(tokenize).toHaveBeenCalledWith("This is test content.");
  });

  it("returns existing id for duplicate content without engine calls", async () => {
    const store = new InMemoryStore();
    const content = "Duplicate payload";
    const contentHash = hashContent(content);

    await store.contextItems.create({
      id: "ctx-existing",
      content,
      source: "seed",
      contentHash,
      tokenCount: 4,
      metadata: {
        summary: "Existing summary"
      }
    });

    const summarize = vi.fn().mockResolvedValue("Should not be called");
    const tokenize = vi.fn().mockResolvedValue(999);

    const result = await registerContext({
      store,
      engineClient: {
        summarize,
        tokenize
      },
      input: {
        content,
        source: "unit-test"
      }
    });

    expect(result).toEqual({
      id: "ctx-existing",
      contentHash,
      summary: "Existing summary",
      tokenCount: 4
    });
    expect(summarize).not.toHaveBeenCalled();
    expect(tokenize).not.toHaveBeenCalled();
  });

  it("rejects content larger than 100KB", async () => {
    const store = new InMemoryStore();
    const summarize = vi.fn().mockResolvedValue("summary");
    const tokenize = vi.fn().mockResolvedValue(1);
    const content = "x".repeat(MAX_CONTEXT_BYTES + 1);

    await expect(
      registerContext({
        store,
        engineClient: {
          summarize,
          tokenize
        },
        input: {
          content,
          source: "unit-test"
        }
      })
    ).rejects.toThrow("100KB");

    expect(summarize).not.toHaveBeenCalled();
    expect(tokenize).not.toHaveBeenCalled();
  });
});