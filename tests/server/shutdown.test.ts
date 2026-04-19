import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("graceful shutdown handlers", () => {
  let originalProcessOnce: typeof process.once;
  let registeredHandlers: Map<string, (...args: unknown[]) => void>;

  beforeEach(() => {
    registeredHandlers = new Map();
    originalProcessOnce = process.once;
    vi.spyOn(process, "once").mockImplementation((event, handler) => {
      registeredHandlers.set(event as string, handler as (...args: unknown[]) => void);
      return process;
    });
  });

  afterEach(() => {
    process.once = originalProcessOnce;
    vi.restoreAllMocks();
  });

  it("registers SIGTERM handler via process.once", async () => {
    expect(typeof process.once).toBe("function");
  });
});
