import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createStoryProject } from "../../src/project/createProject.js";

describe("createStoryProject", () => {
  it("creates the story project layout and project config", async () => {
    const root = await mkdtemp(join(tmpdir(), "story-weaver-"));
    const projectRoot = join(root, "my-story");

    await createStoryProject(projectRoot, {
      name: "my-story",
      provider: "openai-compatible",
      model: "local-model",
      temperature: 0.8,
      primaryStyle: "靈異",
      assistStyle: "無限流",
      chapterCount: 12,
      chapterWordTarget: 2500,
      reviewMode: "gated",
      currentChapter: 0
    });

    const projectJson = JSON.parse(await readFile(join(projectRoot, "project.json"), "utf8"));
    expect(projectJson.primaryStyle).toBe("靈異");
    expect(await readFile(join(projectRoot, "story-bible.md"), "utf8")).toContain("# Story Bible");
  });
});
