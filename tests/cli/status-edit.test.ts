import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createStoryProject } from "../../src/project/createProject.js";
import { writeCharacters } from "../../src/state/stateStore.js";
import { readCharacters } from "../../src/state/stateStore.js";

describe("status and edit support", () => {
  it("state store supports character edits used by CLI", async () => {
    const root = await mkdtemp(join(tmpdir(), "edit-"));
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
        status: "injured",
        secrets: [],
        relationships: [],
        recentChapters: [1]
      }
    ]);

    const characters = await readCharacters(root);
    characters[0].status = "alive";
    await writeCharacters(root, characters);

    expect((await readCharacters(root))[0].status).toBe("alive");
  });
});
