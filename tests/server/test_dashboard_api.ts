import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { CacheManager, createFilterCacheKey } from "../../src/server/cache.js";
import { InMemoryStore } from "../../src/server/memory-store.js";
import { createDashboardApiRouter } from "../../src/server/api.js";
import { filterContext } from "../../src/server/tools/filter.js";

function createTestApp(store: InMemoryStore, options?: { uptimeSeconds?: number }) {
  const app = express();
  app.use(express.json());
  app.use(
    "/api",
    createDashboardApiRouter({
      store,
      getUptimeSeconds: () => options?.uptimeSeconds ?? 42,
      checkEngineHealth: async () => "healthy"
    })
  );

  return app;
}

describe("dashboard REST API", () => {
  it("GET /api/status returns uptime, context count, active sessions, and engine health", async () => {
    const store = new InMemoryStore();
    await store.contextItems.create({
      id: "ctx-1",
      content: "Alpha",
      source: "seed",
      contentHash: "hash-1",
      tokenCount: 3,
      metadata: {}
    });

    await store.sessions.create({
      id: "session-active",
      queryCount: 2,
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });

    const app = createTestApp(store, { uptimeSeconds: 99 });
    const response = await request(app).get("/api/status");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      uptime: 99,
      contextCount: 1,
      activeSessions: 1,
      engineHealth: "healthy"
    });
  });

  it("GET /api/context returns paginated context items", async () => {
    const store = new InMemoryStore();
    await store.contextItems.create({
      id: "ctx-1",
      content: "First",
      source: "seed",
      contentHash: "hash-1",
      tokenCount: 1,
      metadata: { topic: "a" }
    });
    await store.contextItems.create({
      id: "ctx-2",
      content: "Second",
      source: "seed",
      contentHash: "hash-2",
      tokenCount: 2,
      metadata: { topic: "b" }
    });

    const app = createTestApp(store);
    const response = await request(app).get("/api/context?page=2&perPage=1");

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(2);
    expect(response.body.perPage).toBe(1);
    expect(response.body.total).toBe(2);
    expect(response.body.totalPages).toBe(2);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]?.id).toBe("ctx-2");
  });

  it("DELETE /api/context/:id removes context and invalidates filter cache", async () => {
    const cacheManager = new CacheManager({ ttlMs: 60_000, maxEntries: 100 });
    const store = new InMemoryStore(cacheManager);

    await store.contextItems.create({
      id: "ctx-delete",
      content: "Delete me",
      source: "seed",
      contentHash: "hash-delete",
      tokenCount: 2,
      metadata: {}
    });

    await filterContext({
      store,
      cacheManager,
      engineClient: {
        score: vi.fn().mockResolvedValue([{ id: "ctx-delete", text: "Delete me", score: 0.99 }]),
        tokenize: vi.fn().mockResolvedValue(0)
      },
      input: {
        query: "delete",
        sessionId: "session-delete"
      }
    });

    const cacheKey = createFilterCacheKey({
      query: "delete",
      sessionId: "session-delete",
      contextIds: ["ctx-delete"]
    });
    expect(cacheManager.get(cacheKey)).not.toBeNull();

    const app = createTestApp(store);
    const response = await request(app).delete("/api/context/ctx-delete");

    expect(response.status).toBe(204);
    expect(await store.contextItems.getById("ctx-delete")).toBeNull();
    expect(cacheManager.get(cacheKey)).toBeNull();
  });

  it("GET /api/sessions returns active sessions", async () => {
    const store = new InMemoryStore();
    await store.sessions.create({
      id: "session-active",
      queryCount: 3,
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });

    await store.sessions.create({
      id: "session-expired",
      queryCount: 7,
      expiresAt: new Date(Date.now() - 60_000).toISOString()
    });

    const app = createTestApp(store);
    const response = await request(app).get("/api/sessions");

    expect(response.status).toBe(200);
    expect(response.body.sessions).toHaveLength(1);
    expect(response.body.sessions[0]?.id).toBe("session-active");
  });

  it("GET/PUT /api/config returns and updates config immediately", async () => {
    const store = new InMemoryStore();
    const app = createTestApp(store);

    const initial = await request(app).get("/api/config");
    expect(initial.status).toBe(200);
    expect(initial.body.defaultMaxItems).toBeTypeOf("number");

    const updated = await request(app).put("/api/config").send({
      defaultMaxItems: 55,
      defaultMinScore: 0.25,
      filterCacheTtlMs: 120_000,
      sessionTtlMs: 180_000
    });

    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({
      defaultMaxItems: 55,
      defaultMinScore: 0.25,
      filterCacheTtlMs: 120000,
      sessionTtlMs: 180000
    });

    const afterUpdate = await request(app).get("/api/config");
    expect(afterUpdate.status).toBe(200);
    expect(afterUpdate.body).toEqual(updated.body);
  });

  it("GET /api/analytics returns token usage stats per session", async () => {
    const store = new InMemoryStore();
    await store.sessions.create({
      id: "session-a",
      queryCount: 2,
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });

    await store.sessions.create({
      id: "session-b",
      queryCount: 1,
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });

    await store.filterCache.set({
      key: "cache-a-1",
      sessionId: "session-a",
      queryHash: "hash-a-1",
      resultJson: JSON.stringify({ totalTokens: 45 }),
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });
    await store.filterCache.set({
      key: "cache-a-2",
      sessionId: "session-a",
      queryHash: "hash-a-2",
      resultJson: JSON.stringify({ totalTokens: 15 }),
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });
    await store.filterCache.set({
      key: "cache-b-1",
      sessionId: "session-b",
      queryHash: "hash-b-1",
      resultJson: JSON.stringify({ totalTokens: 10 }),
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });

    const app = createTestApp(store);
    const response = await request(app).get("/api/analytics");

    expect(response.status).toBe(200);
    expect(response.body.sessions).toEqual([
      {
        sessionId: "session-a",
        queryCount: 2,
        tokenUsage: 60,
        cacheEntries: 2
      },
      {
        sessionId: "session-b",
        queryCount: 1,
        tokenUsage: 10,
        cacheEntries: 1
      }
    ]);
    expect(response.body.totals).toEqual({
      tokenUsage: 70,
      cacheEntries: 3,
      sessionCount: 2
    });
  });
});
