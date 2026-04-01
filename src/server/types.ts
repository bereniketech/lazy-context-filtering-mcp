export interface ContextItem {
  id: string;
  content: string;
  source: string;
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

export interface ScoredContextItem extends ContextItem {
  relevanceScore: number;
  rank: number;
  truncated?: boolean;
}

export interface FilterRequest {
  query: string;
  sessionId: string;
  maxItems: number;
  maxTokens: number;
  items: ContextItem[];
}

export interface FilterResult {
  sessionId: string;
  query: string;
  selectedItems: ScoredContextItem[];
  totalTokens: number;
  tokenBudget?: number;
  minScore: number;
  totalCandidates: number;
  droppedItemIds: string[];
}

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  queryCount: number;
}
