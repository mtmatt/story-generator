import { ProjectConfig } from "../domain/types.js";
import { ProjectConfigSchema } from "../domain/schemas.js";
import { readJsonFile, writeJsonFile } from "../fs/json.js";
import { buildStoryProjectPaths } from "./paths.js";

export async function readProjectConfig(root: string): Promise<ProjectConfig> {
  return readJsonFile(buildStoryProjectPaths(root).projectJson, ProjectConfigSchema);
}

export async function writeProjectConfig(root: string, config: ProjectConfig): Promise<void> {
  await writeJsonFile(buildStoryProjectPaths(root).projectJson, ProjectConfigSchema.parse(config));
}
