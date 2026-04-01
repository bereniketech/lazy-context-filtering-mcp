import { describe, expect, it } from "vitest";
import { InMemoryStore } from "../../src/server/memory-store.js";

describe("InMemoryStore contextItems", () => {
  it("supports create/get/list/delete CRUD", async () => {
    const store = new InMemoryStore();

    await store.contextItems.create({
      id: "ctx-1",
      content: "alpha",
      source: "test",
      contentHash: "hash-alpha",
      tokenCount: 3,
      metadata: { topic: "a" }
    });

    await store.contextItems.create({
      id: "ctx-2",
      content: "beta",
      source: "test",
      contentHash: "hash-beta",
      tokenCount: 4
    });

    const byId = await store.contextItems.getById("ctx-1");
    expect(byId?.content).toBe("alpha");

    const byIds = await store.contextItems.getByIds(["ctx-2", "ctx-unknown", "ctx-1"]);
    expect(byIds.map((item) => item.id)).toEqual(["ctx-2", "ctx-1"]);

    const byHash = await store.contextItems.getByHash("hash-alpha");
    expect(byHash?.id).toBe("ctx-1");

    const listed = await store.contextItems.list(1, 1);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe("ctx-2");

    const deleted = await store.contextItems.delete("ctx-1");
    expect(deleted).toBe(true);
    expect(await store.contextItems.getById("ctx-1")).toBeNull();
  });
});

describe("InMemoryStore sessions", () => {
  it("supports create/get/update/delete and deleteExpired", async () => {
    const store = new InMemoryStore();

    const expiredIso = new Date(Date.now() - 1000).toISOString();
    const futureIso = new Date(Date.now() + 60_000).toISOString();

    await store.sessions.create({
      id: "session-expired",
      userId: "user-1",
      expiresAt: expiredIso,
      queryCount: 1
    });

    await store.sessions.create({
      id: "session-active",
      expiresAt: futureIso
    });

    const updated = await store.sessions.update("session-active", {
      queryCount: 10,
      userId: "user-2",
      expiresAt: null
    });

    expect(updated?.queryCount).toBe(10);
    expect(updated?.userId).toBe("user-2");
    expect(updated?.expiresAt).toBeNull();

    const removedExpired = await store.sessions.deleteExpired();
    expect(removedExpired).toBe(1);
    expect(await store.sessions.getById("session-expired")).toBeNull();

    const deleted = await store.sessions.delete("session-active");
    expect(deleted).toBe(true);
    expect(await store.sessions.getById("session-active")).toBeNull();
  });
});

describe("InMemoryStore filterCache", () => {
  it("supports get/set/invalidate/deleteExpired", async () => {
    const store = new InMemoryStore();

    const futureIso = new Date(Date.now() + 30_000).toISOString();
    const pastIso = new Date(Date.now() - 30_000).toISOString();

    await store.filterCache.set({
      key: "cache-1",
      sessionId: "session-1",
      queryHash: "q1",
      resultJson: '{"items": [1]}',
      expiresAt: futureIso
    });

    await store.filterCache.set({
      key: "cache-2",
      sessionId: "session-2",
      queryHash: "q2",
      resultJson: '{"items": [2]}',
      expiresAt: pastIso
    });

    const found = await store.filterCache.get("cache-1");
    expect(found?.queryHash).toBe("q1");

    const expired = await store.filterCache.get("cache-2");
    expect(expired).toBeNull();

    await store.filterCache.set({
      key: "cache-3",
      sessionId: "session-1",
      queryHash: "q3",
      resultJson: '{"items": [3]}',
      expiresAt: futureIso
    });

    const invalidated = await store.filterCache.invalidate("session-1");
    expect(invalidated).toBe(2);

    await store.filterCache.set({
      key: "cache-4",
      sessionId: "session-4",
      queryHash: "q4",
      resultJson: '{"items": [4]}',
      expiresAt: pastIso
    });

    const removedExpired = await store.filterCache.deleteExpired();
    expect(removedExpired).toBe(1);
  });
});
