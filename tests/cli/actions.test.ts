import { describe, expect, it } from "vitest";
import {
  buildProjectConfigFromOptions,
  providerFactoryConfigFromProject
} from "../../src/cli/actions.js";

describe("CLI actions", () => {
  it("builds project config from quick options and global defaults", () => {
    const config = buildProjectConfigFromOptions(
      {
        name: "ghost-house",
        style: "靈異",
        assistStyle: "無限流",
        chapters: "12",
        chapterWordTarget: "2200",
        provider: undefined,
        model: undefined,
        temperature: undefined,
        auto: true,
        idea: "鬼樓探險"
      },
      { provider: "openai-compatible", model: "local-model", temperature: 0.6 }
    );

    expect(config.provider).toBe("openai-compatible");
    expect(config.model).toBe("local-model");
    expect(config.reviewMode).toBe("auto");
  });

  it("uses provider-specific API key environment variables", () => {
    const providerConfig = providerFactoryConfigFromProject(
      {
        name: "story",
        provider: "anthropic",
        model: "claude-test",
        temperature: 0.7,
        primaryStyle: "靈異",
        chapterCount: 10,
        chapterWordTarget: 2500,
        reviewMode: "gated",
        currentChapter: 0
      },
      { ANTHROPIC_API_KEY: "anthropic-key" }
    );

    expect(providerConfig.apiKey).toBe("anthropic-key");
  });
});
