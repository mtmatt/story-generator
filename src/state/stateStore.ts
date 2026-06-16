import { z } from "zod";
import {
  CharacterSchema,
  ContinuitySchema,
  FactSchema,
  ForeshadowingSchema,
  StoryStateSchema
} from "../domain/schemas.js";
import { Character, Continuity, Fact, Foreshadowing, StoryState } from "../domain/types.js";
import { readJsonFile, writeJsonFile } from "../fs/json.js";
import { buildStoryProjectPaths } from "../project/paths.js";

const CharactersSchema = z.array(CharacterSchema);
const ForeshadowingListSchema = z.array(ForeshadowingSchema);
const FactsSchema = z.array(FactSchema);

export async function readCharacters(root: string): Promise<Character[]> {
  return readJsonFile(buildStoryProjectPaths(root).charactersJson, CharactersSchema);
}

export async function writeCharacters(root: string, characters: Character[]): Promise<void> {
  await writeJsonFile(buildStoryProjectPaths(root).charactersJson, CharactersSchema.parse(characters));
}

export async function readForeshadowing(root: string): Promise<Foreshadowing[]> {
  return readJsonFile(buildStoryProjectPaths(root).foreshadowingJson, ForeshadowingListSchema);
}

export async function writeForeshadowing(root: string, items: Foreshadowing[]): Promise<void> {
  await writeJsonFile(buildStoryProjectPaths(root).foreshadowingJson, ForeshadowingListSchema.parse(items));
}

export async function readFacts(root: string): Promise<Fact[]> {
  return readJsonFile(buildStoryProjectPaths(root).factsJson, FactsSchema);
}

export async function writeFacts(root: string, facts: Fact[]): Promise<void> {
  await writeJsonFile(buildStoryProjectPaths(root).factsJson, FactsSchema.parse(facts));
}

export async function readContinuity(root: string): Promise<Continuity> {
  return readJsonFile(buildStoryProjectPaths(root).continuityJson, ContinuitySchema);
}

export async function writeContinuity(root: string, continuity: Continuity): Promise<void> {
  await writeJsonFile(buildStoryProjectPaths(root).continuityJson, ContinuitySchema.parse(continuity));
}

export async function readStoryState(root: string): Promise<StoryState> {
  return readJsonFile(buildStoryProjectPaths(root).stateJson, StoryStateSchema);
}

export async function writeStoryState(root: string, state: StoryState): Promise<void> {
  await writeJsonFile(buildStoryProjectPaths(root).stateJson, StoryStateSchema.parse(state));
}
