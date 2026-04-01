import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { once } from "node:events";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

type ToolResult<T> = {
  structuredContent?: T;
  content?: Array<{ type?: string; text?: string }>;
};

type ContextSeed = {
  content: string;
  source: string;
  metadata: Record<string, unknown>;
};

type RegisteredContext = {
  id: string;
  summary: string;
  tokenCount: number;
};

type SessionState = {
  id: string;
  queryCount: number;
};

type FilterResponse = {
  selectedItems: Array<{ id: string; tokenCount: number }>;
  totalTokens: number;
  tokenBudget?: number;
  cached?: boolean;
};

type ListResponse = {
  total: number;
  items: Array<{ id: string; summary: string; tokenCount: number; metadata: Record<string, unknown> }>;
};

type GetResponse = {
  items: Array<{ id: string; content: string; metadata: Record<string, unknown> }>;
};

type EndSessionResponse = {
  id: string;
  ended: boolean;
  invalidatedCacheEntries: number;
};

function createMockEngineServer(): Server {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const requestUrl = req.url ?? "";

    if (req.method === "GET" && requestUrl === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (req.method !== "POST") {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not_found" }));
      return;
    }

    let body = "";
    for await (const chunk of req) {
      body += String(chunk);
    }

    const parsed = body.length > 0 ? (JSON.parse(body) as Record<string, unknown>) : {};

    if (requestUrl === "/summarize") {
      const text = typeof parsed.text === "string" ? parsed.text : "";
      const summary = text.slice(0, 48).trim() || text;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ summary }));
      return;
    }

    if (requestUrl === "/tokenize") {
      const text = typeof parsed.text === "string" ? parsed.text : "";
      const tokenCount = text.split(/\s+/).filter((part) => part.length > 0).length;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ token_count: tokenCount, tokens: [] }));
      return;
    }

    if (requestUrl === "/score") {
      const query = typeof parsed.query === "string" ? parsed.query.toLowerCase() : "";
      const items = Array.isArray(parsed.items)
        ? (parsed.items as Array<{ id?: unknown; text?: unknown; metadata?: unknown }>)
        : [];

      const scored = items
        .map((item, index) => {
          const id = typeof item.id === "string" ? item.id : `item-${index}`;
          const text = typeof item.text === "string" ? item.text : "";
          const lowerText = text.toLowerCase();
          const scoreBase = lowerText.includes(query) ? 0.95 : 0.35;
          const scoreBoost = Math.max(0, 0.3 - index * 0.05);

          return {
            id,
            text,
            score: Math.min(1, scoreBase + scoreBoost),
            metadata: (item.metadata as Record<string, unknown> | undefined) ?? {}
          };
        })
        .sort((a, b) => b.score - a.score);

      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ items: scored }));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
  });
}

async function callTool<T>(client: Client, name: string, argumentsPayload: Record<string, unknown>): Promise<T> {
  const result = (await client.callTool({
    name,
    arguments: argumentsPayload
  })) as ToolResult<T>;

  if (result.structuredContent) {
    return result.structuredContent;
  }

  const textContent = result.content?.find((entry) => entry.type === "text")?.text;
  if (!textContent) {
    throw new Error(`No structured content returned for tool: ${name}`);
  }

  return JSON.parse(textContent) as T;
}

describe("full workflow e2e", () => {
  let client: Client;
  let transport: StdioClientTransport;
  let mockEngineServer: Server;
  let enginePort = 0;

  beforeAll(async () => {
    mockEngineServer = createMockEngineServer();
    mockEngineServer.listen(0, "127.0.0.1");
    await once(mockEngineServer, "listening");

    const address = mockEngineServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to bind mock engine server");
    }

    enginePort = address.port;

    const serverPath = resolve(process.cwd(), "src/server/index.ts");

    transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx/esm", serverPath],
      cwd: process.cwd(),
      env: {
        ...process.env,
        MCP_TRANSPORT: "stdio",
        PYTHON_ENGINE_URL: `http://127.0.0.1:${enginePort}`
      },
      stderr: "pipe"
    });

    client = new Client({
      name: "e2e-client",
      version: "1.0.0"
    });

    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
    await new Promise<void>((resolveClose, rejectClose) => {
      mockEngineServer.close((error) => {
        if (error) {
          rejectClose(error);
          return;
        }

        resolveClose();
      });
    });
  });

  it("runs register -> filter -> lazy load -> session management", async () => {
    const seedData: ContextSeed[] = [
      {
        content: "Alpha backend retrieval uses caching and ranking for quick answers.",
        source: "e2e",
        metadata: { tags: ["backend", "cache"] }
      },
      {
        content: "Beta frontend dashboard renders summaries while deferring full payload fetch.",
        source: "e2e",
        metadata: { tags: ["frontend", "dashboard"] }
      },
      {
        content: "Gamma infra service exposes health checks and container-safe startup patterns.",
        source: "e2e",
        metadata: { tags: ["infra", "ops"] }
      },
      {
        content: "Delta session lifecycle extends expiry and tracks historical retrieved identifiers.",
        source: "e2e",
        metadata: { tags: ["backend", "session"] }
      },
      {
        content: "Epsilon retrieval strategy balances relevance score with strict token budget constraints.",
        source: "e2e",
        metadata: { tags: ["retrieval", "ranking"] }
      }
    ];

    const registered: RegisteredContext[] = [];
    for (const item of seedData) {
      const result = await callTool<RegisteredContext>(client, "register_context", item);
      registered.push(result);
    }

    expect(registered).toHaveLength(5);
    expect(registered.every((item) => item.id.length > 0)).toBe(true);

    const createdSession = await callTool<SessionState>(client, "create_session", {
      sessionId: "e2e-session",
      userId: "test-user"
    });

    expect(createdSession.id).toBe("e2e-session");
    expect(createdSession.queryCount).toBe(0);

    const firstFilter = await callTool<FilterResponse>(client, "filter_context", {
      query: "backend retrieval cache",
      sessionId: "e2e-session",
      tokenBudget: 18,
      maxItems: 5
    });

    expect(firstFilter.selectedItems.length).toBeGreaterThan(0);
    expect(firstFilter.totalTokens).toBeLessThanOrEqual(18);
    expect(firstFilter.cached).toBeUndefined();

    const listed = await callTool<ListResponse>(client, "list_context", {
      limit: 10,
      offset: 0
    });

    expect(listed.total).toBe(5);
    expect(listed.items).toHaveLength(5);
    for (const item of listed.items) {
      expect(item.summary.length).toBeGreaterThan(0);
      expect("content" in (item as unknown as Record<string, unknown>)).toBe(false);
    }

    const getIds = listed.items.slice(0, 2).map((item) => item.id);
    const fetched = await callTool<GetResponse>(client, "get_context", {
      ids: getIds
    });

    expect(fetched.items).toHaveLength(2);
    for (const item of fetched.items) {
      expect(item.content.length).toBeGreaterThan(0);
      expect(typeof item.metadata).toBe("object");
    }

    const secondFilter = await callTool<FilterResponse>(client, "filter_context", {
      query: "backend retrieval cache",
      sessionId: "e2e-session",
      tokenBudget: 18,
      maxItems: 5
    });

    expect(secondFilter.cached).toBe(true);

    const ended = await callTool<EndSessionResponse>(client, "end_session", {
      sessionId: "e2e-session"
    });

    expect(ended.id).toBe("e2e-session");
    expect(ended.ended).toBe(true);
    expect(ended.invalidatedCacheEntries).toBeGreaterThanOrEqual(0);
  });
});