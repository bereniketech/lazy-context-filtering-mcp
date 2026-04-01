import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
import { filterResultCache, type FilterResultCache } from "./cache.js";

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

type ContextItemRow = {
  id: string;
  content: string;
  source: string;
  content_hash: string;
  token_count: number;
  metadata: JsonValue | null;
  created_at: string;
  updated_at: string;
};

type SessionRow = {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  query_count: number;
};

type FilterCacheRow = {
  key: string;
  session_id: string;
  query_hash: string;
  result_json: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

function mapContextItem(row: ContextItemRow): ContextItemRecord {
  return {
    id: row.id,
    content: row.content,
    source: row.source,
    contentHash: row.content_hash,
    tokenCount: row.token_count,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    queryCount: row.query_count
  };
}

function mapFilterCache(row: FilterCacheRow): FilterCacheRecord {
  return {
    key: row.key,
    sessionId: row.session_id,
    queryHash: row.query_hash,
    resultJson: row.result_json,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class SupabaseStore implements Store {
  private readonly client: SupabaseClient;
  private readonly cacheManager: FilterResultCache;

  public constructor(clientOrUrl?: SupabaseClient | string, maybeKey?: string, cacheManager: FilterResultCache = filterResultCache) {
    this.cacheManager = cacheManager;

    if (typeof clientOrUrl === "string") {
      this.client = createClient(clientOrUrl, maybeKey ?? process.env.SUPABASE_ANON_KEY ?? "public-anon-key");
      return;
    }

    if (clientOrUrl) {
      this.client = clientOrUrl;
      return;
    }

    const url = process.env.SUPABASE_URL ?? process.env.DATABASE_URL;
    if (!url) {
      throw new Error("SUPABASE_URL or DATABASE_URL must be set for SupabaseStore");
    }

    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "public-anon-key";
    this.client = createClient(url, key);
  }

  public readonly contextItems: Store["contextItems"] = {
    create: async (input: CreateContextItemInput): Promise<ContextItemRecord> => {
      const { data, error } = await this.client
        .from("context_items")
        .insert({
          id: input.id,
          content: input.content,
          source: input.source,
          content_hash: input.contentHash,
          token_count: input.tokenCount,
          metadata: input.metadata ?? {}
        })
        .select()
        .single<ContextItemRow>();

      if (error) {
        throw error;
      }

      return mapContextItem(data);
    },
    getById: async (id: string): Promise<ContextItemRecord | null> => {
      const { data, error } = await this.client
        .from("context_items")
        .select("*")
        .eq("id", id)
        .maybeSingle<ContextItemRow>();

      if (error) {
        throw error;
      }

      return data ? mapContextItem(data) : null;
    },
    getByIds: async (ids: string[]): Promise<ContextItemRecord[]> => {
      if (ids.length === 0) {
        return [];
      }

      const { data, error } = await this.client
        .from("context_items")
        .select("*")
        .in("id", ids)
        .returns<ContextItemRow[]>();

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapContextItem);
    },
    getByHash: async (contentHash: string): Promise<ContextItemRecord | null> => {
      const { data, error } = await this.client
        .from("context_items")
        .select("*")
        .eq("content_hash", contentHash)
        .maybeSingle<ContextItemRow>();

      if (error) {
        throw error;
      }

      return data ? mapContextItem(data) : null;
    },
    list: async (limit?: number, offset?: number): Promise<ContextItemRecord[]> => {
      const from = Math.max(offset ?? 0, 0);
      const to = limit === undefined ? from + 999 : from + Math.max(limit, 0) - 1;

      const { data, error } = await this.client
        .from("context_items")
        .select("*")
        .order("created_at", { ascending: true })
        .range(from, to)
        .returns<ContextItemRow[]>();

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapContextItem);
    },
    delete: async (id: string): Promise<boolean> => {
      const { error, count } = await this.client
        .from("context_items")
        .delete({ count: "exact" })
        .eq("id", id);

      if (error) {
        throw error;
      }

      if ((count ?? 0) > 0) {
        this.cacheManager.invalidate(id);
      }

      return (count ?? 0) > 0;
    }
  };

  public readonly sessions: Store["sessions"] = {
    create: async (input: CreateSessionInput): Promise<SessionRecord> => {
      const { data, error } = await this.client
        .from("sessions")
        .insert({
          id: input.id,
          user_id: input.userId ?? null,
          expires_at: input.expiresAt ?? null,
          query_count: input.queryCount ?? 0
        })
        .select()
        .single<SessionRow>();

      if (error) {
        throw error;
      }

      return mapSession(data);
    },
    getById: async (id: string): Promise<SessionRecord | null> => {
      const { data, error } = await this.client
        .from("sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle<SessionRow>();

      if (error) {
        throw error;
      }

      return data ? mapSession(data) : null;
    },
    update: async (id: string, updates: UpdateSessionInput): Promise<SessionRecord | null> => {
      const { data, error } = await this.client
        .from("sessions")
        .update({
          user_id: updates.userId,
          expires_at: updates.expiresAt,
          query_count: updates.queryCount,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select("*")
        .maybeSingle<SessionRow>();

      if (error) {
        throw error;
      }

      return data ? mapSession(data) : null;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error, count } = await this.client
        .from("sessions")
        .delete({ count: "exact" })
        .eq("id", id);

      if (error) {
        throw error;
      }

      return (count ?? 0) > 0;
    },
    deleteExpired: async (nowIso?: string): Promise<number> => {
      const cutoff = nowIso ?? new Date().toISOString();
      const { error, count } = await this.client
        .from("sessions")
        .delete({ count: "exact" })
        .lte("expires_at", cutoff);

      if (error) {
        throw error;
      }

      return count ?? 0;
    }
  };

  public readonly filterCache: Store["filterCache"] = {
    get: async (key: string): Promise<FilterCacheRecord | null> => {
      const { data, error } = await this.client
        .from("filter_cache")
        .select("*")
        .eq("key", key)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle<FilterCacheRow>();

      if (error) {
        throw error;
      }

      return data ? mapFilterCache(data) : null;
    },
    set: async (input: SetFilterCacheInput): Promise<FilterCacheRecord> => {
      const { data, error } = await this.client
        .from("filter_cache")
        .upsert({
          key: input.key,
          session_id: input.sessionId,
          query_hash: input.queryHash,
          result_json: input.resultJson,
          expires_at: input.expiresAt,
          updated_at: new Date().toISOString()
        })
        .select("*")
        .single<FilterCacheRow>();

      if (error) {
        throw error;
      }

      return mapFilterCache(data);
    },
    invalidate: async (sessionId: string): Promise<number> => {
      const { error, count } = await this.client
        .from("filter_cache")
        .delete({ count: "exact" })
        .eq("session_id", sessionId);

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
    deleteExpired: async (nowIso?: string): Promise<number> => {
      const cutoff = nowIso ?? new Date().toISOString();
      const { error, count } = await this.client
        .from("filter_cache")
        .delete({ count: "exact" })
        .lte("expires_at", cutoff);

      if (error) {
        throw error;
      }

      return count ?? 0;
    }
  };
}
