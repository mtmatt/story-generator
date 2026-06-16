import { join } from "node:path";

export interface StoryProjectPaths {
  root: string;
  projectJson: string;
  storyBible: string;
  outline: string;
  volumesDir: string;
  chaptersDir: string;
  stateDir: string;
  checkpointsDir: string;
  versionsDir: string;
  stateJson: string;
  charactersJson: string;
  foreshadowingJson: string;
  continuityJson: string;
  factsJson: string;
}

export function buildStoryProjectPaths(root: string): StoryProjectPaths {
  return {
    root,
    projectJson: join(root, "project.json"),
    storyBible: join(root, "story-bible.md"),
    outline: join(root, "outline.md"),
    volumesDir: join(root, "volumes"),
    chaptersDir: join(root, "chapters"),
    stateDir: join(root, "state"),
    checkpointsDir: join(root, "checkpoints"),
    versionsDir: join(root, "versions"),
    stateJson: join(root, "state", "state.json"),
    charactersJson: join(root, "state", "characters.json"),
    foreshadowingJson: join(root, "state", "foreshadowing.json"),
    continuityJson: join(root, "state", "continuity.json"),
    factsJson: join(root, "state", "facts.json")
  };
}
