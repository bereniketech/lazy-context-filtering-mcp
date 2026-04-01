import { describe, expect, it } from "vitest";
import { SupabaseStore } from "../../src/server/db.js";
import { InMemoryStore } from "../../src/server/memory-store.js";
import { createStore } from "../../src/server/store-factory.js";
import type { Store } from "../../src/server/store.js";

function assertStoreShape(store: Store): Store {
  return store;
}

describe("Store interface compatibility", () => {
  it("InMemoryStore satisfies Store interface", () => {
    const store = new InMemoryStore();
    expect(assertStoreShape(store)).toBe(store);
  });

  it("SupabaseStore satisfies Store interface", () => {
    const store = new SupabaseStore("https://example.supabase.co", "test-key");
    expect(assertStoreShape(store)).toBe(store);
  });
});

describe("createStore factory", () => {
  it("returns InMemoryStore when DATABASE_URL is missing", () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const store = createStore();
    expect(store).toBeInstanceOf(InMemoryStore);

    if (previous !== undefined) {
      process.env.DATABASE_URL = previous;
    }
  });

  it("returns SupabaseStore when DATABASE_URL is set", () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    const previousSupabaseUrl = process.env.SUPABASE_URL;
    const previousSupabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    process.env.DATABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-key";

    const store = createStore();
    expect(store).toBeInstanceOf(SupabaseStore);

    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }

    if (previousSupabaseUrl === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = previousSupabaseUrl;
    }

    if (previousSupabaseAnonKey === undefined) {
      delete process.env.SUPABASE_ANON_KEY;
    } else {
      process.env.SUPABASE_ANON_KEY = previousSupabaseAnonKey;
    }
  });
});
