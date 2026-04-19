import { describe, it, expect, vi, beforeEach } from "vitest";
import { contextListResourceHandler } from "../../src/server/resources/context-list.js";
import { sessionListResourceHandler } from "../../src/server/resources/session-list.js";

const mockStore = {
  contextItems: {
    list: vi.fn()
  }
};

const mockSessionService = {
  listActiveSessions: vi.fn()
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contextListResourceHandler", () => {
  it("returns contents array with context://items URI and JSON text", async () => {
    mockStore.contextItems.list.mockResolvedValue([{ id: "1", content: "hello" }]);
    const result = await contextListResourceHandler(mockStore as never);
    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].uri).toBe("context://items");
    expect(result.contents[0].mimeType).toBe("application/json");
    expect(JSON.parse(result.contents[0].text)).toEqual([{ id: "1", content: "hello" }]);
  });

  it("returns empty array text when store has no items", async () => {
    mockStore.contextItems.list.mockResolvedValue([]);
    const result = await contextListResourceHandler(mockStore as never);
    expect(JSON.parse(result.contents[0].text)).toEqual([]);
  });
});

describe("sessionListResourceHandler", () => {
  it("returns contents array with context://sessions URI and session JSON", async () => {
    mockSessionService.listActiveSessions.mockResolvedValue([{ id: "sess-1" }]);
    const result = await sessionListResourceHandler(mockSessionService as never);
    expect(result.contents[0].uri).toBe("context://sessions");
    expect(JSON.parse(result.contents[0].text)).toEqual([{ id: "sess-1" }]);
  });
});
