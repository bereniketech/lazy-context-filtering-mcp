import { CircuitBreaker } from "./circuit-breaker.js";

type ScoreItemInput = {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
};

type ScoreItemOutput = {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
};

type JsonObject = Record<string, unknown>;

const DEFAULT_ENGINE_URL = "http://127.0.0.1:8100";
const DEFAULT_TIMEOUT_MS = 10_000;

export class EngineClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly breaker: CircuitBreaker;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_BASE_MS = 200;

  public constructor(baseUrl?: string, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.baseUrl = (baseUrl ?? process.env.PYTHON_ENGINE_URL ?? DEFAULT_ENGINE_URL).replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
    this.breaker = new CircuitBreaker();
  }

  public async score(
    query: string,
    items: ScoreItemInput[],
    topK = 5,
    sessionHistory?: string[]
  ): Promise<ScoreItemOutput[]> {
    const payload = {
      query,
      items,
      top_k: topK,
      session_history: sessionHistory
    };

    const response = await this.postJson<{ items?: ScoreItemOutput[] }>("/score", payload);
    return response.items ?? [];
  }

  public async summarize(text: string, maxLength = 200): Promise<string> {
    const payload = {
      text,
      max_length: maxLength
    };

    const response = await this.postJson<{ summary?: string }>("/summarize", payload);
    return typeof response.summary === "string" ? response.summary : "";
  }

  public async tokenize(text: string, modelFamily = "generic"): Promise<number> {
    const payload = {
      text,
      model_family: modelFamily
    };

    const response = await this.postJson<{ token_count?: number }>("/tokenize", payload);
    return typeof response.token_count === "number" ? response.token_count : 0;
  }

  private async postJson<T>(path: string, body: JsonObject): Promise<T> {
    if (this.breaker.isOpen()) {
      throw new Error(`Engine circuit breaker is OPEN for ${path} — requests are suspended`);
    }

    const url = `${this.baseUrl}${path}`;
    let lastError: unknown;

    for (let attempt = 0; attempt < EngineClient.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeoutMs)
        });

        if (!response.ok) {
          const bodyText = await response.text();
          throw new Error(`Engine request failed (${response.status}) for ${path}: ${bodyText}`);
        }

        this.breaker.recordSuccess();
        return (await response.json()) as T;
      } catch (err: unknown) {
        lastError = err;
        this.breaker.recordFailure();

        const isLastAttempt = attempt === EngineClient.MAX_RETRIES - 1;
        if (isLastAttempt) {
          break;
        }

        const delayMs = EngineClient.RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }
}

export type { ScoreItemInput, ScoreItemOutput };
