import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ErrorCode, ResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MCP_TOOL_NAMES, SERVER_NAME } from "../../src/server/index.js";

describe("MCP stdio server", () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    const serverPath = resolve(process.cwd(), "src/server/index.ts");

    transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx/esm", serverPath],
      cwd: process.cwd(),
      env: {
        ...process.env,
        MCP_TRANSPORT: "stdio"
      },
      stderr: "pipe"
    });

    client = new Client({
      name: "test-client",
      version: "1.0.0"
    });

    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
  });

  it("connects using stdio transport", () => {
    expect(transport.pid).not.toBeNull();
  });

  it("completes initialize handshake", () => {
    expect(client.getServerVersion()).toBeDefined();
    expect(client.getServerVersion()?.name).toBe(SERVER_NAME);
  });

  it("lists all six tools with object schemas", async () => {
    const listedTools = await client.listTools();
    const names = listedTools.tools.map((tool) => tool.name).sort();

    expect(names).toEqual([...MCP_TOOL_NAMES].sort());
    expect(listedTools.tools).toHaveLength(6);

    for (const tool of listedTools.tools) {
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("returns MCP method-not-found for malformed request", async () => {
    const malformedRequest = {
      method: "tools/unknown_method",
      params: {}
    };

    await expect(
      client.request(malformedRequest, ResultSchema, { timeout: 5_000 })
    ).rejects.toMatchObject({
      code: ErrorCode.MethodNotFound
    });
  });
});
