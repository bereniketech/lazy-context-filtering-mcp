import { describe, it, expect, vi } from "vitest";
import { createMcpServer } from "../../src/server/index.js";

vi.mock("../../src/server/store-factory.js", () => ({
  createStore: vi.fn(() => ({
    contextItems: {
      create: vi.fn(),
      getById: vi.fn(),
      getByIds: vi.fn(),
      getByHash: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      delete: vi.fn()
    },
    sessions: {
      create: vi.fn(),
      getById: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
      deleteExpired: vi.fn()
    },
    filterCache: {
      get: vi.fn(),
      list: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
      deleteExpired: vi.fn()
    }
  }))
}));

vi.mock("../../src/server/engine-client.js", () => ({
  EngineClient: vi.fn(() => ({
    score: vi.fn(),
    summarize: vi.fn(),
    tokenize: vi.fn()
  }))
}));

describe("createMcpServer capabilities", () => {
  it("creates a McpServer instance without throwing", () => {
    expect(() => createMcpServer()).not.toThrow();
  });

  it("returned server has connect method (is a valid McpServer)", () => {
    const server = createMcpServer();
    expect(typeof server.connect).toBe("function");
  });
});
