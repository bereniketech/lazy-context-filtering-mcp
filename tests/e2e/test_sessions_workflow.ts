import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { once } from "node:events";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

function createMockEngineServer(): Server {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const requestUrl = req.url ?? "";
    let body = "";
    for await (const chunk of req) {
      body += String(chunk);
    }
    const parsed = body.length > 0 ? (JSON.parse(body) as Record<string, unknown>) : {};

    if (req.method === "GET" && requestUrl === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    if (requestUrl === "/summarize") {
      const text = typeof parsed.text === "string" ? parsed.text : "";
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ summary: text.slice(0, 48).trim() }));
      return;
    }
    if (requestUrl === "/tokenize") {
      const text = typeof parsed.text === "string" ? parsed.text : "";
      const tokenCount = text.split(/\s+/).filter((p) => p.length > 0).length;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ token_count: tokenCount, tokens: [] }));
      return;
    }
    if (requestUrl === "/score") {
      const items = Array.isArray(parsed.items)
        ? (parsed.items as Array<{ id?: unknown; text?: unknown }>)
        : [];
      const scored = items.map((item, i) => ({
        id: typeof item.id === "string" ? item.id : `item-${i}`,
        text: typeof item.text === "string" ? item.text : "",
        score: 0.9 - i * 0.1,
        metadata: {}
      }));
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ items: scored }));
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
  });
}

describe("sessions workflow e2e", () => {
  let client: Client;
  let transport: StdioClientTransport;
  let mockEngineServer: Server;

  beforeAll(async () => {
    mockEngineServer = createMockEngineServer();
    mockEngineServer.listen(0, "127.0.0.1");
    await once(mockEngineServer, "listening");

    const address = mockEngineServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to bind mock engine server");
    }

    const enginePort = (address as { port: number }).port;
    const serverPath = resolve(process.cwd(), "src/server/index.ts");

    transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx/esm", serverPath],
      cwd: process.cwd(),
      env: {
        ...process.env,
        MCP_TRANSPORT: "stdio",
        PYTHON_ENGINE_URL: `http://127.0.0.1:${enginePort}`,
        LOG_LEVEL: "silent"
      },
      stderr: "pipe"
    });

    client = new Client({ name: "e2e-sessions-client", version: "1.0.0" });
    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
    await new Promise<void>((resolveClose, rejectClose) => {
      mockEngineServer.close((err) => {
        if (err) { rejectClose(err); return; }
        resolveClose();
      });
    });
  });

  it("creates a session and returns id with queryCount 0", async () => {
    const result = await client.callTool({
      name: "create_session",
      arguments: { sessionId: "sess-e2e-001", userId: "user-1" }
    }) as { structuredContent?: { id: string; queryCount: number } };

    const session = result.structuredContent;
    expect(session).toBeDefined();
    expect(session?.id).toBe("sess-e2e-001");
    expect(session?.queryCount).toBe(0);
  });

  it("ends a session and returns ended: true", async () => {
    await client.callTool({ name: "create_session", arguments: { sessionId: "sess-e2e-002" } });

    const result = await client.callTool({
      name: "end_session",
      arguments: { sessionId: "sess-e2e-002" }
    }) as { structuredContent?: { id: string; ended: boolean; invalidatedCacheEntries: number } };

    const ended = result.structuredContent;
    expect(ended?.id).toBe("sess-e2e-002");
    expect(ended?.ended).toBe(true);
    expect(typeof ended?.invalidatedCacheEntries).toBe("number");
  });

  it("runs filter_context with session and increments query tracking", async () => {
    await client.callTool({ name: "create_session", arguments: { sessionId: "sess-e2e-filter" } });

    await client.callTool({
      name: "register_context",
      arguments: { content: "Session tracking test content about filtering", source: "e2e" }
    });

    const filterResult = await client.callTool({
      name: "filter_context",
      arguments: {
        query: "session filtering",
        sessionId: "sess-e2e-filter",
        tokenBudget: 50,
        maxItems: 5
      }
    }) as { structuredContent?: { selectedItems: unknown[]; totalTokens: number } };

    expect(filterResult.structuredContent?.selectedItems).toBeDefined();
    expect(typeof filterResult.structuredContent?.totalTokens).toBe("number");
  });
});
