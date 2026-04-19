import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EngineClient } from "../../src/server/engine-client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EngineClient retry behavior", () => {
  it("returns result on first successful attempt", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [{ id: "1", text: "t", score: 0.9 }] })
    });
    const client = new EngineClient("http://localhost:8100", 1000);
    const result = await client.score("query", [{ id: "1", text: "t" }]);
    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("retries on network failure and succeeds on second attempt", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });
    const client = new EngineClient("http://localhost:8100", 1000);
    const result = await client.score("q", []);
    expect(result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws after MAX_RETRIES failures", async () => {
    mockFetch.mockRejectedValue(new Error("Persistent failure"));
    const client = new EngineClient("http://localhost:8100", 1000);
    await expect(client.score("q", [])).rejects.toThrow("Persistent failure");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
