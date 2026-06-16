import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { MockLlmProvider } from "../../src/llm/mockProvider.js";
import { createStoryProject } from "../../src/project/createProject.js";
import {
  generateChapterOutlines,
  generateStoryBible,
  generateVolumeOutlines,
  generateWholeBookOutline
} from "../../src/pipeline/planning.js";

describe("planning pipeline", () => {
  it("writes story bible and outline markdown", async () => {
    const root = await mkdtemp(join(tmpdir(), "planning-"));
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

    const provider = new MockLlmProvider([
      "# Story Bible\n\n主角和鬼樓。",
      "# Whole-Book Outline\n\n十章。",
      "# Volume 1\n\n第一卷。",
      JSON.stringify([{ chapter: 1, title: "醒來", outline: "主角在鬼樓醒來。" }])
    ]);
    await generateStoryBible({ root, provider, idea: "鬼樓", primaryStyle: "主風格", assistStyle: "輔助風格", model: "mock", temperature: 0.7 });
    await generateWholeBookOutline({ root, provider, primaryStyle: "主風格", assistStyle: "輔助風格", model: "mock", temperature: 0.7 });
    await generateVolumeOutlines({ root, provider, model: "mock", temperature: 0.7, primaryStyle: "主風格", assistStyle: "輔助風格" });
    await generateChapterOutlines({ root, provider, model: "mock", temperature: 0.7, primaryStyle: "主風格", assistStyle: "輔助風格" });

    expect(await readFile(join(root, "story-bible.md"), "utf8")).toContain("鬼樓");
    expect(await readFile(join(root, "outline.md"), "utf8")).toContain("十章");
    expect(await readFile(join(root, "volumes", "volume-001.md"), "utf8")).toContain("第一卷");
    expect(await readFile(join(root, "chapters", "chapter-001.outline.md"), "utf8")).toContain("主角在鬼樓醒來");
  });
});
