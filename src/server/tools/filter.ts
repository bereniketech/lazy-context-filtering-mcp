import type { FilterResult, ScoredContextItem } from "../types.js";
import { createTokenCounter, type TokenCounter } from "../token-counter.js";
import type { ContextItemRecord, Store } from "../store.js";

const BATCH_SIZE = 500;
const DEFAULT_MAX_ITEMS = 20;
const DEFAULT_MIN_SCORE = 0;

type FilterContextInput = {
  query: string;
  sessionId: string;
  maxItems?: number;
  tokenBudget?: number;
  minScore?: number;
};

type FilterEngineClient = {
  score(
    query: string,
    items: Array<{ id: string; text: string; metadata?: Record<string, unknown> }>,
    topK?: number
  ): Promise<Array<{ id: string; text: string; score: number; metadata?: Record<string, unknown> }>>;
  tokenize(text: string): Promise<number>;
};

type FilterContextDeps = {
  store: Store;
  engineClient: FilterEngineClient;
  tokenCounter?: TokenCounter;
};

type FilterContextParams = FilterContextDeps & {
  input: FilterContextInput;
};

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

function buildScoredItems(
  recordsById: Map<string, ContextItemRecord>,
  scoredByEngine: Array<{ id: string; score: number }>,
  minScore: number,
  maxItems: number
): ScoredContextItem[] {
  const scoredItems: ScoredContextItem[] = [];

  for (const scored of scoredByEngine) {
    const record = recordsById.get(scored.id);
    if (!record || scored.score < minScore) {
      continue;
    }

    scoredItems.push({
      id: record.id,
      content: record.content,
      source: record.source,
      tokenCount: record.tokenCount,
      metadata: record.metadata,
      relevanceScore: scored.score,
      rank: 0
    });
  }

  return scoredItems
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxItems)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
}

async function truncateToBudget(
  content: string,
  budget: number,
  tokenCounter: TokenCounter
): Promise<{ content: string; tokenCount: number }> {
  if (budget <= 0 || content.length === 0) {
    return {
      content: "",
      tokenCount: 0
    };
  }

  const fullTokenCount = await tokenCounter.countTokens(content);
  if (fullTokenCount <= budget) {
    return {
      content,
      tokenCount: fullTokenCount
    };
  }

  let low = 1;
  let high = content.length;
  let bestContent = "";
  let bestTokenCount = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = content.slice(0, mid);
    const tokenCount = await tokenCounter.countTokens(candidate);

    if (tokenCount <= budget) {
      bestContent = candidate;
      bestTokenCount = tokenCount;
      low = mid + 1;
      continue;
    }

    high = mid - 1;
  }

  return {
    content: bestContent,
    tokenCount: bestTokenCount
  };
}

function packWithinBudget(items: ScoredContextItem[], budget: number): {
  selectedItems: ScoredContextItem[];
  totalTokens: number;
  droppedItemIds: string[];
} {
  const selectedItems: ScoredContextItem[] = [];
  const droppedItemIds: string[] = [];
  let totalTokens = 0;

  for (const item of items) {
    if (item.tokenCount <= budget - totalTokens) {
      selectedItems.push(item);
      totalTokens += item.tokenCount;
      continue;
    }

    droppedItemIds.push(item.id);
  }

  return {
    selectedItems,
    totalTokens,
    droppedItemIds
  };
}

export async function filterContext(params: FilterContextParams): Promise<FilterResult> {
  const { store, engineClient, input } = params;
  const tokenCounter = params.tokenCounter ?? createTokenCounter(engineClient);
  const minScore = input.minScore ?? DEFAULT_MIN_SCORE;
  const maxItems = input.maxItems ?? DEFAULT_MAX_ITEMS;

  const records = await listAllContextItems(store);
  if (records.length === 0) {
    return {
      sessionId: input.sessionId,
      query: input.query,
      selectedItems: [],
      totalTokens: 0,
      tokenBudget: input.tokenBudget,
      minScore,
      totalCandidates: 0,
      droppedItemIds: []
    };
  }

  const recordsById = new Map(records.map((record) => [record.id, record]));
  const scoredByEngine = await engineClient.score(
    input.query,
    records.map((record) => ({
      id: record.id,
      text: record.content,
      metadata: record.metadata
    })),
    records.length
  );

  const rankedItems = buildScoredItems(recordsById, scoredByEngine, minScore, maxItems);
  if (input.tokenBudget === undefined) {
    return {
      sessionId: input.sessionId,
      query: input.query,
      selectedItems: rankedItems,
      totalTokens: rankedItems.reduce((sum, item) => sum + item.tokenCount, 0),
      tokenBudget: undefined,
      minScore,
      totalCandidates: rankedItems.length,
      droppedItemIds: []
    };
  }

  const topItem = rankedItems[0];
  if (topItem && topItem.tokenCount > input.tokenBudget) {
    const truncated = await truncateToBudget(topItem.content, input.tokenBudget, tokenCounter);
    if (truncated.tokenCount === 0) {
      return {
        sessionId: input.sessionId,
        query: input.query,
        selectedItems: [],
        totalTokens: 0,
        tokenBudget: input.tokenBudget,
        minScore,
        totalCandidates: rankedItems.length,
        droppedItemIds: rankedItems.map((item) => item.id)
      };
    }

    const truncatedItem: ScoredContextItem = {
      ...topItem,
      content: truncated.content,
      tokenCount: truncated.tokenCount,
      truncated: true
    };

    return {
      sessionId: input.sessionId,
      query: input.query,
      selectedItems: [truncatedItem],
      totalTokens: truncated.tokenCount,
      tokenBudget: input.tokenBudget,
      minScore,
      totalCandidates: rankedItems.length,
      droppedItemIds: rankedItems.slice(1).map((item) => item.id)
    };
  }

  const packed = packWithinBudget(rankedItems, input.tokenBudget);
  if (packed.selectedItems.length > 0) {
    return {
      sessionId: input.sessionId,
      query: input.query,
      selectedItems: packed.selectedItems,
      totalTokens: packed.totalTokens,
      tokenBudget: input.tokenBudget,
      minScore,
      totalCandidates: rankedItems.length,
      droppedItemIds: packed.droppedItemIds
    };
  }

  if (!topItem || input.tokenBudget <= 0) {
    return {
      sessionId: input.sessionId,
      query: input.query,
      selectedItems: [],
      totalTokens: 0,
      tokenBudget: input.tokenBudget,
      minScore,
      totalCandidates: rankedItems.length,
      droppedItemIds: rankedItems.map((item) => item.id)
    };
  }

  return {
    sessionId: input.sessionId,
    query: input.query,
    selectedItems: [],
    totalTokens: 0,
    tokenBudget: input.tokenBudget,
    minScore,
    totalCandidates: rankedItems.length,
    droppedItemIds: rankedItems.map((item) => item.id)
  };
}

export type { FilterContextDeps, FilterContextInput, FilterContextParams, FilterEngineClient };