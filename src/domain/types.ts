import { z } from "zod";
import {
  ChapterCheckpointSchema,
  CharacterSchema,
  ContinuitySchema,
  FactSchema,
  ForeshadowingSchema,
  GlobalConfigSchema,
  ProjectConfigSchema,
  ProviderNameSchema,
  StoryStateSchema,
  StyleCheckSchema
} from "./schemas.js";

export type ProviderName = z.infer<typeof ProviderNameSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
export type StyleCheck = z.infer<typeof StyleCheckSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Foreshadowing = z.infer<typeof ForeshadowingSchema>;
export type Fact = z.infer<typeof FactSchema>;
export type Continuity = z.infer<typeof ContinuitySchema>;
export type StoryState = z.infer<typeof StoryStateSchema>;
export type ChapterCheckpoint = z.infer<typeof ChapterCheckpointSchema>;
