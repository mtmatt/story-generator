import { describe, expect, it } from "vitest";
import { createLlmProvider } from "../../src/llm/factory.js";

describe("createLlmProvider", () => {
  it("creates a mock provider when requested", () => {
    const provider = createLlmProvider({ provider: "mock", responses: ["ok"] });
    expect(provider.name).toBe("mock");
  });

  it("reports missing OpenAI API key", () => {
    expect(() =>
      createLlmProvider({ provider: "openai", apiKey: "", baseUrl: undefined })
    ).toThrow("Missing OPENAI_API_KEY");
  });
});
