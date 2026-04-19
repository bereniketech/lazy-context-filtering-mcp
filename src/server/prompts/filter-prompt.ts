export function filterContextPrompt(
  query: string,
  tokenBudget?: number
): { messages: Array<{ role: "user" | "assistant"; content: { type: "text"; text: string } }> } {
  const args: Record<string, unknown> = { query };
  if (tokenBudget !== undefined) {
    args.tokenBudget = tokenBudget;
  }
  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Use the filter_context tool with these arguments: ${JSON.stringify(args)}`
        }
      }
    ]
  };
}
