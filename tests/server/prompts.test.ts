import { describe, it, expect } from "vitest";
import { filterContextPrompt } from "../../src/server/prompts/filter-prompt.js";
import { summarizeAndFilterPrompt } from "../../src/server/prompts/summarize-prompt.js";

describe("filterContextPrompt", () => {
  it("returns message with query embedded in text", () => {
    const result = filterContextPrompt("test query");
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content.text).toContain("test query");
    expect(result.messages[0].content.text).toContain("filter_context");
  });

  it("includes tokenBudget when provided", () => {
    const result = filterContextPrompt("q", 2000);
    expect(result.messages[0].content.text).toContain("2000");
  });

  it("omits tokenBudget key when not provided", () => {
    const result = filterContextPrompt("q");
    expect(result.messages[0].content.text).not.toContain("tokenBudget");
  });
});

describe("summarizeAndFilterPrompt", () => {
  it("returns two-step message containing query and summarize instruction", () => {
    const result = summarizeAndFilterPrompt("my query");
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content.text).toContain("my query");
    expect(result.messages[0].content.text).toContain("Step 1");
    expect(result.messages[0].content.text).toContain("Step 2");
  });
});
