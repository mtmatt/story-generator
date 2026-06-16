import { readFile, writeFile } from "node:fs/promises";
import { LlmProvider } from "../llm/types.js";
import { buildStoryProjectPaths } from "../project/paths.js";
import { composeStyleSystemPrompt, storyBiblePrompt, wholeBookOutlinePrompt } from "./prompts.js";

export interface PlanningInput {
  root: string;
  provider: LlmProvider;
  primaryStyle: string;
  assistStyle?: string;
  model: string;
  temperature: number;
}

export interface StoryBibleInput extends PlanningInput {
  idea: string;
}

export async function generateStoryBible(input: StoryBibleInput): Promise<string> {
  const paths = buildStoryProjectPaths(input.root);
  const result = await input.provider.generateText({
    model: input.model,
    temperature: input.temperature,
    system: composeStyleSystemPrompt(input),
    prompt: storyBiblePrompt(input.idea)
  });
  await writeFile(paths.storyBible, result.text, "utf8");
  return result.text;
}

export async function generateWholeBookOutline(input: PlanningInput): Promise<string> {
  const paths = buildStoryProjectPaths(input.root);
  const storyBible = await readFile(paths.storyBible, "utf8");
  const result = await input.provider.generateText({
    model: input.model,
    temperature: input.temperature,
    system: composeStyleSystemPrompt(input),
    prompt: wholeBookOutlinePrompt(storyBible)
  });
  await writeFile(paths.outline, result.text, "utf8");
  return result.text;
}
