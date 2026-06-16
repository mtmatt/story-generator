import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { LlmProvider } from "../llm/types.js";
import { buildStoryProjectPaths } from "../project/paths.js";
import {
  chapterOutlinesPrompt,
  composeStyleSystemPrompt,
  storyBiblePrompt,
  volumeOutlinesPrompt,
  wholeBookOutlinePrompt
} from "./prompts.js";

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

const ChapterOutlineListSchema = z.array(
  z.object({
    chapter: z.number().int().min(1),
    title: z.string().min(1),
    outline: z.string().min(1)
  })
);

export async function generateVolumeOutlines(input: PlanningInput): Promise<string> {
  const paths = buildStoryProjectPaths(input.root);
  const storyBible = await readFile(paths.storyBible, "utf8");
  const outline = await readFile(paths.outline, "utf8");
  const result = await input.provider.generateText({
    model: input.model,
    temperature: input.temperature,
    system: composeStyleSystemPrompt(input),
    prompt: volumeOutlinesPrompt(storyBible, outline)
  });
  await mkdir(paths.volumesDir, { recursive: true });
  const volumePath = join(paths.volumesDir, "volume-001.md");
  await writeFile(volumePath, result.text, "utf8");
  return result.text;
}

export async function generateChapterOutlines(input: PlanningInput): Promise<void> {
  const paths = buildStoryProjectPaths(input.root);
  const storyBible = await readFile(paths.storyBible, "utf8");
  const outline = await readFile(paths.outline, "utf8");
  const chapterOutlines = await input.provider.generateJson({
    model: input.model,
    temperature: input.temperature,
    system: composeStyleSystemPrompt(input),
    prompt: chapterOutlinesPrompt(storyBible, outline),
    schema: ChapterOutlineListSchema
  });
  await mkdir(paths.chaptersDir, { recursive: true });
  for (const item of chapterOutlines) {
    const slug = `chapter-${item.chapter.toString().padStart(3, "0")}`;
    await writeFile(join(paths.chaptersDir, `${slug}.outline.md`), `# ${slug}: ${item.title}\n\n${item.outline}\n`, "utf8");
  }
}
