import { logger } from "../logger.js";
import type { FilterResult, ScoredContextItem } from "../types.js";
import { createTokenCounter, type TokenCounter } from "../token-counter.js";
import type { SessionService } from "../session.js";
import type { ContextItemRecord, Store } from "../store.js";
import { createFilterCacheKey, filterResultCache, type FilterResultCache } from "../cache.js";
import { listAllContextItems } from "../store-utils.js";
import { DEFAULT_MAX_ITEMS, DEFAULT_MIN_SCORE } from "../../shared/config-schema.js";

type FilterContextInput = {
  query: string;
  sessionId?: string;
  maxItems?: number;
  tokenBudget?: number;
  minScore?: number;
};

type FilterEngineClient = {
  score(
    query: string,
    items: Array<{ id: string; text: string; metadata?: Record<string, unknown> }>,
    topK?: number,
    sessionHistory?: string[]
  ): Promise<Array<{ id: string; text: string; score: number; metadata?: Record<string, unknown> }>>;
  tokenize(text: string): Promise<number>;
};

type FilterContextDeps = {
  store: Store;
  engineClient: FilterEngineClient;
  sessionService?: SessionService;
  tokenCounter?: TokenCounter;
  cacheManager?: FilterResultCache;
};

type FilterContextParams = FilterContextDeps & {
  input: FilterContextInput;
};

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
  const { store, engineClient, input, sessionService } = params;
  logger.info({ tool: "filter_context", query: input.query, tokenBudget: input.tokenBudget }, "tool invoked");
  const tokenCounter = params.tokenCounter ?? createTokenCounter(engineClient);
  const cacheManager = params.cacheManager ?? filterResultCache;
  const minScore = input.minScore ?? DEFAULT_MIN_SCORE;
  const maxItems = input.maxItems ?? DEFAULT_MAX_ITEMS;
  const session = input.sessionId && sessionService ? await sessionService.getSession(input.sessionId) : null;
  const sessionHistory = session ? [...session.history.map((item) => item.query), input.query] : undefined;
  const updateSessionHistory = async (retrievedIds: string[]): Promise<void> => {
    if (!session || !input.sessionId || !sessionService) {
      return;
    }

    await sessionService.updateSession(input.sessionId, input.query, retrievedIds);
  };

  try {
    const records = await listAllContextItems(store);
    const cacheKey = createFilterCacheKey({
      query: input.query,
      sessionId: input.sessionId,
      contextIds: records.map((record) => record.id)
    });

    const cachedResult = cacheManager.get(cacheKey);
    if (cachedResult) {
      await updateSessionHistory(cachedResult.selectedItems.map((item) => item.id));
      logger.info({ tool: "filter_context", itemCount: cachedResult.selectedItems.length, cached: true }, "tool completed");
      return {
        ...cachedResult,
        cached: true
      };
    }

    if (records.length === 0) {
      await updateSessionHistory([]);

      const result: FilterResult = {
        sessionId: input.sessionId ?? "",
        query: input.query,
        selectedItems: [],
        totalTokens: 0,
        tokenBudget: input.tokenBudget,
        minScore,
        totalCandidates: 0,
        droppedItemIds: []
      };

      cacheManager.set(cacheKey, result, []);
      logger.info({ tool: "filter_context", itemCount: result.selectedItems.length }, "tool completed");
      return result;
    }

    const recordsById = new Map(records.map((record) => [record.id, record]));
    const scoredByEngine = await engineClient.score(
      input.query,
      records.map((record) => ({
        id: record.id,
        text: record.content,
        metadata: record.metadata
      })),
      records.length,
      sessionHistory
    );

    const rankedItems = buildScoredItems(recordsById, scoredByEngine, minScore, maxItems);
    if (input.tokenBudget === undefined) {
      await updateSessionHistory(rankedItems.map((item) => item.id));

      const result: FilterResult = {
        sessionId: input.sessionId ?? "",
        query: input.query,
        selectedItems: rankedItems,
        totalTokens: rankedItems.reduce((sum, item) => sum + item.tokenCount, 0),
        tokenBudget: undefined,
        minScore,
        totalCandidates: rankedItems.length,
        droppedItemIds: []
      };

      cacheManager.set(cacheKey, result, records.map((record) => record.id));
      logger.info({ tool: "filter_context", itemCount: result.selectedItems.length }, "tool completed");
      return result;
    }

    const topItem = rankedItems[0];
    if (topItem && topItem.tokenCount > input.tokenBudget) {
      const truncated = await truncateToBudget(topItem.content, input.tokenBudget, tokenCounter);
      if (truncated.tokenCount === 0) {
        const result: FilterResult = {
          sessionId: input.sessionId ?? "",
          query: input.query,
          selectedItems: [],
          totalTokens: 0,
          tokenBudget: input.tokenBudget,
          minScore,
          totalCandidates: rankedItems.length,
          droppedItemIds: rankedItems.map((item) => item.id)
        };

        cacheManager.set(cacheKey, result, records.map((record) => record.id));
        logger.info({ tool: "filter_context", itemCount: result.selectedItems.length }, "tool completed");
        return result;
      }

      const truncatedItem: ScoredContextItem = {
        ...topItem,
        content: truncated.content,
        tokenCount: truncated.tokenCount,
        truncated: true
      };

      await updateSessionHistory([truncatedItem.id]);

      const result: FilterResult = {
        sessionId: input.sessionId ?? "",
        query: input.query,
        selectedItems: [truncatedItem],
        totalTokens: truncated.tokenCount,
        tokenBudget: input.tokenBudget,
        minScore,
        totalCandidates: rankedItems.length,
        droppedItemIds: rankedItems.slice(1).map((item) => item.id)
      };

      cacheManager.set(cacheKey, result, records.map((record) => record.id));
      logger.info({ tool: "filter_context", itemCount: result.selectedItems.length }, "tool completed");
      return result;
    }

    const packed = packWithinBudget(rankedItems, input.tokenBudget);
    if (packed.selectedItems.length > 0) {
      await updateSessionHistory(packed.selectedItems.map((item) => item.id));

      const result: FilterResult = {
        sessionId: input.sessionId ?? "",
        query: input.query,
        selectedItems: packed.selectedItems,
        totalTokens: packed.totalTokens,
        tokenBudget: input.tokenBudget,
        minScore,
        totalCandidates: rankedItems.length,
        droppedItemIds: packed.droppedItemIds
      };

      cacheManager.set(cacheKey, result, records.map((record) => record.id));
      logger.info({ tool: "filter_context", itemCount: result.selectedItems.length }, "tool completed");
      return result;
    }

    if (!topItem || input.tokenBudget <= 0) {
      await updateSessionHistory([]);

      const result: FilterResult = {
        sessionId: input.sessionId ?? "",
        query: input.query,
        selectedItems: [],
        totalTokens: 0,
        tokenBudget: input.tokenBudget,
        minScore,
        totalCandidates: rankedItems.length,
        droppedItemIds: rankedItems.map((item) => item.id)
      };

      cacheManager.set(cacheKey, result, records.map((record) => record.id));
      logger.info({ tool: "filter_context", itemCount: result.selectedItems.length }, "tool completed");
      return result;
    }

    await updateSessionHistory([]);

    const result: FilterResult = {
      sessionId: input.sessionId ?? "",
      query: input.query,
      selectedItems: [],
      totalTokens: 0,
      tokenBudget: input.tokenBudget,
      minScore,
      totalCandidates: rankedItems.length,
      droppedItemIds: rankedItems.map((item) => item.id)
    };

    cacheManager.set(cacheKey, result, records.map((record) => record.id));
    logger.info({ tool: "filter_context", itemCount: result.selectedItems.length }, "tool completed");
    return result;
} catch (err: unknown) {
  logger.error({ tool: "filter_context", err }, "tool error");
  throw err;
}
}

export type { FilterContextDeps, FilterContextInput, FilterContextParams, FilterEngineClient };