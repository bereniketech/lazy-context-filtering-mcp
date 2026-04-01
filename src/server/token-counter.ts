type TokenizeEngineClient = {
  tokenize(text: string): Promise<number>;
};

export interface TokenCounter {
  countTokens(text: string): Promise<number>;
}

export function createTokenCounter(engineClient: TokenizeEngineClient): TokenCounter {
  return {
    async countTokens(text: string): Promise<number> {
      return engineClient.tokenize(text);
    }
  };
}

export type { TokenizeEngineClient };