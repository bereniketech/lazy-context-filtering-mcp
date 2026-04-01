import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { Store } from "../store.js";

type GetContextInput = {
  ids: string[];
};

type GetContextItem = {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
};

type GetContextResult = {
  items: GetContextItem[];
};

type GetContextParams = {
  store: Store;
  input: GetContextInput;
};

export async function getContext(params: GetContextParams): Promise<GetContextResult> {
  const { store, input } = params;
  const records = await store.contextItems.getByIds(input.ids);

  const recordsById = new Map(records.map((record) => [record.id, record]));
  const missingIds = input.ids.filter((id) => !recordsById.has(id));
  if (missingIds.length > 0) {
    throw new McpError(ErrorCode.InvalidParams, `Context IDs not found: ${missingIds.join(", ")}`, {
      statusCode: 404,
      missingIds
    });
  }

  return {
    items: input.ids.map((id) => {
      const record = recordsById.get(id);
      if (!record) {
        throw new McpError(ErrorCode.InvalidParams, `Context ID not found: ${id}`, {
          statusCode: 404,
          missingIds: [id]
        });
      }

      return {
        id: record.id,
        content: record.content,
        metadata: record.metadata
      };
    })
  };
}

export type { GetContextInput, GetContextItem, GetContextParams, GetContextResult };