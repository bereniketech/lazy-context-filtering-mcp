import type { ContextItemRecord, Store } from "../store.js";

const DEFAULT_LIMIT = 50;
const DEFAULT_OFFSET = 0;
const BATCH_SIZE = 500;

type ListContextInput = {
  tags?: string[];
  limit?: number;
  offset?: number;
};

type ListContextItem = {
  id: string;
  summary: string;
  metadata: Record<string, unknown>;
  tokenCount: number;
};

type ListContextResult = {
  items: ListContextItem[];
  total: number;
};

type ListContextParams = {
  store: Store;
  input: ListContextInput;
};

function normalizePagination(input: ListContextInput): { limit: number; offset: number } {
  return {
    limit: input.limit ?? DEFAULT_LIMIT,
    offset: input.offset ?? DEFAULT_OFFSET
  };
}

function getSummary(metadata: Record<string, unknown>): string {
  const summary = metadata.summary;
  return typeof summary === "string" ? summary : "";
}

function toMetadataWithoutSummary(metadata: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...metadata };
  delete rest.summary;
  return rest;
}

function getTags(metadata: Record<string, unknown>): string[] {
  const tags = metadata.tags;
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter((tag): tag is string => typeof tag === "string");
}

function matchesRequestedTags(item: ContextItemRecord, requestedTags: string[]): boolean {
  if (requestedTags.length === 0) {
    return true;
  }

  const itemTags = getTags(item.metadata);
  return requestedTags.some((tag) => itemTags.includes(tag));
}

async function listAllContextItems(store: Store): Promise<ContextItemRecord[]> {
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

export async function listContext(params: ListContextParams): Promise<ListContextResult> {
  const { store, input } = params;
  const normalizedTags = (input.tags ?? []).filter((tag) => tag.trim().length > 0);
  const { limit, offset } = normalizePagination(input);

  const allItems = await listAllContextItems(store);
  const filteredItems = allItems.filter((item) => matchesRequestedTags(item, normalizedTags));
  const paginatedItems = filteredItems.slice(offset, offset + limit);

  return {
    total: filteredItems.length,
    items: paginatedItems.map((item) => ({
      id: item.id,
      summary: getSummary(item.metadata),
      metadata: toMetadataWithoutSummary(item.metadata),
      tokenCount: item.tokenCount
    }))
  };
}

export type { ListContextInput, ListContextItem, ListContextParams, ListContextResult };