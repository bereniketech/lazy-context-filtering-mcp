import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";
import { InMemoryStore } from "../../src/server/memory-store.js";
import { getContext } from "../../src/server/tools/get.js";
import { listContext } from "../../src/server/tools/list.js";

async function seedContextItems(store: InMemoryStore): Promise<void> {
  await store.contextItems.create({
    id: "ctx-1",
    content: "Alpha full content",
    source: "test",
    contentHash: "hash-1",
    tokenCount: 10,
    metadata: {
      summary: "Alpha summary",
      tags: ["backend", "api"]
    }
  });

  await store.contextItems.create({
    id: "ctx-2",
    content: "Beta full content",
    source: "test",
    contentHash: "hash-2",
    tokenCount: 20,
    metadata: {
      summary: "Beta summary",
      tags: ["frontend"]
    }
  });

  await store.contextItems.create({
    id: "ctx-3",
    content: "Gamma full content",
    source: "test",
    contentHash: "hash-3",
    tokenCount: 30,
    metadata: {
      summary: "Gamma summary",
      tags: ["backend", "infra"]
    }
  });
}

describe("list_context tool", () => {
  it("returns summaries only without full content", async () => {
    const store = new InMemoryStore();
    await seedContextItems(store);

    const result = await listContext({
      store,
      input: {}
    });

    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(3);
    expect(result.items[0]).toMatchObject({
      id: "ctx-1",
      summary: "Alpha summary",
      tokenCount: 10
    });
    expect(result.items[0]).not.toHaveProperty("content");
  });

  it("supports tag filtering", async () => {
    const store = new InMemoryStore();
    await seedContextItems(store);

    const result = await listContext({
      store,
      input: {
        tags: ["frontend"]
      }
    });

    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual(["ctx-2"]);
  });

  it("supports pagination with limit and offset", async () => {
    const store = new InMemoryStore();
    await seedContextItems(store);

    const result = await listContext({
      store,
      input: {
        limit: 1,
        offset: 1
      }
    });

    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("ctx-2");
  });
});

describe("get_context tool", () => {
  it("returns full content for valid ids", async () => {
    const store = new InMemoryStore();
    await seedContextItems(store);

    const result = await getContext({
      store,
      input: {
        ids: ["ctx-2", "ctx-1"]
      }
    });

    expect(result.items).toEqual([
      {
        id: "ctx-2",
        content: "Beta full content",
        metadata: {
          summary: "Beta summary",
          tags: ["frontend"]
        }
      },
      {
        id: "ctx-1",
        content: "Alpha full content",
        metadata: {
          summary: "Alpha summary",
          tags: ["backend", "api"]
        }
      }
    ]);
  });

  it("throws not-found error with statusCode 404 for missing ids", async () => {
    const store = new InMemoryStore();
    await seedContextItems(store);

    await expect(
      getContext({
        store,
        input: {
          ids: ["ctx-1", "missing-id"]
        }
      })
    ).rejects.toMatchObject({
      code: ErrorCode.InvalidParams,
      data: {
        statusCode: 404,
        missingIds: ["missing-id"]
      }
    });
  });
});