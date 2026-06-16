import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createStoryProject } from "../../src/project/createProject.js";
import { readCharacters, writeCharacters } from "../../src/state/stateStore.js";
import { readCheckpoint, writeCheckpoint } from "../../src/state/checkpoints.js";

describe("state store", () => {
  it("reads and writes characters", async () => {
    const root = await mkdtemp(join(tmpdir(), "state-"));
    await createStoryProject(root, {
      name: "story",
      provider: "openai",
      model: "gpt-test",
      temperature: 0.7,
      primaryStyle: "靈異",
      chapterCount: 10,
      chapterWordTarget: 2500,
      reviewMode: "gated",
      currentChapter: 0
    });

    await writeCharacters(root, [
      {
        id: "char-main",
        name: "林缺",
        role: "protagonist",
        status: "alive",
        secrets: [],
        relationships: [],
        recentChapters: [1]
      }
    ]);

    expect((await readCharacters(root))[0].name).toBe("林缺");
  });

  it("writes and reads a chapter checkpoint", async () => {
    const root = await mkdtemp(join(tmpdir(), "checkpoint-"));
    await createStoryProject(root, {
      name: "story",
      provider: "openai",
      model: "gpt-test",
      temperature: 0.7,
      primaryStyle: "靈異",
      chapterCount: 10,
      chapterWordTarget: 2500,
      reviewMode: "gated",
      currentChapter: 0
    });

    await writeCheckpoint(root, {
      chapter: 1,
      outlinePath: "chapters/chapter-001.outline.md",
      draftPath: "chapters/chapter-001.md",
      provider: "openai",
      model: "gpt-test",
      temperature: 0.7,
      accepted: true
    });

    expect((await readCheckpoint(root, 1)).accepted).toBe(true);
  });
});
