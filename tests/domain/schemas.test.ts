import { describe, expect, it } from "vitest";
import {
  CharacterSchema,
  ProjectConfigSchema,
  StyleCheckSchema
} from "../../src/domain/schemas.js";

describe("domain schemas", () => {
  it("parses a project config with primary and assist styles", () => {
    const config = ProjectConfigSchema.parse({
      name: "old-apartment",
      provider: "openai-compatible",
      model: "local-model",
      temperature: 0.8,
      primaryStyle: "靈異",
      assistStyle: "無限流",
      chapterCount: 80,
      chapterWordTarget: 3000,
      reviewMode: "gated",
      currentChapter: 0
    });

    expect(config.primaryStyle).toBe("靈異");
    expect(config.assistStyle).toBe("無限流");
  });

  it("rejects invalid chapter counts", () => {
    expect(() =>
      ProjectConfigSchema.parse({
        name: "bad",
        provider: "openai",
        model: "gpt-test",
        temperature: 0.7,
        primaryStyle: "靈異",
        chapterCount: 0,
        chapterWordTarget: 3000,
        reviewMode: "gated",
        currentChapter: 0
      })
    ).toThrow();
  });

  it("parses style check issues", () => {
    const result = StyleCheckSchema.parse({
      pass: false,
      issues: [
        {
          type: "style_mismatch",
          severity: "high",
          evidence: "開頭鋪墊太久",
          suggestion: "第一段直接進入異常事件"
        }
      ],
      rewriteInstructions: ["刪掉背景介紹"]
    });

    expect(result.issues[0].severity).toBe("high");
  });

  it("parses a character state item", () => {
    const character = CharacterSchema.parse({
      id: "char-main",
      name: "林缺",
      role: "protagonist",
      status: "alive",
      secrets: ["記憶被重置過"],
      relationships: [{ targetId: "char-neighbor", description: "互相懷疑" }],
      recentChapters: [1, 2]
    });

    expect(character.relationships[0].targetId).toBe("char-neighbor");
  });
});
