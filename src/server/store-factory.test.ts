import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStore } from "./store-factory.js";
import { logger } from "./logger.js";
import { InMemoryStore } from "./memory-store.js";
import { SupabaseStore } from "./db.js";

describe("createStore", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(logger, "warn");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.DATABASE_URL;
    delete process.env.NODE_ENV;
  });

  it("returns SupabaseStore when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "https://example.supabase.co";

    const store = createStore();

    expect(store).toBeInstanceOf(SupabaseStore);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns InMemoryStore and logs warning when DATABASE_URL is not set in production", () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = "production";

    const store = createStore();

    expect(store).toBeInstanceOf(InMemoryStore);
    expect(warnSpy).toHaveBeenCalledWith(
      "No DATABASE_URL configured — using in-memory store. Data will not persist."
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("returns InMemoryStore and logs warning when DATABASE_URL is not set in development", () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = "development";

    const store = createStore();

    expect(store).toBeInstanceOf(InMemoryStore);
    expect(warnSpy).toHaveBeenCalledWith(
      "No DATABASE_URL configured — using in-memory store. Data will not persist."
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("returns InMemoryStore without warning when DATABASE_URL is not set in test environment", () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = "test";

    const store = createStore();

    expect(store).toBeInstanceOf(InMemoryStore);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns InMemoryStore without warning when NODE_ENV is undefined and DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "https://example.supabase.co";
    delete process.env.NODE_ENV;

    const store = createStore();

    expect(store).toBeInstanceOf(SupabaseStore);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns InMemoryStore and logs warning when NODE_ENV is undefined and DATABASE_URL is not set", () => {
    delete process.env.DATABASE_URL;
    delete process.env.NODE_ENV;

    const store = createStore();

    expect(store).toBeInstanceOf(InMemoryStore);
    expect(warnSpy).toHaveBeenCalledWith(
      "No DATABASE_URL configured — using in-memory store. Data will not persist."
    );
  });

  it("returns InMemoryStore with exact warning message", () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = "production";

    createStore();

    expect(warnSpy).toHaveBeenCalledWith(
      "No DATABASE_URL configured — using in-memory store. Data will not persist."
    );
  });
});
