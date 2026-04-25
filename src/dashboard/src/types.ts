export type EngineHealth = "healthy" | "unavailable";

export type DashboardStatus = {
  uptime: number;
  contextCount: number;
  activeSessions: number;
  engineHealth: EngineHealth;
};

export type ContextItem = {
  id: string;
  content: string;
  source: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ContextResponse = {
  items: ContextItem[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type SessionRecord = {
  id: string;
  userId: string | null;
  queryCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
};

export type SessionResponse = {
  sessions: SessionRecord[];
};

export { type DashboardConfig } from "../../shared/config-schema";

export type AnalyticsSession = {
  sessionId: string;
  queryCount: number;
  tokenUsage: number;
  cacheEntries: number;
};

export type AnalyticsResponse = {
  sessions: AnalyticsSession[];
  totals: {
    tokenUsage: number;
    cacheEntries: number;
    sessionCount: number;
  };
};
