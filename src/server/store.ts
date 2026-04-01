export interface ContextItemRecord {
  id: string;
  content: string;
  source: string;
  contentHash: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContextItemInput {
  id: string;
  content: string;
  source: string;
  contentHash: string;
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

export interface SessionRecord {
  id: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  queryCount: number;
}

export interface CreateSessionInput {
  id: string;
  userId?: string;
  expiresAt?: string;
  queryCount?: number;
}

export interface UpdateSessionInput {
  userId?: string;
  expiresAt?: string | null;
  queryCount?: number;
}

export interface FilterCacheRecord {
  key: string;
  sessionId: string;
  queryHash: string;
  resultJson: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SetFilterCacheInput {
  key: string;
  sessionId: string;
  queryHash: string;
  resultJson: string;
  expiresAt: string;
}

export interface Store {
  contextItems: {
    create(input: CreateContextItemInput): Promise<ContextItemRecord>;
    getById(id: string): Promise<ContextItemRecord | null>;
    getByIds(ids: string[]): Promise<ContextItemRecord[]>;
    getByHash(contentHash: string): Promise<ContextItemRecord | null>;
    list(limit?: number, offset?: number): Promise<ContextItemRecord[]>;
    delete(id: string): Promise<boolean>;
  };
  sessions: {
    create(input: CreateSessionInput): Promise<SessionRecord>;
    getById(id: string): Promise<SessionRecord | null>;
    update(id: string, updates: UpdateSessionInput): Promise<SessionRecord | null>;
    delete(id: string): Promise<boolean>;
    deleteExpired(nowIso?: string): Promise<number>;
  };
  filterCache: {
    get(key: string): Promise<FilterCacheRecord | null>;
    set(input: SetFilterCacheInput): Promise<FilterCacheRecord>;
    invalidate(sessionId: string): Promise<number>;
    deleteExpired(nowIso?: string): Promise<number>;
  };
}
