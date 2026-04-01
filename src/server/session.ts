import { v4 as uuidv4 } from "uuid";
import type { SessionRecord, Store } from "./store.js";

const DEFAULT_SESSION_TTL_MS = 60 * 60 * 1000;
const DEFAULT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

type SessionHistoryEntry = {
  query: string;
  retrievedIds: string[];
  createdAt: string;
};

type SessionState = {
  id: string;
  userId: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string | null;
  queryCount: number;
  history: SessionHistoryEntry[];
};

type CreateSessionConfig = {
  sessionId?: string;
  userId?: string;
};

type SessionServiceOptions = {
  store: Store;
  now?: () => Date;
  idGenerator?: () => string;
  sessionTtlMs?: number;
};

type SessionCleanupResult = {
  deletedSessions: number;
  deletedCacheEntries: number;
};

type EndSessionResult = {
  id: string;
  ended: boolean;
  invalidatedCacheEntries: number;
};

class SessionLifecycleError extends Error {
  public readonly code: "session-not-found" | "session-expired";

  public constructor(code: "session-not-found" | "session-expired", message: string) {
    super(message);
    this.code = code;
  }
}

function toIso(now: Date): string {
  return now.toISOString();
}

function toSessionState(record: SessionRecord, history: SessionHistoryEntry[]): SessionState {
  return {
    id: record.id,
    userId: record.userId,
    createdAt: record.createdAt,
    lastActiveAt: record.updatedAt,
    expiresAt: record.expiresAt,
    queryCount: record.queryCount,
    history
  };
}

class SessionService {
  private readonly store: Store;
  private readonly now: () => Date;
  private readonly idGenerator: () => string;
  private readonly sessionTtlMs: number;
  private readonly historyBySessionId = new Map<string, SessionHistoryEntry[]>();

  public constructor(options: SessionServiceOptions) {
    this.store = options.store;
    this.now = options.now ?? (() => new Date());
    this.idGenerator = options.idGenerator ?? uuidv4;
    this.sessionTtlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
  }

  public async createSession(config?: CreateSessionConfig): Promise<SessionState> {
    const now = this.now();
    const sessionId = config?.sessionId ?? this.idGenerator();
    const expiresAt = new Date(now.getTime() + this.sessionTtlMs).toISOString();
    const created = await this.store.sessions.create({
      id: sessionId,
      userId: config?.userId,
      expiresAt,
      queryCount: 0
    });

    const history: SessionHistoryEntry[] = [];
    this.historyBySessionId.set(created.id, history);
    return toSessionState(created, history);
  }

  public async getSession(id: string): Promise<SessionState> {
    const record = await this.store.sessions.getById(id);
    if (!record) {
      throw new SessionLifecycleError("session-not-found", `session-not-found: ${id}`);
    }

    if (record.expiresAt && Date.parse(record.expiresAt) <= this.now().getTime()) {
      await this.endSession(id);
      throw new SessionLifecycleError("session-expired", `session-expired: ${id}`);
    }

    return toSessionState(record, [...(this.historyBySessionId.get(id) ?? [])]);
  }

  public async updateSession(id: string, query: string, retrievedIds: string[]): Promise<SessionState> {
    const existing = await this.getSession(id);
    const now = this.now();
    const nextHistory: SessionHistoryEntry[] = [
      ...existing.history,
      {
        query,
        retrievedIds,
        createdAt: toIso(now)
      }
    ];

    const nextExpiry = new Date(now.getTime() + this.sessionTtlMs).toISOString();
    const updated = await this.store.sessions.update(id, {
      queryCount: existing.queryCount + 1,
      expiresAt: nextExpiry
    });

    if (!updated) {
      throw new SessionLifecycleError("session-not-found", `session-not-found: ${id}`);
    }

    this.historyBySessionId.set(id, nextHistory);
    return toSessionState(updated, nextHistory);
  }

  public async endSession(id: string): Promise<EndSessionResult> {
    const invalidatedCacheEntries = await this.store.filterCache.invalidate(id);
    const ended = await this.store.sessions.delete(id);
    this.historyBySessionId.delete(id);

    return {
      id,
      ended,
      invalidatedCacheEntries
    };
  }

  public async cleanExpiredSessions(): Promise<SessionCleanupResult> {
    const nowIso = toIso(this.now());
    const deletedSessions = await this.store.sessions.deleteExpired(nowIso);
    const deletedCacheEntries = await this.store.filterCache.deleteExpired(nowIso);

    for (const sessionId of this.historyBySessionId.keys()) {
      const record = await this.store.sessions.getById(sessionId);
      if (!record || (record.expiresAt !== null && Date.parse(record.expiresAt) <= Date.parse(nowIso))) {
        this.historyBySessionId.delete(sessionId);
      }
    }

    return {
      deletedSessions,
      deletedCacheEntries
    };
  }
}

function startSessionCleanup(
  sessionService: SessionService,
  intervalMs = DEFAULT_CLEANUP_INTERVAL_MS
): NodeJS.Timeout {
  const timer = setInterval(() => {
    void sessionService.cleanExpiredSessions();
  }, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return timer;
}

export {
  DEFAULT_CLEANUP_INTERVAL_MS,
  DEFAULT_SESSION_TTL_MS,
  SessionLifecycleError,
  SessionService,
  startSessionCleanup
};

export type {
  CreateSessionConfig,
  EndSessionResult,
  SessionCleanupResult,
  SessionHistoryEntry,
  SessionServiceOptions,
  SessionState
};