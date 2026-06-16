import { join } from "node:path";
import { ChapterCheckpointSchema } from "../domain/schemas.js";
import { ChapterCheckpoint } from "../domain/types.js";
import { readJsonFile, writeJsonFile } from "../fs/json.js";
import { buildStoryProjectPaths } from "../project/paths.js";

export function chapterNumberSlug(chapter: number): string {
  return `chapter-${chapter.toString().padStart(3, "0")}`;
}

export function checkpointPath(root: string, chapter: number): string {
  return join(buildStoryProjectPaths(root).checkpointsDir, `${chapterNumberSlug(chapter)}.json`);
}

export async function writeCheckpoint(root: string, checkpoint: ChapterCheckpoint): Promise<void> {
  await writeJsonFile(checkpointPath(root, checkpoint.chapter), ChapterCheckpointSchema.parse(checkpoint));
}

export async function readCheckpoint(root: string, chapter: number): Promise<ChapterCheckpoint> {
  return readJsonFile(checkpointPath(root, chapter), ChapterCheckpointSchema);
}
