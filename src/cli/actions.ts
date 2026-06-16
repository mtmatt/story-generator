import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { createStoryProject } from "../project/createProject.js";
import { GlobalConfig, ProjectConfig } from "../domain/types.js";
import { ProviderFactoryConfig } from "../llm/types.js";
import { createLlmProvider } from "../llm/factory.js";
import { loadGlobalConfig } from "../config/loadConfig.js";
import { loadStyleSelection } from "../styles/loadStyles.js";
import {
  generateChapterOutlines,
  generateStoryBible,
  generateVolumeOutlines,
  generateWholeBookOutline
} from "../pipeline/planning.js";

export interface CliEnv {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENAI_COMPATIBLE_API_KEY?: string;
  OPENAI_COMPATIBLE_BASE_URL?: string;
}

export interface QuickOptions {
  name?: string;
  style: string;
  assistStyle?: string;
  idea: string;
  chapters: string;
  chapterWordTarget?: string;
  provider?: ProjectConfig["provider"];
  model?: string;
  temperature?: string;
  auto?: boolean;
}

export function buildProjectConfigFromOptions(options: QuickOptions, global: GlobalConfig): ProjectConfig {
  const provider = options.provider ?? global.provider;
  const model = options.model ?? global.model;
  if (!provider) {
    throw new Error("Missing provider");
  }
  if (!model) {
    throw new Error("Missing model");
  }

  return {
    name: options.name ?? "story",
    provider,
    model,
    temperature: options.temperature ? Number(options.temperature) : global.temperature ?? 0.8,
    primaryStyle: options.style,
    assistStyle: options.assistStyle,
    chapterCount: Number(options.chapters),
    chapterWordTarget: options.chapterWordTarget ? Number(options.chapterWordTarget) : 2500,
    reviewMode: options.auto ? "auto" : "gated",
    currentChapter: 0
  };
}

export function providerFactoryConfigFromProject(
  config: ProjectConfig & Partial<GlobalConfig>,
  env: CliEnv
): ProviderFactoryConfig {
  if (config.provider === "openai") {
    return { provider: "openai", apiKey: env.OPENAI_API_KEY };
  }
  if (config.provider === "anthropic") {
    return { provider: "anthropic", apiKey: env.ANTHROPIC_API_KEY };
  }
  if (config.provider === "gemini") {
    return { provider: "gemini", apiKey: env.GEMINI_API_KEY };
  }
  return {
    provider: "openai-compatible",
    apiKey: env.OPENAI_COMPATIBLE_API_KEY,
    baseUrl: config.baseUrl ?? env.OPENAI_COMPATIBLE_BASE_URL
  };
}

export async function runQuickWorkflow(options: QuickOptions, cwd = process.cwd(), env: CliEnv = process.env): Promise<string> {
  const globalPath = join(homedir(), ".story-weaver", "config.json");
  const global = await loadGlobalConfig(globalPath);
  const projectConfig = buildProjectConfigFromOptions(options, global);
  const root = resolve(cwd, projectConfig.name);
  const stylesDir = resolve(cwd, "styles");

  await createStoryProject(root, projectConfig);
  const styles = await loadStyleSelection(stylesDir, projectConfig.primaryStyle, projectConfig.assistStyle);
  const provider = createLlmProvider(providerFactoryConfigFromProject({ ...global, ...projectConfig }, env));

  await generateStoryBible({
    root,
    provider,
    model: projectConfig.model,
    temperature: projectConfig.temperature,
    idea: options.idea,
    primaryStyle: styles.primary.content,
    assistStyle: styles.assist?.content
  });
  await generateWholeBookOutline({
    root,
    provider,
    model: projectConfig.model,
    temperature: projectConfig.temperature,
    primaryStyle: styles.primary.content,
    assistStyle: styles.assist?.content
  });
  await generateVolumeOutlines({
    root,
    provider,
    model: projectConfig.model,
    temperature: projectConfig.temperature,
    primaryStyle: styles.primary.content,
    assistStyle: styles.assist?.content
  });
  await generateChapterOutlines({
    root,
    provider,
    model: projectConfig.model,
    temperature: projectConfig.temperature,
    primaryStyle: styles.primary.content,
    assistStyle: styles.assist?.content
  });

  return root;
}
