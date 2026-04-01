import { SupabaseStore } from "./db.js";
import { InMemoryStore } from "./memory-store.js";
import type { Store } from "./store.js";

export function createStore(): Store {
  if (process.env.DATABASE_URL) {
    return new SupabaseStore();
  }

  return new InMemoryStore();
}
