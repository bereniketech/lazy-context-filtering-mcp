import { describe, expect, it } from "vitest";
import { InMemoryStore } from "../../src/server/memory-store.js";
import { SessionLifecycleError, SessionService } from "../../src/server/session.js";

describe("session lifecycle", () => {
  it("creates a session with id and 1-hour expiry", async () => {
    const store = new InMemoryStore();
    const now = new Date("2026-04-01T10:00:00.000Z");
    const sessionService = new SessionService({
      store,
      now: () => now,
      idGenerator: () => "session-uuid"
    });

    const created = await sessionService.createSession();

    expect(created.id).toBe("session-uuid");
    expect(created.expiresAt).toBe("2026-04-01T11:00:00.000Z");
    expect(created.queryCount).toBe(0);
  });

  it("throws session-expired when accessing an expired session", async () => {
    const store = new InMemoryStore();
    const initialNow = new Date("2026-04-01T10:00:00.000Z");
    let currentNow = initialNow;

    const sessionService = new SessionService({
      store,
      now: () => currentNow,
      idGenerator: () => "session-expire",
      sessionTtlMs: 60_000
    });

    await sessionService.createSession();
    currentNow = new Date("2026-04-01T10:02:00.000Z");

    await expect(sessionService.getSession("session-expire")).rejects.toMatchObject({
      code: "session-expired"
    });

    expect(await store.sessions.getById("session-expire")).toBeNull();
  });

  it("endSession deletes session and invalidates cache", async () => {
    const store = new InMemoryStore();
    const sessionService = new SessionService({
      store,
      idGenerator: () => "session-end"
    });

    await sessionService.createSession();

    await store.filterCache.set({
      key: "cache-session-end",
      sessionId: "session-end",
      queryHash: "hash-end",
      resultJson: '{"items":[]}',
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });

    const result = await sessionService.endSession("session-end");

    expect(result.ended).toBe(true);
    expect(result.invalidatedCacheEntries).toBe(1);
    expect(await store.sessions.getById("session-end")).toBeNull();
    expect(await store.filterCache.get("cache-session-end")).toBeNull();
  });

  it("returns session-not-found for unknown session", async () => {
    const store = new InMemoryStore();
    const sessionService = new SessionService({ store });

    await expect(sessionService.getSession("missing-session")).rejects.toBeInstanceOf(SessionLifecycleError);
    await expect(sessionService.getSession("missing-session")).rejects.toMatchObject({
      code: "session-not-found"
    });
  });
});
