import { createHash } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import type { Store } from "../store.js";
import { filterResultCache, type FilterResultCache } from "../cache.js";

export const MAX_CONTEXT_BYTES = 100 * 1024;
const MAX_CONTEXT_SIZE_LABEL = "100KB";
const DEFAULT_SOURCE = "mcp";

type RegisterContextInput = {
  content: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

type RegisterContextResult = {
  id: string;
  contentHash: string;
  summary: string;
  tokenCount: number;
};

type RegisterEngineClient = {
  summarize(text: string): Promise<string>;
  tokenize(text: string): Promise<number>;
};

type RegisterContextDeps = {
  store: Store;
  engineClient: RegisterEngineClient;
  idGenerator?: () => string;
  cacheManager?: FilterResultCache;
};

type RegisterContextParams = RegisterContextDeps & {
  input: RegisterContextInput;
};

function computeContentHash(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function getExistingSummary(metadata: Record<string, unknown>): string {
  const summary = metadata.summary;
  return typeof summary === "string" ? summary : "";
}

function ensureValidContentSize(content: string): void {
  const contentBytes = Buffer.byteLength(content, "utf8");
  if (contentBytes > MAX_CONTEXT_BYTES) {
    throw new Error(`Context content exceeds ${MAX_CONTEXT_SIZE_LABEL} (${MAX_CONTEXT_BYTES} bytes)`);
  }
}

export async function registerContext(params: RegisterContextParams): Promise<RegisterContextResult> {
  const { store, engineClient, idGenerator, input } = params;
  const cacheManager = params.cacheManager ?? filterResultCache;
  const normalizedContent = input.content.trim();
  if (normalizedContent.length === 0) {
    throw new Error("Context content must be non-empty");
  }

  ensureValidContentSize(normalizedContent);
  const contentHash = computeContentHash(normalizedContent);

  const existing = await store.contextItems.getByHash(contentHash);
  if (existing) {
    return {
      id: existing.id,
      contentHash: existing.contentHash,
      summary: getExistingSummary(existing.metadata),
      tokenCount: existing.tokenCount
    };
  }

  const summary = await engineClient.summarize(normalizedContent);
  const tokenCount = await engineClient.tokenize(normalizedContent);
  const id = idGenerator ? idGenerator() : uuidv4();

  await store.contextItems.create({
    id,
    content: normalizedContent,
    source: input.source ?? DEFAULT_SOURCE,
    contentHash,
    tokenCount,
    metadata: {
      ...(input.metadata ?? {}),
      summary
    }
  });

  cacheManager.clear();

  return {
    id,
    contentHash,
    summary,
    tokenCount
  };
}

export type {
  RegisterContextDeps,
  RegisterContextInput,
  RegisterContextParams,
  RegisterContextResult,
  RegisterEngineClient
};