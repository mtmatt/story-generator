import { mkdir, writeFile } from "node:fs/promises";
import { ProjectConfig } from "../domain/types.js";
import { ProjectConfigSchema } from "../domain/schemas.js";
import { writeJsonFile } from "../fs/json.js";
import { buildStoryProjectPaths } from "./paths.js";

export async function createStoryProject(root: string, config: ProjectConfig): Promise<void> {
  const parsed = ProjectConfigSchema.parse(config);
  const paths = buildStoryProjectPaths(root);

  await mkdir(paths.volumesDir, { recursive: true });
  await mkdir(paths.chaptersDir, { recursive: true });
  await mkdir(paths.stateDir, { recursive: true });
  await mkdir(paths.checkpointsDir, { recursive: true });
  await mkdir(paths.versionsDir, { recursive: true });

  await writeJsonFile(paths.projectJson, parsed);
  await writeFile(paths.storyBible, "# Story Bible\n\n", "utf8");
  await writeFile(paths.outline, "# Whole-Book Outline\n\n", "utf8");
  await writeJsonFile(paths.stateJson, { currentVolume: 0, currentChapter: 0, stateVersion: 1 });
  await writeJsonFile(paths.charactersJson, []);
  await writeJsonFile(paths.foreshadowingJson, []);
  await writeJsonFile(paths.continuityJson, {
    timeline: [],
    locations: [],
    importantObjects: [],
    contradictions: []
  });
  await writeJsonFile(paths.factsJson, []);
}
