import { describe, expect, it } from "vitest";
import { MockLlmProvider } from "../../src/llm/mockProvider.js";
import { StyleCheckSchema } from "../../src/domain/schemas.js";

describe("MockLlmProvider", () => {
  it("returns queued text responses", async () => {
    const provider = new MockLlmProvider(["first"]);
    const result = await provider.generateText({ prompt: "write", model: "mock", temperature: 0.7 });
    expect(result.text).toBe("first");
  });

  it("parses queued JSON responses", async () => {
    const provider = new MockLlmProvider([
      JSON.stringify({ pass: true, issues: [], rewriteInstructions: [] })
    ]);
    const result = await provider.generateJson({
      prompt: "check",
      model: "mock",
      temperature: 0.7,
      schema: StyleCheckSchema
    });
    expect(result.pass).toBe(true);
  });
});
