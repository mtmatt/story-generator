import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { MockLlmProvider } from "../../src/llm/mockProvider.js";
import { writeChapter } from "../../src/pipeline/chapter.js";
import { createStoryProject } from "../../src/project/createProject.js";
import { readCheckpoint } from "../../src/state/checkpoints.js";

describe("writeChapter", () => {
  it("writes draft, review, rewrite, and checkpoint files", async () => {
    const root = await mkdtemp(join(tmpdir(), "chapter-"));
    await createStoryProject(root, {
      name: "story",
      provider: "openai-compatible",
      model: "mock",
      temperature: 0.7,
      primaryStyle: "靈異",
      assistStyle: "無限流",
      chapterCount: 10,
      chapterWordTarget: 2500,
      reviewMode: "auto",
      currentChapter: 0
    });
    await writeFile(join(root, "chapters", "chapter-001.outline.md"), "第一章：醒來就在鬼樓。", "utf8");

    const provider = new MockLlmProvider([
      "初稿正文",
      JSON.stringify({
        pass: false,
        issues: [{ type: "style_mismatch", severity: "high", evidence: "太慢", suggestion: "直接進異常" }],
        rewriteInstructions: ["直接進異常"]
      }),
      "改寫正文"
    ]);

    await writeChapter({
      root,
      chapter: 1,
      provider,
      providerName: "openai-compatible",
      model: "mock",
      temperature: 0.7,
      primaryStyle: "主風格",
      assistStyle: "輔助風格",
      chapterWordTarget: 2500
    });

    expect(await readFile(join(root, "chapters", "chapter-001.md"), "utf8")).toBe("改寫正文");
    expect(await readFile(join(root, "chapters", "chapter-001.review.md"), "utf8")).toContain("style_mismatch");
    expect((await readCheckpoint(root, 1)).accepted).toBe(true);
  });
});
