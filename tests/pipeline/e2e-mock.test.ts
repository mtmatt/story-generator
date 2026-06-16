import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createStoryProject } from "../../src/project/createProject.js";
import { loadStyleSelection } from "../../src/styles/loadStyles.js";
import { MockLlmProvider } from "../../src/llm/mockProvider.js";
import { generateStoryBible, generateWholeBookOutline } from "../../src/pipeline/planning.js";
import { writeChapter } from "../../src/pipeline/chapter.js";
import { readCheckpoint } from "../../src/state/checkpoints.js";

describe("mock story workflow", () => {
  it("runs quick-style planning and one chapter without real LLM calls", async () => {
    const root = await mkdtemp(join(tmpdir(), "e2e-"));
    const stylesDir = join(root, "styles");
    const storyRoot = join(root, "story");
    await mkdir(stylesDir);
    await writeFile(join(stylesDir, "靈異.md"), "把鬼寫回人。", "utf8");
    await writeFile(join(stylesDir, "無限流.md"), "規則局和倒計時。", "utf8");

    await createStoryProject(storyRoot, {
      name: "story",
      provider: "openai-compatible",
      model: "mock",
      temperature: 0.7,
      primaryStyle: "靈異",
      assistStyle: "無限流",
      chapterCount: 3,
      chapterWordTarget: 2000,
      reviewMode: "auto",
      currentChapter: 0
    });

    const styles = await loadStyleSelection(stylesDir, "靈異", "無限流");
    const provider = new MockLlmProvider([
      "# Story Bible\n\n鬼樓與住戶。",
      "# Whole-Book Outline\n\n三章。",
      "第一章正文初稿",
      JSON.stringify({ pass: true, issues: [], rewriteInstructions: [] })
    ]);

    await generateStoryBible({
      root: storyRoot,
      provider,
      model: "mock",
      temperature: 0.7,
      idea: "鬼樓",
      primaryStyle: styles.primary.content,
      assistStyle: styles.assist?.content
    });
    await generateWholeBookOutline({
      root: storyRoot,
      provider,
      model: "mock",
      temperature: 0.7,
      primaryStyle: styles.primary.content,
      assistStyle: styles.assist?.content
    });

    await writeFile(join(storyRoot, "chapters", "chapter-001.outline.md"), "第一章：住戶醒來。", "utf8");
    await writeChapter({
      root: storyRoot,
      chapter: 1,
      provider,
      providerName: "openai-compatible",
      model: "mock",
      temperature: 0.7,
      primaryStyle: styles.primary.content,
      assistStyle: styles.assist?.content
    });

    expect(await readFile(join(storyRoot, "chapters", "chapter-001.md"), "utf8")).toBe("第一章正文初稿");
    expect((await readCheckpoint(storyRoot, 1)).accepted).toBe(true);
  });
});
