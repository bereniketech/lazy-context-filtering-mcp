import { SupabaseStore } from "./db.js";
import { InMemoryStore } from "./memory-store.js";
import type { Store } from "./store.js";
import { logger } from "./logger.js";

export function createStore(): Store {
  if (process.env.DATABASE_URL) {
    return new SupabaseStore();
  }

  if (process.env.NODE_ENV !== "test") {
    logger.warn("No DATABASE_URL configured — using in-memory store. Data will not persist.");
  }

  return new InMemoryStore();
}
