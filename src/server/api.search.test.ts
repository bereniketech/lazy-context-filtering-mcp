import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import supertest from "supertest";
import { createDashboardApiRouter } from "./api.js";
import type { Store, ContextItemRecord, CreateContextItemInput } from "./store.js";

function makeStore(seed: ContextItemRecord[]): Store {
  let items = [...seed];

  return {
    contextItems: {
      async create(input: CreateContextItemInput): Promise<ContextItemRecord> {
        const record: ContextItemRecord = {
          ...input,
          metadata: input.metadata ?? {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        items.push(record);
        return record;
      },
      async getById(id: string) {
        return items.find((i) => i.id === id) ?? null;
      },
      async getByIds(ids: string[]) {
        return items.filter((i) => ids.includes(i.id));
      },
      async getByHash(contentHash: string) {
        return items.find((i) => i.contentHash === contentHash) ?? null;
      },
      async list(limit = Number.MAX_SAFE_INTEGER, offset = 0) {
        return items.slice(offset, offset + limit);
      },
      async delete(id: string) {
        const before = items.length;
        items = items.filter((i) => i.id !== id);
        return items.length < before;
      },
    },
    sessions: {
      async create(input) {
        return { id: input.id, userId: input.userId ?? null, createdAt: "", updatedAt: "", expiresAt: input.expiresAt ?? null, queryCount: input.queryCount ?? 0 };
      },
      async getById() { return null; },
      async list() { return []; },
      async update() { return null; },
      async delete() { return false; },
      async deleteExpired() { return 0; },
    },
    filterCache: {
      async get() { return null; },
      async list() { return []; },
      async set(input) { return { ...input, createdAt: "", updatedAt: "" }; },
      async invalidate() { return 0; },
      async deleteExpired() { return 0; },
    },
  };
}

function makeItem(overrides: Partial<ContextItemRecord>): ContextItemRecord {
  return {
    id: "item-1",
    content: "default content",
    source: "default-source",
    contentHash: "abc123",
    tokenCount: 10,
    metadata: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const SEED: ContextItemRecord[] = [
  makeItem({ id: "item-1", content: "TypeScript async patterns", source: "docs/typescript.md", metadata: {} }),
  makeItem({ id: "item-2", content: "Python scoring algorithm", source: "engine/scorer.py", metadata: { tag: "ml" } }),
  makeItem({ id: "item-3", content: "React hooks guide", source: "frontend/hooks.tsx", metadata: { category: "frontend" } }),
];

describe("GET /api/context?search=", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api", createDashboardApiRouter({ store: makeStore([...SEED]) }));
  });

  it("returns all items when search param is absent", async () => {
    const res = await supertest(app).get("/api/context?page=1&perPage=50");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.total).toBe(3);
  });

  it("returns all items when search is empty string", async () => {
    const res = await supertest(app).get("/api/context?page=1&perPage=50&search=");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.total).toBe(3);
  });

  it("returns items matching full content", async () => {
    const res = await supertest(app).get("/api/context?page=1&perPage=50&search=TypeScript+async+patterns");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe("item-1");
    expect(res.body.total).toBe(1);
  });

  it("returns items matching partial content substring", async () => {
    const res = await supertest(app).get("/api/context?page=1&perPage=50&search=scoring");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe("item-2");
    expect(res.body.total).toBe(1);
  });

  it("returns items matching source path", async () => {
    const res = await supertest(app).get("/api/context?page=1&perPage=50&search=hooks.tsx");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe("item-3");
    expect(res.body.total).toBe(1);
  });

  it("returns items matching metadata value", async () => {
    const res = await supertest(app).get("/api/context?page=1&perPage=50&search=frontend");
    expect(res.status).toBe(200);
    // "frontend" matches item-3 metadata.category AND item-3 source "frontend/hooks.tsx"
    expect(res.body.items.some((i: { id: string }) => i.id === "item-3")).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it("is case-insensitive", async () => {
    const res = await supertest(app).get("/api/context?page=1&perPage=50&search=TYPESCRIPT");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe("item-1");
    expect(res.body.total).toBe(1);
  });

  it("returns empty result when no items match", async () => {
    const res = await supertest(app).get("/api/context?page=1&perPage=50&search=xyzzynotfound");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.total).toBe(0);
    expect(res.body.totalPages).toBe(1);
  });
});
