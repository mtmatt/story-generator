import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { StyleCheckSchema } from "../domain/schemas.js";
import { ProviderName } from "../domain/types.js";
import { LlmProvider } from "../llm/types.js";
import { buildStoryProjectPaths } from "../project/paths.js";
import { chapterNumberSlug, writeCheckpoint } from "../state/checkpoints.js";
import { readStoryState } from "../state/stateStore.js";
import {
  chapterDraftPrompt,
  composeStyleSystemPrompt,
  rewritePrompt,
  styleCheckPrompt
} from "./prompts.js";

export interface WriteChapterInput {
  root: string;
  chapter: number;
  provider: LlmProvider;
  providerName: ProviderName;
  model: string;
  temperature: number;
  primaryStyle: string;
  assistStyle?: string;
}

export async function writeChapter(input: WriteChapterInput): Promise<void> {
  const paths = buildStoryProjectPaths(input.root);
  const slug = chapterNumberSlug(input.chapter);
  const outlinePath = join(paths.chaptersDir, `${slug}.outline.md`);
  const draftVersionDir = join(paths.versionsDir, slug);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "");
  const draftVersionPath = join(draftVersionDir, `${timestamp}-draft.md`);
  const rewriteVersionPath = join(draftVersionDir, `${timestamp}-rewrite.md`);
  const finalPath = join(paths.chaptersDir, `${slug}.md`);
  const reviewPath = join(paths.chaptersDir, `${slug}.review.md`);

  await mkdir(draftVersionDir, { recursive: true });

  const chapterOutline = await readFile(outlinePath, "utf8");
  const storyState = await readStoryState(input.root);
  const system = composeStyleSystemPrompt(input);

  const draft = await input.provider.generateText({
    model: input.model,
    temperature: input.temperature,
    system,
    prompt: chapterDraftPrompt(chapterOutline, JSON.stringify(storyState, null, 2))
  });

  await writeFile(draftVersionPath, draft.text, "utf8");

  const styleCheck = await input.provider.generateJson({
    model: input.model,
    temperature: input.temperature,
    system,
    prompt: styleCheckPrompt(draft.text),
    schema: StyleCheckSchema
  });

  await writeFile(reviewPath, `${JSON.stringify(styleCheck, null, 2)}\n`, "utf8");

  const finalText = styleCheck.pass
    ? draft.text
    : (
        await input.provider.generateText({
          model: input.model,
          temperature: input.temperature,
          system,
          prompt: rewritePrompt(draft.text, styleCheck.rewriteInstructions)
        })
      ).text;

  if (!styleCheck.pass) {
    await writeFile(rewriteVersionPath, finalText, "utf8");
  }

  await writeFile(finalPath, finalText, "utf8");
  await writeCheckpoint(input.root, {
    chapter: input.chapter,
    outlinePath,
    draftPath: draftVersionPath,
    reviewPath,
    rewritePath: styleCheck.pass ? undefined : rewriteVersionPath,
    provider: input.providerName,
    model: input.model,
    temperature: input.temperature,
    accepted: true
  });
}
