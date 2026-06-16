import { z } from "zod";

export const ProviderNameSchema = z.enum([
  "openai",
  "anthropic",
  "gemini",
  "openai-compatible"
]);

export const ReviewModeSchema = z.enum(["gated", "auto"]);

export const ProjectConfigSchema = z.object({
  name: z.string().min(1),
  provider: ProviderNameSchema,
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  primaryStyle: z.string().min(1),
  assistStyle: z.string().min(1).optional(),
  chapterCount: z.number().int().min(1),
  chapterWordTarget: z.number().int().min(500),
  reviewMode: ReviewModeSchema,
  currentChapter: z.number().int().min(0)
});

export const GlobalConfigSchema = z.object({
  provider: ProviderNameSchema.optional(),
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  baseUrl: z.string().url().optional(),
  editor: z.string().min(1).optional()
});

export const StyleCheckIssueSchema = z.object({
  type: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  evidence: z.string().min(1),
  suggestion: z.string().min(1)
});

const coerceIssue = z.preprocess(
  (item) =>
    typeof item === "string"
      ? { type: "style", severity: "medium", evidence: item, suggestion: item }
      : item,
  StyleCheckIssueSchema
);

export const StyleCheckSchema = z.object({
  pass: z.boolean(),
  issues: z.array(coerceIssue),
  rewriteInstructions: z.array(z.string().min(1))
});

export const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  status: z.string().min(1),
  secrets: z.array(z.string()),
  relationships: z.array(
    z.object({
      targetId: z.string().min(1),
      description: z.string().min(1)
    })
  ),
  recentChapters: z.array(z.number().int().min(1))
});

export const ForeshadowingSchema = z.object({
  id: z.string().min(1),
  plantedChapter: z.number().int().min(1),
  status: z.enum(["planned", "planted", "paid_off"]),
  payoffPlan: z.string().min(1),
  payoffChapter: z.number().int().min(1).optional()
});

export const FactSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  disclosure: z.enum(["hidden", "hinted", "revealed"])
});

export const ContinuitySchema = z.object({
  timeline: z.array(z.string()),
  locations: z.array(z.string()),
  importantObjects: z.array(z.string()),
  contradictions: z.array(z.string())
});

export const StoryStateSchema = z.object({
  currentVolume: z.number().int().min(0),
  currentChapter: z.number().int().min(0),
  latestCheckpoint: z.string().optional(),
  stateVersion: z.number().int().min(1)
});

export const ChapterCheckpointSchema = z.object({
  chapter: z.number().int().min(1),
  outlinePath: z.string().min(1),
  draftPath: z.string().optional(),
  reviewPath: z.string().optional(),
  rewritePath: z.string().optional(),
  beforeStateSnapshot: z.string().optional(),
  afterStateSnapshot: z.string().optional(),
  provider: ProviderNameSchema,
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  accepted: z.boolean(),
  failedStep: z.string().optional(),
  errorMessage: z.string().optional()
});
