export function summarizeAndFilterPrompt(
  query: string
): { messages: Array<{ role: "user" | "assistant"; content: { type: "text"; text: string } }> } {
  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Step 1: Call filter_context with query="${query}" to retrieve the most relevant context items within the default token budget.\nStep 2: Summarize each returned item into 1-2 sentences, preserving the key facts needed to answer the query.`
        }
      }
    ]
  };
}
