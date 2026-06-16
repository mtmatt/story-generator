import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { loadMergedConfig } from "../../src/config/loadConfig.js";

describe("loadMergedConfig", () => {
  it("lets project config override global config", async () => {
    const root = await mkdtemp(join(tmpdir(), "config-"));
    const globalPath = join(root, "global.json");
    const projectPath = join(root, "project.json");

    await writeFile(globalPath, JSON.stringify({ provider: "openai", model: "gpt-global", temperature: 0.4 }), "utf8");
    await writeFile(
      projectPath,
      JSON.stringify({
        name: "story",
        provider: "gemini",
        model: "gemini-project",
        temperature: 0.9,
        primaryStyle: "靈異",
        chapterCount: 10,
        chapterWordTarget: 2500,
        reviewMode: "gated",
        currentChapter: 0
      }),
      "utf8"
    );

    const merged = await loadMergedConfig({ globalConfigPath: globalPath, projectConfigPath: projectPath });

    expect(merged.provider).toBe("gemini");
    expect(merged.model).toBe("gemini-project");
    expect(merged.temperature).toBe(0.9);
  });
});
