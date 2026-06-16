import { access } from "node:fs/promises";
import { GlobalConfigSchema, ProjectConfigSchema } from "../domain/schemas.js";
import { GlobalConfig, ProjectConfig } from "../domain/types.js";
import { readJsonFile } from "../fs/json.js";

export interface LoadMergedConfigInput {
  globalConfigPath: string;
  projectConfigPath: string;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function loadGlobalConfig(path: string): Promise<GlobalConfig> {
  if (!(await pathExists(path))) {
    return {};
  }
  return readJsonFile(path, GlobalConfigSchema);
}

export async function loadMergedConfig(input: LoadMergedConfigInput): Promise<ProjectConfig & GlobalConfig> {
  const globalConfig = await loadGlobalConfig(input.globalConfigPath);
  const projectConfig = await readJsonFile(input.projectConfigPath, ProjectConfigSchema);
  return {
    ...globalConfig,
    ...projectConfig
  };
}
