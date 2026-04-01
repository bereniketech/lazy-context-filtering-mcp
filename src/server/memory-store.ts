import {
  type ContextItemRecord,
  type CreateContextItemInput,
  type CreateSessionInput,
  type FilterCacheRecord,
  type SessionRecord,
  type SetFilterCacheInput,
  type Store,
  type UpdateSessionInput
} from "./store.js";

function toIsoNow(): string {
  return new Date().toISOString();
}

export class InMemoryStore implements Store {
  private readonly contextItemsById = new Map<string, ContextItemRecord>();
  private readonly contextIdsByHash = new Map<string, string>();
  private readonly sessionsById = new Map<string, SessionRecord>();
  private readonly filterCacheByKey = new Map<string, FilterCacheRecord>();

  public readonly contextItems: Store["contextItems"] = {
    create: async (input: CreateContextItemInput): Promise<ContextItemRecord> => {
      const now = toIsoNow();
      const record: ContextItemRecord = {
        id: input.id,
        content: input.content,
        source: input.source,
        contentHash: input.contentHash,
        tokenCount: input.tokenCount,
        metadata: input.metadata ?? {},
        createdAt: now,
        updatedAt: now
      };

      this.contextItemsById.set(record.id, record);
      this.contextIdsByHash.set(record.contentHash, record.id);
      return record;
    },
    getById: async (id: string): Promise<ContextItemRecord | null> => {
      return this.contextItemsById.get(id) ?? null;
    },
    getByIds: async (ids: string[]): Promise<ContextItemRecord[]> => {
      return ids
        .map((id) => this.contextItemsById.get(id))
        .filter((record): record is ContextItemRecord => record !== undefined);
    },
    getByHash: async (contentHash: string): Promise<ContextItemRecord | null> => {
      const id = this.contextIdsByHash.get(contentHash);
      if (!id) {
        return null;
      }

      return this.contextItemsById.get(id) ?? null;
    },
    list: async (limit?: number, offset?: number): Promise<ContextItemRecord[]> => {
      const normalizedOffset = Math.max(0, offset ?? 0);
      const normalizedLimit = limit === undefined ? Number.MAX_SAFE_INTEGER : Math.max(0, limit);

      return [...this.contextItemsById.values()]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(normalizedOffset, normalizedOffset + normalizedLimit);
    },
    delete: async (id: string): Promise<boolean> => {
      const existing = this.contextItemsById.get(id);
      if (!existing) {
        return false;
      }

      this.contextItemsById.delete(id);
      this.contextIdsByHash.delete(existing.contentHash);
      return true;
    }
  };

  public readonly sessions: Store["sessions"] = {
    create: async (input: CreateSessionInput): Promise<SessionRecord> => {
      const now = toIsoNow();
      const record: SessionRecord = {
        id: input.id,
        userId: input.userId ?? null,
        createdAt: now,
        updatedAt: now,
        expiresAt: input.expiresAt ?? null,
        queryCount: input.queryCount ?? 0
      };

      this.sessionsById.set(record.id, record);
      return record;
    },
    getById: async (id: string): Promise<SessionRecord | null> => {
      return this.sessionsById.get(id) ?? null;
    },
    update: async (id: string, updates: UpdateSessionInput): Promise<SessionRecord | null> => {
      const existing = this.sessionsById.get(id);
      if (!existing) {
        return null;
      }

      const updated: SessionRecord = {
        ...existing,
        userId: updates.userId ?? existing.userId,
        expiresAt: updates.expiresAt === undefined ? existing.expiresAt : updates.expiresAt,
        queryCount: updates.queryCount ?? existing.queryCount,
        updatedAt: toIsoNow()
      };

      this.sessionsById.set(id, updated);
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      return this.sessionsById.delete(id);
    },
    deleteExpired: async (nowIso?: string): Promise<number> => {
      const now = Date.parse(nowIso ?? toIsoNow());
      let deleted = 0;

      for (const [id, session] of this.sessionsById.entries()) {
        if (!session.expiresAt) {
          continue;
        }

        if (Date.parse(session.expiresAt) <= now) {
          this.sessionsById.delete(id);
          deleted += 1;
        }
      }

      return deleted;
    }
  };

  public readonly filterCache: Store["filterCache"] = {
    get: async (key: string): Promise<FilterCacheRecord | null> => {
      const record = this.filterCacheByKey.get(key);
      if (!record) {
        return null;
      }

      if (Date.parse(record.expiresAt) <= Date.now()) {
        this.filterCacheByKey.delete(key);
        return null;
      }

      return record;
    },
    set: async (input: SetFilterCacheInput): Promise<FilterCacheRecord> => {
      const now = toIsoNow();
      const existing = this.filterCacheByKey.get(input.key);
      const record: FilterCacheRecord = {
        key: input.key,
        sessionId: input.sessionId,
        queryHash: input.queryHash,
        resultJson: input.resultJson,
        expiresAt: input.expiresAt,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      this.filterCacheByKey.set(input.key, record);
      return record;
    },
    invalidate: async (sessionId: string): Promise<number> => {
      let deleted = 0;

      for (const [key, value] of this.filterCacheByKey.entries()) {
        if (value.sessionId === sessionId) {
          this.filterCacheByKey.delete(key);
          deleted += 1;
        }
      }

      return deleted;
    },
    deleteExpired: async (nowIso?: string): Promise<number> => {
      const now = Date.parse(nowIso ?? toIsoNow());
      let deleted = 0;

      for (const [key, value] of this.filterCacheByKey.entries()) {
        if (Date.parse(value.expiresAt) <= now) {
          this.filterCacheByKey.delete(key);
          deleted += 1;
        }
      }

      return deleted;
    }
  };
}
