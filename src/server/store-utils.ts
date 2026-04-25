import type { ContextItemRecord, Store } from "./store.js";

const BATCH_SIZE = 500;

export async function listAllContextItems(store: Store): Promise<ContextItemRecord[]> {
  const allItems: ContextItemRecord[] = [];
  let offset = 0;

  while (true) {
    const batch = await store.contextItems.list(BATCH_SIZE, offset);
    allItems.push(...batch);

    if (batch.length < BATCH_SIZE) {
      return allItems;
    }

    offset += BATCH_SIZE;
  }
}

export function isExpired(expiresAt: string | null, nowMs: number): boolean {
  return expiresAt !== null && Date.parse(expiresAt) <= nowMs;
}
