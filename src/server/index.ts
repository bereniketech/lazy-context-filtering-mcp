import express from "express";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

export const SERVER_NAME = "lazy-context-filtering-mcp";
export const SERVER_VERSION = "0.1.0";
export const MCP_TOOL_NAMES = [
  "register_context",
  "list_context",
  "get_context",
  "filter_context",
  "create_session",
  "end_session"
] as const;

type SupportedTransport = "stdio" | "sse";

const registerToolSchema = {
  contextId: z.string().min(1),
  content: z.string().min(1),
  source: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional()
};

const listToolSchema = {
  sessionId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional()
};

const getToolSchema = {
  contextId: z.string().min(1)
};

const filterToolSchema = {
  query: z.string().min(1),
  sessionId: z.string().min(1),
  maxItems: z.number().int().min(1).max(100).optional(),
  maxTokens: z.number().int().min(1).optional()
};

const createSessionToolSchema = {
  sessionId: z.string().min(1).optional(),
  userId: z.string().min(1).optional()
};

const endSessionToolSchema = {
  sessionId: z.string().min(1)
};

function placeholderContent(toolName: string): { type: "text"; text: string }[] {
  return [
    {
      type: "text",
      text: `${toolName} stub executed`
    }
  ];
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION
  });

  server.registerTool(
    "register_context",
    {
      description: "Register context content for later filtering.",
      inputSchema: registerToolSchema
    },
    async () => ({
      content: placeholderContent("register_context")
    })
  );

  server.registerTool(
    "list_context",
    {
      description: "List available context records.",
      inputSchema: listToolSchema
    },
    async () => ({
      content: placeholderContent("list_context")
    })
  );

  server.registerTool(
    "get_context",
    {
      description: "Get a context record by ID.",
      inputSchema: getToolSchema
    },
    async () => ({
      content: placeholderContent("get_context")
    })
  );

  server.registerTool(
    "filter_context",
    {
      description: "Filter context for a query and token budget.",
      inputSchema: filterToolSchema
    },
    async () => ({
      content: placeholderContent("filter_context")
    })
  );

  server.registerTool(
    "create_session",
    {
      description: "Create a lazy context filtering session.",
      inputSchema: createSessionToolSchema
    },
    async () => ({
      content: placeholderContent("create_session")
    })
  );

  server.registerTool(
    "end_session",
    {
      description: "End an active lazy context filtering session.",
      inputSchema: endSessionToolSchema
    },
    async () => ({
      content: placeholderContent("end_session")
    })
  );

  return server;
}

function resolveTransport(envValue: string | undefined): SupportedTransport {
  if (envValue?.toLowerCase() === "sse") {
    return "sse";
  }

  return "stdio";
}

export async function startStdioServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export async function startSseServer(): Promise<void> {
  const app = express();
  app.use(express.json());

  const transports: Record<string, SSEServerTransport> = {};
  const port = Number(process.env.PORT ?? 3000);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/mcp", async (_req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    const sessionId = transport.sessionId;
    transports[sessionId] = transport;

    transport.onclose = () => {
      delete transports[sessionId];
    };

    const server = createMcpServer();
    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const rawSessionId = req.query.sessionId;
    const sessionId = typeof rawSessionId === "string" ? rawSessionId : undefined;

    if (!sessionId) {
      res.status(400).send("Missing sessionId query parameter");
      return;
    }

    const transport = transports[sessionId];
    if (!transport) {
      res.status(404).send("Session not found");
      return;
    }

    await transport.handlePostMessage(req, res, req.body);
  });

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, () => resolve());
    server.on("error", reject);
  });
}

export async function startServerFromEnv(): Promise<void> {
  const transport = resolveTransport(process.env.MCP_TRANSPORT);
  if (transport === "sse") {
    await startSseServer();
    return;
  }

  await startStdioServer();
}

function isMainModule(): boolean {
  const entryFile = process.argv[1];
  if (!entryFile) {
    return false;
  }

  return import.meta.url === pathToFileURL(entryFile).href;
}

if (isMainModule()) {
  startServerFromEnv().catch((error: unknown) => {
    process.stderr.write(`Failed to start MCP server: ${String(error)}\n`);
    process.exit(1);
  });
}
