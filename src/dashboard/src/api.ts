import type {
  AnalyticsResponse,
  ContextResponse,
  DashboardConfig,
  DashboardStatus,
  SessionResponse
} from "./types";

const API_BASE = "/api";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getStatus(): Promise<DashboardStatus> {
  const response = await fetch(`${API_BASE}/status`);
  return parseResponse<DashboardStatus>(response);
}

export async function getContext(page = 1, perPage = 20, search = ""): Promise<ContextResponse> {
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage)
  });

  if (search) {
    params.set("search", search);
  }

  const response = await fetch(`${API_BASE}/context?${params.toString()}`);
  return parseResponse<ContextResponse>(response);
}

export async function deleteContext(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/context/${id}`, {
    method: "DELETE"
  });

  await parseResponse<void>(response);
}

export async function getSessions(): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE}/sessions`);
  return parseResponse<SessionResponse>(response);
}

export async function getConfig(): Promise<DashboardConfig> {
  const response = await fetch(`${API_BASE}/config`);
  return parseResponse<DashboardConfig>(response);
}

export async function updateConfig(payload: DashboardConfig): Promise<DashboardConfig> {
  const response = await fetch(`${API_BASE}/config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse<DashboardConfig>(response);
}

export async function getAnalytics(): Promise<AnalyticsResponse> {
  const response = await fetch(`${API_BASE}/analytics`);
  return parseResponse<AnalyticsResponse>(response);
}
