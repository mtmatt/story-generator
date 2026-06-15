# Story Weaver CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first TypeScript Node.js CLI MVP for long-form story planning, chapter drafting, style checking, rewriting, checkpointing, and structured story-state editing.

**Architecture:** The CLI is a thin layer over reusable core modules. Files are split by responsibility: domain schemas, project storage, style loading, config merge, LLM adapters, pipeline orchestration, checkpoint/state storage, review/editor handling, and command wiring.

**Tech Stack:** Node.js 20+, TypeScript, Commander for CLI parsing, Zod for schema validation, Vitest for tests, native `fetch`, native `fs/promises`, native `readline/promises`, native `child_process`.

---

## Scope Notes

This plan implements the accepted core-first MVP spec in one vertical slice. It does not add Web UI, HTTP API server, vector memory, ebook export, or real-provider tests in the default test suite.

The current repository has unrelated staged and untracked files such as `.gitmodules`, `Humanizer-zh-TW`, `.claude/`, and `styles/`. Do not revert or commit those unrelated changes. Every commit command below uses explicit pathspecs.

## File Structure

Create this structure:

```text
package.json
package-lock.json
tsconfig.json
vitest.config.ts
src/
  cli/
    actions.ts
    index.ts
    program.ts
  config/
    loadConfig.ts
  domain/
    schemas.ts
    types.ts
  fs/
    json.ts
  llm/
    anthropicProvider.ts
    factory.ts
    geminiProvider.ts
    mockProvider.ts
    openaiCompatibleProvider.ts
    openaiProvider.ts
    types.ts
  pipeline/
    chapter.ts
    planning.ts
    prompts.ts
  project/
    createProject.ts
    paths.ts
    store.ts
  review/
    editor.ts
    menu.ts
  state/
    checkpoints.ts
    stateStore.ts
  styles/
    loadStyles.ts
  version.ts
tests/
  cli/
    actions.test.ts
    program.test.ts
  config/
    loadConfig.test.ts
  domain/
    schemas.test.ts
  llm/
    factory.test.ts
    mockProvider.test.ts
  pipeline/
    chapter.test.ts
    planning.test.ts
  project/
    createProject.test.ts
  state/
    stateStore.test.ts
  styles/
    loadStyles.test.ts
```

## Task 1: TypeScript CLI Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/version.ts`
- Create: `src/cli/program.ts`
- Create: `src/cli/index.ts`
- Create: `tests/cli/program.test.ts`

- [ ] **Step 1: Create the package manifest**

Create `package.json`:

```json
{
  "name": "story-weaver",
  "version": "0.1.0",
  "description": "CLI for long-form story planning and generation with LLMs.",
  "type": "module",
  "bin": {
    "story-weaver": "dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run",
    "dev": "tsx src/cli/index.ts"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3",
    "vitest": "^2.0.3"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: exits 0 and creates `package-lock.json`.

- [ ] **Step 3: Add TypeScript and Vitest config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
```

- [ ] **Step 4: Write the first failing CLI test**

Create `tests/cli/program.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createProgram } from "../../src/cli/program.js";
import { VERSION } from "../../src/version.js";

describe("createProgram", () => {
  it("exposes the configured CLI name and version", () => {
    const program = createProgram();

    expect(program.name()).toBe("story-weaver");
    expect(program.version()).toBe(VERSION);
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test -- tests/cli/program.test.ts`

Expected: FAIL because `src/cli/program.ts` and `src/version.ts` do not exist.

- [ ] **Step 6: Add the minimal CLI implementation**

Create `src/version.ts`:

```ts
export const VERSION = "0.1.0";
```

Create `src/cli/program.ts`:

```ts
import { Command } from "commander";
import { VERSION } from "../version.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("story-weaver")
    .description("Plan, draft, review, and continue long-form stories with LLMs.")
    .version(VERSION);

  program.command("init").description("Create an empty story project.");
  program.command("quick").description("Create a story from a short idea.");
  program.command("guided").description("Create a story through interactive prompts.");

  return program;
}
```

Create `src/cli/index.ts`:

```ts
#!/usr/bin/env node
import { createProgram } from "./program.js";

await createProgram().parseAsync(process.argv);
```

- [ ] **Step 7: Verify scaffold tests and build**

Run: `npm test -- tests/cli/program.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exits 0.

- [ ] **Step 8: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts src/version.ts src/cli/program.ts src/cli/index.ts tests/cli/program.test.ts
git commit -m "chore: scaffold TypeScript CLI" -- package.json package-lock.json tsconfig.json vitest.config.ts src/version.ts src/cli/program.ts src/cli/index.ts tests/cli/program.test.ts
```

## Task 2: Domain Schemas and Types

**Files:**
- Create: `src/domain/schemas.ts`
- Create: `src/domain/types.ts`
- Create: `tests/domain/schemas.test.ts`

- [ ] **Step 1: Write failing schema tests**

Create `tests/domain/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  CharacterSchema,
  ProjectConfigSchema,
  StyleCheckSchema
} from "../../src/domain/schemas.js";

describe("domain schemas", () => {
  it("parses a project config with primary and assist styles", () => {
    const config = ProjectConfigSchema.parse({
      name: "old-apartment",
      provider: "openai-compatible",
      model: "local-model",
      temperature: 0.8,
      primaryStyle: "靈異",
      assistStyle: "無限流",
      chapterCount: 80,
      chapterWordTarget: 3000,
      reviewMode: "gated",
      currentChapter: 0
    });

    expect(config.primaryStyle).toBe("靈異");
    expect(config.assistStyle).toBe("無限流");
  });

  it("rejects invalid chapter counts", () => {
    expect(() =>
      ProjectConfigSchema.parse({
        name: "bad",
        provider: "openai",
        model: "gpt-test",
        temperature: 0.7,
        primaryStyle: "靈異",
        chapterCount: 0,
        chapterWordTarget: 3000,
        reviewMode: "gated",
        currentChapter: 0
      })
    ).toThrow();
  });

  it("parses style check issues", () => {
    const result = StyleCheckSchema.parse({
      pass: false,
      issues: [
        {
          type: "style_mismatch",
          severity: "high",
          evidence: "開頭鋪墊太久",
          suggestion: "第一段直接進入異常事件"
        }
      ],
      rewriteInstructions: ["刪掉背景介紹"]
    });

    expect(result.issues[0].severity).toBe("high");
  });

  it("parses a character state item", () => {
    const character = CharacterSchema.parse({
      id: "char-main",
      name: "林缺",
      role: "protagonist",
      status: "alive",
      secrets: ["記憶被重置過"],
      relationships: [{ targetId: "char-neighbor", description: "互相懷疑" }],
      recentChapters: [1, 2]
    });

    expect(character.relationships[0].targetId).toBe("char-neighbor");
  });
});
```

- [ ] **Step 2: Run the schema tests to verify they fail**

Run: `npm test -- tests/domain/schemas.test.ts`

Expected: FAIL because `src/domain/schemas.ts` does not exist.

- [ ] **Step 3: Implement schemas**

Create `src/domain/schemas.ts`:

```ts
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

export const StyleCheckSchema = z.object({
  pass: z.boolean(),
  issues: z.array(StyleCheckIssueSchema),
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
```

Create `src/domain/types.ts`:

```ts
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
```

- [ ] **Step 4: Verify schema tests and typecheck**

Run: `npm test -- tests/domain/schemas.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exits 0.

- [ ] **Step 5: Commit schemas**

```bash
git add src/domain/schemas.ts src/domain/types.ts tests/domain/schemas.test.ts
git commit -m "feat: add story domain schemas" -- src/domain/schemas.ts src/domain/types.ts tests/domain/schemas.test.ts
```

## Task 3: Project Storage, JSON Helpers, Style Loading, and Config Merge

**Files:**
- Create: `src/fs/json.ts`
- Create: `src/project/paths.ts`
- Create: `src/project/createProject.ts`
- Create: `src/project/store.ts`
- Create: `src/styles/loadStyles.ts`
- Create: `src/config/loadConfig.ts`
- Create: `tests/project/createProject.test.ts`
- Create: `tests/styles/loadStyles.test.ts`
- Create: `tests/config/loadConfig.test.ts`

- [ ] **Step 1: Write failing storage and config tests**

Create `tests/project/createProject.test.ts`:

```ts
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createStoryProject } from "../../src/project/createProject.js";

describe("createStoryProject", () => {
  it("creates the story project layout and project config", async () => {
    const root = await mkdtemp(join(tmpdir(), "story-weaver-"));
    const projectRoot = join(root, "my-story");

    await createStoryProject(projectRoot, {
      name: "my-story",
      provider: "openai-compatible",
      model: "local-model",
      temperature: 0.8,
      primaryStyle: "靈異",
      assistStyle: "無限流",
      chapterCount: 12,
      chapterWordTarget: 2500,
      reviewMode: "gated",
      currentChapter: 0
    });

    const projectJson = JSON.parse(await readFile(join(projectRoot, "project.json"), "utf8"));
    expect(projectJson.primaryStyle).toBe("靈異");
    expect(await readFile(join(projectRoot, "story-bible.md"), "utf8")).toContain("# Story Bible");
  });
});
```

Create `tests/styles/loadStyles.test.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { loadStyleSelection, scanStyles } from "../../src/styles/loadStyles.js";

describe("loadStyles", () => {
  it("scans markdown style files by basename", async () => {
    const root = await mkdtemp(join(tmpdir(), "styles-"));
    const stylesDir = join(root, "styles");
    await mkdir(stylesDir);
    await writeFile(join(stylesDir, "靈異.md"), "恐怖貼著喜劇", "utf8");

    const styles = await scanStyles(stylesDir);

    expect(styles).toEqual([{ name: "靈異", path: join(stylesDir, "靈異.md") }]);
  });

  it("loads primary and assist styles", async () => {
    const root = await mkdtemp(join(tmpdir(), "styles-"));
    const stylesDir = join(root, "styles");
    await mkdir(stylesDir);
    await writeFile(join(stylesDir, "靈異.md"), "主聲音", "utf8");
    await writeFile(join(stylesDir, "無限流.md"), "規則局", "utf8");

    const selection = await loadStyleSelection(stylesDir, "靈異", "無限流");

    expect(selection.primary.content).toBe("主聲音");
    expect(selection.assist?.content).toBe("規則局");
  });
});
```

Create `tests/config/loadConfig.test.ts`:

```ts
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { loadMergedConfig } from "../../src/config/loadConfig.js";

describe("loadMergedConfig", () => {
  it("lets project config override global config", async () => {
    const root = await mkdtemp(join(tmpdir(), "config-"));
    const globalPath = join(root, "global.json");
    const projectPath = join(root, "project.json");

    await writeFile(globalPath, JSON.stringify({ provider: "openai", model: "gpt-global", temperature: 0.4 }), "utf8");
    await writeFile(
      projectPath,
      JSON.stringify({
        name: "story",
        provider: "gemini",
        model: "gemini-project",
        temperature: 0.9,
        primaryStyle: "靈異",
        chapterCount: 10,
        chapterWordTarget: 2500,
        reviewMode: "gated",
        currentChapter: 0
      }),
      "utf8"
    );

    const merged = await loadMergedConfig({ globalConfigPath: globalPath, projectConfigPath: projectPath });

    expect(merged.provider).toBe("gemini");
    expect(merged.model).toBe("gemini-project");
    expect(merged.temperature).toBe(0.9);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/project/createProject.test.ts tests/styles/loadStyles.test.ts tests/config/loadConfig.test.ts`

Expected: FAIL because storage modules do not exist.

- [ ] **Step 3: Implement JSON helpers**

Create `src/fs/json.ts`:

```ts
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";

export async function readJsonFile<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const raw = await readFile(path, "utf8");
  return schema.parse(JSON.parse(raw));
}

export async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, path);
}
```

- [ ] **Step 4: Implement project paths and creation**

Create `src/project/paths.ts`:

```ts
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
```

Create `src/project/createProject.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { ProjectConfig } from "../domain/types.js";
import { ProjectConfigSchema } from "../domain/schemas.js";
import { writeJsonFile } from "../fs/json.js";
import { buildStoryProjectPaths } from "./paths.js";

export async function createStoryProject(root: string, config: ProjectConfig): Promise<void> {
  const parsed = ProjectConfigSchema.parse(config);
  const paths = buildStoryProjectPaths(root);

  await mkdir(paths.volumesDir, { recursive: true });
  await mkdir(paths.chaptersDir, { recursive: true });
  await mkdir(paths.stateDir, { recursive: true });
  await mkdir(paths.checkpointsDir, { recursive: true });
  await mkdir(paths.versionsDir, { recursive: true });

  await writeJsonFile(paths.projectJson, parsed);
  await writeFile(paths.storyBible, "# Story Bible\n\n", "utf8");
  await writeFile(paths.outline, "# Whole-Book Outline\n\n", "utf8");
  await writeJsonFile(paths.stateJson, { currentVolume: 0, currentChapter: 0, stateVersion: 1 });
  await writeJsonFile(paths.charactersJson, []);
  await writeJsonFile(paths.foreshadowingJson, []);
  await writeJsonFile(paths.continuityJson, {
    timeline: [],
    locations: [],
    importantObjects: [],
    contradictions: []
  });
  await writeJsonFile(paths.factsJson, []);
}
```

Create `src/project/store.ts`:

```ts
import { ProjectConfig } from "../domain/types.js";
import { ProjectConfigSchema } from "../domain/schemas.js";
import { readJsonFile, writeJsonFile } from "../fs/json.js";
import { buildStoryProjectPaths } from "./paths.js";

export async function readProjectConfig(root: string): Promise<ProjectConfig> {
  return readJsonFile(buildStoryProjectPaths(root).projectJson, ProjectConfigSchema);
}

export async function writeProjectConfig(root: string, config: ProjectConfig): Promise<void> {
  await writeJsonFile(buildStoryProjectPaths(root).projectJson, ProjectConfigSchema.parse(config));
}
```

- [ ] **Step 5: Implement style loading**

Create `src/styles/loadStyles.ts`:

```ts
import { readdir, readFile } from "node:fs/promises";
import { extname, join, basename } from "node:path";

export interface StyleRef {
  name: string;
  path: string;
}

export interface LoadedStyle {
  name: string;
  path: string;
  content: string;
}

export interface StyleSelection {
  primary: LoadedStyle;
  assist?: LoadedStyle;
}

export async function scanStyles(stylesDir: string): Promise<StyleRef[]> {
  const entries = await readdir(stylesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && extname(entry.name) === ".md")
    .map((entry) => ({ name: basename(entry.name, ".md"), path: join(stylesDir, entry.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadStyle(stylesDir: string, name: string): Promise<LoadedStyle> {
  const styles = await scanStyles(stylesDir);
  const style = styles.find((item) => item.name === name);
  if (!style) {
    throw new Error(`Style not found: ${name}`);
  }
  return {
    name: style.name,
    path: style.path,
    content: await readFile(style.path, "utf8")
  };
}

export async function loadStyleSelection(
  stylesDir: string,
  primaryName: string,
  assistName?: string
): Promise<StyleSelection> {
  return {
    primary: await loadStyle(stylesDir, primaryName),
    assist: assistName ? await loadStyle(stylesDir, assistName) : undefined
  };
}
```

- [ ] **Step 6: Implement config merge**

Create `src/config/loadConfig.ts`:

```ts
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
```

- [ ] **Step 7: Verify tests and typecheck**

Run: `npm test -- tests/project/createProject.test.ts tests/styles/loadStyles.test.ts tests/config/loadConfig.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exits 0.

- [ ] **Step 8: Commit storage and config**

```bash
git add src/fs/json.ts src/project/paths.ts src/project/createProject.ts src/project/store.ts src/styles/loadStyles.ts src/config/loadConfig.ts tests/project/createProject.test.ts tests/styles/loadStyles.test.ts tests/config/loadConfig.test.ts
git commit -m "feat: add project storage and style loading" -- src/fs/json.ts src/project/paths.ts src/project/createProject.ts src/project/store.ts src/styles/loadStyles.ts src/config/loadConfig.ts tests/project/createProject.test.ts tests/styles/loadStyles.test.ts tests/config/loadConfig.test.ts
```

## Task 4: LLM Provider Abstraction

**Files:**
- Create: `src/llm/types.ts`
- Create: `src/llm/mockProvider.ts`
- Create: `src/llm/openaiCompatibleProvider.ts`
- Create: `src/llm/openaiProvider.ts`
- Create: `src/llm/anthropicProvider.ts`
- Create: `src/llm/geminiProvider.ts`
- Create: `src/llm/factory.ts`
- Create: `tests/llm/mockProvider.test.ts`
- Create: `tests/llm/factory.test.ts`

- [ ] **Step 1: Write failing LLM tests**

Create `tests/llm/mockProvider.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MockLlmProvider } from "../../src/llm/mockProvider.js";
import { StyleCheckSchema } from "../../src/domain/schemas.js";

describe("MockLlmProvider", () => {
  it("returns queued text responses", async () => {
    const provider = new MockLlmProvider(["first"]);
    const result = await provider.generateText({ prompt: "write", model: "mock", temperature: 0.7 });
    expect(result.text).toBe("first");
  });

  it("parses queued JSON responses", async () => {
    const provider = new MockLlmProvider([
      JSON.stringify({ pass: true, issues: [], rewriteInstructions: [] })
    ]);
    const result = await provider.generateJson({
      prompt: "check",
      model: "mock",
      temperature: 0.7,
      schema: StyleCheckSchema
    });
    expect(result.pass).toBe(true);
  });
});
```

Create `tests/llm/factory.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createLlmProvider } from "../../src/llm/factory.js";

describe("createLlmProvider", () => {
  it("creates a mock provider when requested", () => {
    const provider = createLlmProvider({ provider: "mock", responses: ["ok"] });
    expect(provider.name).toBe("mock");
  });

  it("reports missing OpenAI API key", () => {
    expect(() =>
      createLlmProvider({ provider: "openai", apiKey: "", baseUrl: undefined })
    ).toThrow("Missing OPENAI_API_KEY");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/llm/mockProvider.test.ts tests/llm/factory.test.ts`

Expected: FAIL because LLM modules do not exist.

- [ ] **Step 3: Implement provider types and mock provider**

Create `src/llm/types.ts`:

```ts
import { z } from "zod";
import { ProviderName } from "../domain/types.js";

export interface GenerateTextRequest {
  prompt: string;
  model: string;
  temperature: number;
  system?: string;
}

export interface GenerateTextResult {
  text: string;
  raw?: unknown;
}

export interface GenerateJsonRequest<T> extends GenerateTextRequest {
  schema: z.ZodType<T>;
}

export interface LlmProvider {
  name: string;
  generateText(request: GenerateTextRequest): Promise<GenerateTextResult>;
  generateJson<T>(request: GenerateJsonRequest<T>): Promise<T>;
}

export interface ProviderFactoryConfig {
  provider: ProviderName | "mock";
  apiKey?: string;
  baseUrl?: string;
  responses?: string[];
}
```

Create `src/llm/mockProvider.ts`:

```ts
import { LlmProvider, GenerateJsonRequest, GenerateTextRequest, GenerateTextResult } from "./types.js";

export class MockLlmProvider implements LlmProvider {
  public readonly name = "mock";
  private responses: string[];

  constructor(responses: string[]) {
    this.responses = [...responses];
  }

  async generateText(_request: GenerateTextRequest): Promise<GenerateTextResult> {
    const response = this.responses.shift();
    if (response === undefined) {
      throw new Error("MockLlmProvider has no queued responses");
    }
    return { text: response };
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<T> {
    const result = await this.generateText(request);
    return request.schema.parse(JSON.parse(result.text));
  }
}
```

- [ ] **Step 4: Implement HTTP providers**

Create `src/llm/openaiCompatibleProvider.ts`:

```ts
import { GenerateJsonRequest, GenerateTextRequest, GenerateTextResult, LlmProvider } from "./types.js";

export class OpenAiCompatibleProvider implements LlmProvider {
  public readonly name = "openai-compatible";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly baseUrl: string
  ) {}

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: request.model,
        temperature: request.temperature,
        messages: [
          ...(request.system ? [{ role: "system", content: request.system }] : []),
          { role: "user", content: request.prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI-compatible request failed: ${response.status} ${await response.text()}`);
    }

    const raw = await response.json();
    const text = raw.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      throw new Error("OpenAI-compatible response did not include choices[0].message.content");
    }
    return { text, raw };
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<T> {
    const result = await this.generateText({
      ...request,
      prompt: `${request.prompt}\n\nReturn only valid JSON.`
    });
    return request.schema.parse(JSON.parse(result.text));
  }
}
```

Create `src/llm/openaiProvider.ts`:

```ts
import { OpenAiCompatibleProvider } from "./openaiCompatibleProvider.js";

export class OpenAiProvider extends OpenAiCompatibleProvider {
  public override readonly name = "openai";

  constructor(apiKey: string) {
    super(apiKey, "https://api.openai.com/v1");
  }
}
```

Create `src/llm/anthropicProvider.ts`:

```ts
import { GenerateJsonRequest, GenerateTextRequest, GenerateTextResult, LlmProvider } from "./types.js";

export class AnthropicProvider implements LlmProvider {
  public readonly name = "anthropic";

  constructor(private readonly apiKey: string) {}

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: 4096,
        temperature: request.temperature,
        system: request.system,
        messages: [{ role: "user", content: request.prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
    }

    const raw = await response.json();
    const text = raw.content?.map((part: { text?: string }) => part.text ?? "").join("");
    if (typeof text !== "string" || text.length === 0) {
      throw new Error("Anthropic response did not include text content");
    }
    return { text, raw };
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<T> {
    const result = await this.generateText({
      ...request,
      prompt: `${request.prompt}\n\nReturn only valid JSON.`
    });
    return request.schema.parse(JSON.parse(result.text));
  }
}
```

Create `src/llm/geminiProvider.ts`:

```ts
import { GenerateJsonRequest, GenerateTextRequest, GenerateTextResult, LlmProvider } from "./types.js";

export class GeminiProvider implements LlmProvider {
  public readonly name = "gemini";

  constructor(private readonly apiKey: string) {}

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(request.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        generationConfig: { temperature: request.temperature },
        systemInstruction: request.system ? { parts: [{ text: request.system }] } : undefined,
        contents: [{ role: "user", parts: [{ text: request.prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status} ${await response.text()}`);
    }

    const raw = await response.json();
    const text = raw.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("");
    if (typeof text !== "string" || text.length === 0) {
      throw new Error("Gemini response did not include text content");
    }
    return { text, raw };
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<T> {
    const result = await this.generateText({
      ...request,
      prompt: `${request.prompt}\n\nReturn only valid JSON.`
    });
    return request.schema.parse(JSON.parse(result.text));
  }
}
```

- [ ] **Step 5: Implement provider factory**

Create `src/llm/factory.ts`:

```ts
import { AnthropicProvider } from "./anthropicProvider.js";
import { GeminiProvider } from "./geminiProvider.js";
import { MockLlmProvider } from "./mockProvider.js";
import { OpenAiCompatibleProvider } from "./openaiCompatibleProvider.js";
import { OpenAiProvider } from "./openaiProvider.js";
import { LlmProvider, ProviderFactoryConfig } from "./types.js";

export function createLlmProvider(config: ProviderFactoryConfig): LlmProvider {
  if (config.provider === "mock") {
    return new MockLlmProvider(config.responses ?? []);
  }

  if (config.provider === "openai") {
    if (!config.apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }
    return new OpenAiProvider(config.apiKey);
  }

  if (config.provider === "anthropic") {
    if (!config.apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }
    return new AnthropicProvider(config.apiKey);
  }

  if (config.provider === "gemini") {
    if (!config.apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    return new GeminiProvider(config.apiKey);
  }

  if (!config.baseUrl) {
    throw new Error("Missing OpenAI-compatible baseUrl");
  }
  return new OpenAiCompatibleProvider(config.apiKey, config.baseUrl);
}
```

- [ ] **Step 6: Verify provider tests and typecheck**

Run: `npm test -- tests/llm/mockProvider.test.ts tests/llm/factory.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exits 0.

- [ ] **Step 7: Commit providers**

```bash
git add src/llm/types.ts src/llm/mockProvider.ts src/llm/openaiCompatibleProvider.ts src/llm/openaiProvider.ts src/llm/anthropicProvider.ts src/llm/geminiProvider.ts src/llm/factory.ts tests/llm/mockProvider.test.ts tests/llm/factory.test.ts
git commit -m "feat: add LLM provider adapters" -- src/llm/types.ts src/llm/mockProvider.ts src/llm/openaiCompatibleProvider.ts src/llm/openaiProvider.ts src/llm/anthropicProvider.ts src/llm/geminiProvider.ts src/llm/factory.ts tests/llm/mockProvider.test.ts tests/llm/factory.test.ts
```

## Task 5: State Store and Checkpoints

**Files:**
- Create: `src/state/stateStore.ts`
- Create: `src/state/checkpoints.ts`
- Create: `tests/state/stateStore.test.ts`

- [ ] **Step 1: Write failing state tests**

Create `tests/state/stateStore.test.ts`:

```ts
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createStoryProject } from "../../src/project/createProject.js";
import { readCharacters, writeCharacters } from "../../src/state/stateStore.js";
import { readCheckpoint, writeCheckpoint } from "../../src/state/checkpoints.js";

describe("state store", () => {
  it("reads and writes characters", async () => {
    const root = await mkdtemp(join(tmpdir(), "state-"));
    await createStoryProject(root, {
      name: "story",
      provider: "openai",
      model: "gpt-test",
      temperature: 0.7,
      primaryStyle: "靈異",
      chapterCount: 10,
      chapterWordTarget: 2500,
      reviewMode: "gated",
      currentChapter: 0
    });

    await writeCharacters(root, [
      {
        id: "char-main",
        name: "林缺",
        role: "protagonist",
        status: "alive",
        secrets: [],
        relationships: [],
        recentChapters: [1]
      }
    ]);

    expect((await readCharacters(root))[0].name).toBe("林缺");
  });

  it("writes and reads a chapter checkpoint", async () => {
    const root = await mkdtemp(join(tmpdir(), "checkpoint-"));
    await createStoryProject(root, {
      name: "story",
      provider: "openai",
      model: "gpt-test",
      temperature: 0.7,
      primaryStyle: "靈異",
      chapterCount: 10,
      chapterWordTarget: 2500,
      reviewMode: "gated",
      currentChapter: 0
    });

    await writeCheckpoint(root, {
      chapter: 1,
      outlinePath: "chapters/chapter-001.outline.md",
      draftPath: "chapters/chapter-001.md",
      provider: "openai",
      model: "gpt-test",
      temperature: 0.7,
      accepted: true
    });

    expect((await readCheckpoint(root, 1)).accepted).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/state/stateStore.test.ts`

Expected: FAIL because state modules do not exist.

- [ ] **Step 3: Implement state store**

Create `src/state/stateStore.ts`:

```ts
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
```

- [ ] **Step 4: Implement checkpoint store**

Create `src/state/checkpoints.ts`:

```ts
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
```

- [ ] **Step 5: Verify state tests and typecheck**

Run: `npm test -- tests/state/stateStore.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exits 0.

- [ ] **Step 6: Commit state store**

```bash
git add src/state/stateStore.ts src/state/checkpoints.ts tests/state/stateStore.test.ts
git commit -m "feat: add story state storage" -- src/state/stateStore.ts src/state/checkpoints.ts tests/state/stateStore.test.ts
```

## Task 6: Prompt Builders and Planning Pipeline

**Files:**
- Create: `src/pipeline/prompts.ts`
- Create: `src/pipeline/planning.ts`
- Create: `tests/pipeline/planning.test.ts`

- [ ] **Step 1: Write failing planning tests**

Create `tests/pipeline/planning.test.ts`:

```ts
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { MockLlmProvider } from "../../src/llm/mockProvider.js";
import { createStoryProject } from "../../src/project/createProject.js";
import { generateStoryBible, generateWholeBookOutline } from "../../src/pipeline/planning.js";

describe("planning pipeline", () => {
  it("writes story bible and outline markdown", async () => {
    const root = await mkdtemp(join(tmpdir(), "planning-"));
    await createStoryProject(root, {
      name: "story",
      provider: "openai-compatible",
      model: "mock",
      temperature: 0.7,
      primaryStyle: "靈異",
      assistStyle: "無限流",
      chapterCount: 10,
      chapterWordTarget: 2500,
      reviewMode: "auto",
      currentChapter: 0
    });

    const provider = new MockLlmProvider(["# Story Bible\n\n主角和鬼樓。", "# Whole-Book Outline\n\n十章。"]);
    await generateStoryBible({ root, provider, idea: "鬼樓", primaryStyle: "主風格", assistStyle: "輔助風格" });
    await generateWholeBookOutline({ root, provider, primaryStyle: "主風格", assistStyle: "輔助風格" });

    expect(await readFile(join(root, "story-bible.md"), "utf8")).toContain("鬼樓");
    expect(await readFile(join(root, "outline.md"), "utf8")).toContain("十章");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/pipeline/planning.test.ts`

Expected: FAIL because planning modules do not exist.

- [ ] **Step 3: Implement prompt builders**

Create `src/pipeline/prompts.ts`:

```ts
export interface StylePromptInput {
  primaryStyle: string;
  assistStyle?: string;
}

export function composeStyleSystemPrompt(input: StylePromptInput): string {
  return [
    "你是長篇小說故事織造者。",
    "主風格決定敘事聲音、節奏、角色反應、章末鉤子和禁忌寫法。",
    input.primaryStyle,
    input.assistStyle
      ? `輔助風格只能提供可借用的敘事機制，不得覆蓋主風格聲音。\n${input.assistStyle}`
      : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function storyBiblePrompt(idea: string): string {
  return [
    "請建立長篇小說故事聖經，使用 Markdown。",
    "必須包含：核心賣點、主角、主要配角、世界規則、主線衝突、長線懸念、結局方向。",
    `題材：${idea}`
  ].join("\n");
}

export function wholeBookOutlinePrompt(storyBible: string): string {
  return [
    "請根據故事聖經建立全書大綱，使用 Markdown。",
    "必須包含：分卷規劃、每卷目標、主要轉折、伏筆回收節點。",
    storyBible
  ].join("\n\n");
}
```

- [ ] **Step 4: Implement planning pipeline**

Create `src/pipeline/planning.ts`:

```ts
import { readFile, writeFile } from "node:fs/promises";
import { LlmProvider } from "../llm/types.js";
import { buildStoryProjectPaths } from "../project/paths.js";
import { composeStyleSystemPrompt, storyBiblePrompt, wholeBookOutlinePrompt } from "./prompts.js";

export interface PlanningInput {
  root: string;
  provider: LlmProvider;
  primaryStyle: string;
  assistStyle?: string;
}

export interface StoryBibleInput extends PlanningInput {
  idea: string;
}

export async function generateStoryBible(input: StoryBibleInput): Promise<string> {
  const paths = buildStoryProjectPaths(input.root);
  const result = await input.provider.generateText({
    model: "mock",
    temperature: 0.7,
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
    model: "mock",
    temperature: 0.7,
    system: composeStyleSystemPrompt(input),
    prompt: wholeBookOutlinePrompt(storyBible)
  });
  await writeFile(paths.outline, result.text, "utf8");
  return result.text;
}
```

- [ ] **Step 5: Replace hard-coded model in planning input**

Modify `src/pipeline/planning.ts` so both generation functions receive `model` and `temperature`:

```ts
export interface PlanningInput {
  root: string;
  provider: LlmProvider;
  primaryStyle: string;
  assistStyle?: string;
  model: string;
  temperature: number;
}
```

Change both `generateText` calls to:

```ts
model: input.model,
temperature: input.temperature,
```

Update `tests/pipeline/planning.test.ts` calls to include:

```ts
model: "mock",
temperature: 0.7,
```

- [ ] **Step 6: Verify planning tests and typecheck**

Run: `npm test -- tests/pipeline/planning.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exits 0.

- [ ] **Step 7: Commit planning pipeline**

```bash
git add src/pipeline/prompts.ts src/pipeline/planning.ts tests/pipeline/planning.test.ts
git commit -m "feat: add planning pipeline" -- src/pipeline/prompts.ts src/pipeline/planning.ts tests/pipeline/planning.test.ts
```

## Task 7: Chapter Draft, Style Check, Rewrite, and Checkpoint Pipeline

**Files:**
- Create: `src/pipeline/chapter.ts`
- Create: `tests/pipeline/chapter.test.ts`
- Modify: `src/pipeline/prompts.ts`

- [ ] **Step 1: Write failing chapter pipeline test**

Create `tests/pipeline/chapter.test.ts`:

```ts
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { MockLlmProvider } from "../../src/llm/mockProvider.js";
import { writeChapter } from "../../src/pipeline/chapter.js";
import { createStoryProject } from "../../src/project/createProject.js";
import { readCheckpoint } from "../../src/state/checkpoints.js";

describe("writeChapter", () => {
  it("writes draft, review, rewrite, and checkpoint files", async () => {
    const root = await mkdtemp(join(tmpdir(), "chapter-"));
    await createStoryProject(root, {
      name: "story",
      provider: "openai-compatible",
      model: "mock",
      temperature: 0.7,
      primaryStyle: "靈異",
      assistStyle: "無限流",
      chapterCount: 10,
      chapterWordTarget: 2500,
      reviewMode: "auto",
      currentChapter: 0
    });
    await writeFile(join(root, "chapters", "chapter-001.outline.md"), "第一章：醒來就在鬼樓。", "utf8");

    const provider = new MockLlmProvider([
      "初稿正文",
      JSON.stringify({
        pass: false,
        issues: [{ type: "style_mismatch", severity: "high", evidence: "太慢", suggestion: "直接進異常" }],
        rewriteInstructions: ["直接進異常"]
      }),
      "改寫正文"
    ]);

    await writeChapter({
      root,
      chapter: 1,
      provider,
      model: "mock",
      temperature: 0.7,
      primaryStyle: "主風格",
      assistStyle: "輔助風格"
    });

    expect(await readFile(join(root, "chapters", "chapter-001.md"), "utf8")).toBe("改寫正文");
    expect(await readFile(join(root, "chapters", "chapter-001.review.md"), "utf8")).toContain("style_mismatch");
    expect((await readCheckpoint(root, 1)).accepted).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/pipeline/chapter.test.ts`

Expected: FAIL because `src/pipeline/chapter.ts` does not exist.

- [ ] **Step 3: Add chapter prompt builders**

Append to `src/pipeline/prompts.ts`:

```ts
export function chapterDraftPrompt(chapterOutline: string, currentState: string): string {
  return [
    "請根據章綱撰寫本章初稿。",
    "要求：直接進事件、保留章末鉤子、對話使用全形引號、不要寫總結式大道理。",
    "章綱：",
    chapterOutline,
    "目前狀態：",
    currentState
  ].join("\n\n");
}

export function styleCheckPrompt(chapterText: string): string {
  return [
    "請檢查本章是否符合主風格。只回傳 JSON。",
    "JSON 欄位：pass:boolean, issues:array, rewriteInstructions:array。",
    "正文：",
    chapterText
  ].join("\n\n");
}

export function rewritePrompt(chapterText: string, rewriteInstructions: string[]): string {
  return [
    "請依照改寫指令重寫本章。",
    "保留劇情事實、角色狀態、章節目的和連貫性，只修風格、節奏、AI 味和章末鉤子。",
    "改寫指令：",
    rewriteInstructions.map((item) => `- ${item}`).join("\n"),
    "原文：",
    chapterText
  ].join("\n\n");
}
```

- [ ] **Step 4: Implement chapter pipeline**

Create `src/pipeline/chapter.ts`:

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { StyleCheckSchema } from "../domain/schemas.js";
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
  const draftVersionPath = join(draftVersionDir, `${new Date().toISOString().replace(/[:.]/g, "")}-draft.md`);
  const rewriteVersionPath = join(draftVersionDir, `${new Date().toISOString().replace(/[:.]/g, "")}-rewrite.md`);
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
    provider: "openai-compatible",
    model: input.model,
    temperature: input.temperature,
    accepted: true
  });
}
```

- [ ] **Step 5: Replace hard-coded checkpoint provider**

Modify `src/pipeline/chapter.ts`:

```ts
import { ProviderName } from "../domain/types.js";
```

Change `WriteChapterInput` to include:

```ts
providerName: ProviderName;
```

Change checkpoint provider from:

```ts
provider: "openai-compatible",
```

to:

```ts
provider: input.providerName,
```

Update `tests/pipeline/chapter.test.ts` call to include:

```ts
providerName: "openai-compatible",
```

- [ ] **Step 6: Verify chapter tests and typecheck**

Run: `npm test -- tests/pipeline/chapter.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exits 0.

- [ ] **Step 7: Commit chapter pipeline**

```bash
git add src/pipeline/chapter.ts src/pipeline/prompts.ts tests/pipeline/chapter.test.ts
git commit -m "feat: add chapter writing pipeline" -- src/pipeline/chapter.ts src/pipeline/prompts.ts tests/pipeline/chapter.test.ts
```

## Task 8: Review Menu, Editor Helpers, and CLI Command Wiring

**Files:**
- Create: `src/review/menu.ts`
- Create: `src/review/editor.ts`
- Modify: `src/cli/program.ts`
- Modify: `tests/cli/program.test.ts`

- [ ] **Step 1: Extend CLI tests for required commands**

Modify `tests/cli/program.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createProgram } from "../../src/cli/program.js";
import { VERSION } from "../../src/version.js";

describe("createProgram", () => {
  it("exposes the configured CLI name and version", () => {
    const program = createProgram();

    expect(program.name()).toBe("story-weaver");
    expect(program.version()).toBe(VERSION);
  });

  it("registers MVP commands", () => {
    const commandNames = createProgram().commands.map((command) => command.name());

    expect(commandNames).toEqual(
      expect.arrayContaining(["init", "quick", "guided", "plan", "write", "rewrite", "status", "edit"])
    );
  });
});
```

- [ ] **Step 2: Run CLI tests to verify failure**

Run: `npm test -- tests/cli/program.test.ts`

Expected: FAIL because `plan`, `write`, `rewrite`, `status`, and `edit` are not registered.

- [ ] **Step 3: Implement review helpers**

Create `src/review/menu.ts`:

```ts
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export type ReviewDecision = "accept" | "edit" | "regenerate" | "abort";

export async function askReviewDecision(prompt: string): Promise<ReviewDecision> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`${prompt} [accept/edit/regenerate/abort]: `);
    if (answer === "accept" || answer === "edit" || answer === "regenerate" || answer === "abort") {
      return answer;
    }
    throw new Error(`Invalid review decision: ${answer}`);
  } finally {
    rl.close();
  }
}
```

Create `src/review/editor.ts`:

```ts
import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

export async function editTextInEditor(initialText: string, editor = process.env.EDITOR ?? "vi"): Promise<string> {
  const tempPath = join(tmpdir(), `story-weaver-edit-${process.pid}-${Date.now()}.md`);
  await writeFile(tempPath, initialText, "utf8");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(editor, [tempPath], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });
  });

  return readFile(tempPath, "utf8");
}

export async function editJsonInEditor<T>(
  value: T,
  schema: z.ZodType<T>,
  editor = process.env.EDITOR ?? "vi"
): Promise<T> {
  const edited = await editTextInEditor(`${JSON.stringify(value, null, 2)}\n`, editor);
  return schema.parse(JSON.parse(edited));
}
```

- [ ] **Step 4: Wire CLI command skeletons**

Replace `src/cli/program.ts` with:

```ts
import { Command } from "commander";
import { createStoryProject } from "../project/createProject.js";
import { writeChapter } from "../pipeline/chapter.js";
import { readProjectConfig } from "../project/store.js";
import { createLlmProvider } from "../llm/factory.js";
import { readCharacters, readContinuity, readFacts, readForeshadowing } from "../state/stateStore.js";
import { VERSION } from "../version.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("story-weaver")
    .description("Plan, draft, review, and continue long-form stories with LLMs.")
    .version(VERSION);

  program
    .command("init")
    .requiredOption("--name <name>")
    .requiredOption("--style <style>")
    .option("--assist-style <style>")
    .option("--chapters <count>", "Chapter count", "30")
    .option("--provider <provider>", "Provider", "openai-compatible")
    .option("--model <model>", "Model", "local-model")
    .option("--temperature <number>", "Temperature", "0.8")
    .action(async (options) => {
      await createStoryProject(process.cwd(), {
        name: options.name,
        provider: options.provider,
        model: options.model,
        temperature: Number(options.temperature),
        primaryStyle: options.style,
        assistStyle: options.assistStyle,
        chapterCount: Number(options.chapters),
        chapterWordTarget: 2500,
        reviewMode: "gated",
        currentChapter: 0
      });
    });

  program.command("quick").description("Create a story from a short idea.");
  program.command("guided").description("Create a story through interactive prompts.");

  const plan = program.command("plan").description("Generate planning artifacts.");
  plan.command("bible").description("Generate or regenerate the story bible.");
  plan.command("outline").description("Generate or regenerate the whole-book outline.");
  plan.command("volumes").description("Generate or regenerate volume outlines.");
  plan.command("chapters").description("Generate or regenerate chapter outlines.");

  program
    .command("write")
    .requiredOption("--from <chapter>")
    .requiredOption("--to <chapter>")
    .action(async (options) => {
      const config = await readProjectConfig(process.cwd());
      const provider = createLlmProvider({
        provider: config.provider,
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL
      });
      for (let chapter = Number(options.from); chapter <= Number(options.to); chapter += 1) {
        await writeChapter({
          root: process.cwd(),
          chapter,
          provider,
          providerName: config.provider,
          model: config.model,
          temperature: config.temperature,
          primaryStyle: config.primaryStyle,
          assistStyle: config.assistStyle
        });
      }
    });

  program.command("rewrite").requiredOption("--chapter <chapter>").description("Rewrite one chapter.");

  const status = program.command("status").description("Inspect structured story state.");
  status.command("characters").action(async () => console.log(JSON.stringify(await readCharacters(process.cwd()), null, 2)));
  status.command("foreshadowing").action(async () => console.log(JSON.stringify(await readForeshadowing(process.cwd()), null, 2)));
  status.command("continuity").action(async () => console.log(JSON.stringify(await readContinuity(process.cwd()), null, 2)));
  status.command("facts").action(async () => console.log(JSON.stringify(await readFacts(process.cwd()), null, 2)));

  const edit = program.command("edit").description("Edit structured story state.");
  edit.command("character <id>").description("Edit one character.");
  edit.command("foreshadowing <id>").description("Edit one foreshadowing item.");
  edit.command("fact <id>").description("Edit one world fact.");

  return program;
}
```

- [ ] **Step 5: Verify CLI tests and typecheck**

Run: `npm test -- tests/cli/program.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exits 0.

- [ ] **Step 6: Commit CLI wiring**

```bash
git add src/review/menu.ts src/review/editor.ts src/cli/program.ts tests/cli/program.test.ts
git commit -m "feat: wire CLI command skeleton" -- src/review/menu.ts src/review/editor.ts src/cli/program.ts tests/cli/program.test.ts
```

## Task 9: Status and Edit Commands

**Files:**
- Modify: `src/cli/program.ts`
- Create: `tests/cli/status-edit.test.ts`

- [ ] **Step 1: Write failing status/edit behavior tests**

Create `tests/cli/status-edit.test.ts`:

```ts
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createStoryProject } from "../../src/project/createProject.js";
import { writeCharacters } from "../../src/state/stateStore.js";
import { readCharacters } from "../../src/state/stateStore.js";

describe("status and edit support", () => {
  it("state store supports character edits used by CLI", async () => {
    const root = await mkdtemp(join(tmpdir(), "edit-"));
    await createStoryProject(root, {
      name: "story",
      provider: "openai",
      model: "gpt-test",
      temperature: 0.7,
      primaryStyle: "靈異",
      chapterCount: 10,
      chapterWordTarget: 2500,
      reviewMode: "gated",
      currentChapter: 0
    });

    await writeCharacters(root, [
      {
        id: "char-main",
        name: "林缺",
        role: "protagonist",
        status: "injured",
        secrets: [],
        relationships: [],
        recentChapters: [1]
      }
    ]);

    const characters = await readCharacters(root);
    characters[0].status = "alive";
    await writeCharacters(root, characters);

    expect((await readCharacters(root))[0].status).toBe("alive");
  });
});
```

- [ ] **Step 2: Run status/edit test**

Run: `npm test -- tests/cli/status-edit.test.ts`

Expected: PASS because the underlying state store already supports validated writes.

- [ ] **Step 3: Add concrete edit command behavior**

Modify `src/cli/program.ts` imports:

```ts
import { CharacterSchema, FactSchema, ForeshadowingSchema } from "../domain/schemas.js";
import { editJsonInEditor } from "../review/editor.js";
import {
  readCharacters,
  readContinuity,
  readFacts,
  readForeshadowing,
  writeCharacters,
  writeFacts,
  writeForeshadowing
} from "../state/stateStore.js";
```

Replace edit command definitions with:

```ts
  const edit = program.command("edit").description("Edit structured story state.");
  edit.command("character <id>").action(async (id) => {
    const items = await readCharacters(process.cwd());
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Character not found: ${id}`);
    }
    items[index] = await editJsonInEditor(items[index], CharacterSchema);
    await writeCharacters(process.cwd(), items);
  });
  edit.command("foreshadowing <id>").action(async (id) => {
    const items = await readForeshadowing(process.cwd());
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Foreshadowing item not found: ${id}`);
    }
    items[index] = await editJsonInEditor(items[index], ForeshadowingSchema);
    await writeForeshadowing(process.cwd(), items);
  });
  edit.command("fact <id>").action(async (id) => {
    const items = await readFacts(process.cwd());
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Fact not found: ${id}`);
    }
    items[index] = await editJsonInEditor(items[index], FactSchema);
    await writeFacts(process.cwd(), items);
  });
```

- [ ] **Step 4: Verify all CLI-related tests and typecheck**

Run: `npm test -- tests/cli/program.test.ts tests/cli/status-edit.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exits 0.

- [ ] **Step 5: Commit status and edit commands**

```bash
git add src/cli/program.ts tests/cli/status-edit.test.ts
git commit -m "feat: add state status and edit commands" -- src/cli/program.ts tests/cli/status-edit.test.ts
```

## Task 10: End-to-End Mock Workflow and Documentation

**Files:**
- Create: `tests/pipeline/e2e-mock.test.ts`
- Create: `README.md`
- Modify: `src/cli/program.ts`

- [ ] **Step 1: Write end-to-end mock workflow test**

Create `tests/pipeline/e2e-mock.test.ts`:

```ts
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createStoryProject } from "../../src/project/createProject.js";
import { loadStyleSelection } from "../../src/styles/loadStyles.js";
import { MockLlmProvider } from "../../src/llm/mockProvider.js";
import { generateStoryBible, generateWholeBookOutline } from "../../src/pipeline/planning.js";
import { writeChapter } from "../../src/pipeline/chapter.js";
import { readCheckpoint } from "../../src/state/checkpoints.js";

describe("mock story workflow", () => {
  it("runs quick-style planning and one chapter without real LLM calls", async () => {
    const root = await mkdtemp(join(tmpdir(), "e2e-"));
    const stylesDir = join(root, "styles");
    const storyRoot = join(root, "story");
    await mkdir(stylesDir);
    await writeFile(join(stylesDir, "靈異.md"), "把鬼寫回人。", "utf8");
    await writeFile(join(stylesDir, "無限流.md"), "規則局和倒計時。", "utf8");

    await createStoryProject(storyRoot, {
      name: "story",
      provider: "openai-compatible",
      model: "mock",
      temperature: 0.7,
      primaryStyle: "靈異",
      assistStyle: "無限流",
      chapterCount: 3,
      chapterWordTarget: 2000,
      reviewMode: "auto",
      currentChapter: 0
    });

    const styles = await loadStyleSelection(stylesDir, "靈異", "無限流");
    const provider = new MockLlmProvider([
      "# Story Bible\n\n鬼樓與住戶。",
      "# Whole-Book Outline\n\n三章。",
      "第一章正文初稿",
      JSON.stringify({ pass: true, issues: [], rewriteInstructions: [] })
    ]);

    await generateStoryBible({
      root: storyRoot,
      provider,
      model: "mock",
      temperature: 0.7,
      idea: "鬼樓",
      primaryStyle: styles.primary.content,
      assistStyle: styles.assist?.content
    });
    await generateWholeBookOutline({
      root: storyRoot,
      provider,
      model: "mock",
      temperature: 0.7,
      primaryStyle: styles.primary.content,
      assistStyle: styles.assist?.content
    });

    await writeFile(join(storyRoot, "chapters", "chapter-001.outline.md"), "第一章：住戶醒來。", "utf8");
    await writeChapter({
      root: storyRoot,
      chapter: 1,
      provider,
      providerName: "openai-compatible",
      model: "mock",
      temperature: 0.7,
      primaryStyle: styles.primary.content,
      assistStyle: styles.assist?.content
    });

    expect(await readFile(join(storyRoot, "chapters", "chapter-001.md"), "utf8")).toBe("第一章正文初稿");
    expect((await readCheckpoint(storyRoot, 1)).accepted).toBe(true);
  });
});
```

- [ ] **Step 2: Run the end-to-end mock test**

Run: `npm test -- tests/pipeline/e2e-mock.test.ts`

Expected: PASS.

- [ ] **Step 3: Add README usage documentation**

Create `README.md`:

````md
# Story Weaver

Story Weaver is a TypeScript Node.js CLI for planning and drafting long-form fiction with LLMs. It loads writing guidance from `styles/*.md`, supports a primary style plus optional assist style, and stores story output as Markdown plus structured JSON state.

## Install

```bash
npm install
npm run build
```

## Configure

API keys are read from environment variables:

```bash
export OPENAI_API_KEY=...
export ANTHROPIC_API_KEY=...
export GEMINI_API_KEY=...
export OPENAI_COMPATIBLE_BASE_URL=http://localhost:11434/v1
```

Project files never store API keys.

## Create a Story Project

```bash
story-weaver init --name old-apartment --style 靈異 --assist-style 無限流 --chapters 80 --provider openai-compatible --model local-model
```

## Generate Chapters

```bash
story-weaver write --from 1 --to 5
```

Each chapter writes a checkpoint so generation can resume from a failed chapter.

## Inspect State

```bash
story-weaver status characters
story-weaver status foreshadowing
story-weaver status continuity
```

## Edit State

```bash
story-weaver edit character char-main
story-weaver edit foreshadowing clue-001
story-weaver edit fact rule-001
```
````

- [ ] **Step 4: Run full verification**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run typecheck`

Expected: exits 0.

Run: `npm run build`

Expected: exits 0 and creates `dist/`.

- [ ] **Step 5: Commit E2E test and docs**

```bash
git add tests/pipeline/e2e-mock.test.ts README.md src/cli/program.ts
git commit -m "test: add mock end-to-end workflow" -- tests/pipeline/e2e-mock.test.ts README.md src/cli/program.ts
```

## Task 11: Complete Quick, Guided, Volume Planning, and Chapter Outline Workflows

**Files:**
- Create: `src/cli/actions.ts`
- Create: `tests/cli/actions.test.ts`
- Modify: `src/cli/program.ts`
- Modify: `src/pipeline/prompts.ts`
- Modify: `src/pipeline/planning.ts`
- Modify: `tests/pipeline/planning.test.ts`

- [ ] **Step 1: Add tests for config-to-provider resolution**

Create `tests/cli/actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildProjectConfigFromOptions,
  providerFactoryConfigFromProject
} from "../../src/cli/actions.js";

describe("CLI actions", () => {
  it("builds project config from quick options and global defaults", () => {
    const config = buildProjectConfigFromOptions(
      {
        name: "ghost-house",
        style: "靈異",
        assistStyle: "無限流",
        chapters: "12",
        chapterWordTarget: "2200",
        provider: undefined,
        model: undefined,
        temperature: undefined,
        auto: true
      },
      { provider: "openai-compatible", model: "local-model", temperature: 0.6 }
    );

    expect(config.provider).toBe("openai-compatible");
    expect(config.model).toBe("local-model");
    expect(config.reviewMode).toBe("auto");
  });

  it("uses provider-specific API key environment variables", () => {
    const providerConfig = providerFactoryConfigFromProject(
      {
        name: "story",
        provider: "anthropic",
        model: "claude-test",
        temperature: 0.7,
        primaryStyle: "靈異",
        chapterCount: 10,
        chapterWordTarget: 2500,
        reviewMode: "gated",
        currentChapter: 0
      },
      { ANTHROPIC_API_KEY: "anthropic-key" }
    );

    expect(providerConfig.apiKey).toBe("anthropic-key");
  });
});
```

- [ ] **Step 2: Run action tests to verify they fail**

Run: `npm test -- tests/cli/actions.test.ts`

Expected: FAIL because `src/cli/actions.ts` does not exist.

- [ ] **Step 3: Implement CLI action helpers**

Create `src/cli/actions.ts`:

```ts
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
```

- [ ] **Step 4: Add volume and chapter-outline prompt builders**

Append to `src/pipeline/prompts.ts`:

```ts
export function volumeOutlinesPrompt(storyBible: string, wholeBookOutline: string): string {
  return [
    "請根據故事聖經與全書大綱產生分卷大綱，使用 Markdown。",
    "第一版請產出第一卷，包含本卷目標、主要轉折、角色變化、伏筆安排。",
    "故事聖經：",
    storyBible,
    "全書大綱：",
    wholeBookOutline
  ].join("\n\n");
}

export function chapterOutlinesPrompt(storyBible: string, wholeBookOutline: string): string {
  return [
    "請產生章綱 JSON。只回傳 JSON array。",
    "每個元素欄位：chapter:number, title:string, outline:string。",
    "故事聖經：",
    storyBible,
    "全書大綱：",
    wholeBookOutline
  ].join("\n\n");
}
```

- [ ] **Step 5: Add volume and chapter-outline pipeline functions**

Modify `src/pipeline/planning.ts` imports:

```ts
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
```

Append to `src/pipeline/planning.ts`:

```ts
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
    await writeFile(paths.chaptersDir + `/${slug}.outline.md`, `# ${slug}: ${item.title}\n\n${item.outline}\n`, "utf8");
  }
}
```

- [ ] **Step 6: Extend planning test for volume and chapter outlines**

Modify `tests/pipeline/planning.test.ts` imports:

```ts
import {
  generateChapterOutlines,
  generateStoryBible,
  generateVolumeOutlines,
  generateWholeBookOutline
} from "../../src/pipeline/planning.js";
```

Change the mock provider responses to:

```ts
const provider = new MockLlmProvider([
  "# Story Bible\n\n主角和鬼樓。",
  "# Whole-Book Outline\n\n十章。",
  "# Volume 1\n\n第一卷。",
  JSON.stringify([{ chapter: 1, title: "醒來", outline: "主角在鬼樓醒來。" }])
]);
```

After `generateWholeBookOutline`, add:

```ts
await generateVolumeOutlines({ root, provider, model: "mock", temperature: 0.7, primaryStyle: "主風格", assistStyle: "輔助風格" });
await generateChapterOutlines({ root, provider, model: "mock", temperature: 0.7, primaryStyle: "主風格", assistStyle: "輔助風格" });
```

Add assertions:

```ts
expect(await readFile(join(root, "volumes", "volume-001.md"), "utf8")).toContain("第一卷");
expect(await readFile(join(root, "chapters", "chapter-001.outline.md"), "utf8")).toContain("主角在鬼樓醒來");
```

- [ ] **Step 7: Wire quick and guided commands**

Modify `src/cli/program.ts` imports:

```ts
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runQuickWorkflow } from "./actions.js";
```

Replace the `quick` and `guided` command skeletons with:

```ts
  program
    .command("quick")
    .requiredOption("--style <style>")
    .requiredOption("--idea <idea>")
    .option("--name <name>")
    .option("--assist-style <style>")
    .option("--chapters <count>", "Chapter count", "30")
    .option("--chapter-word-target <count>", "Target words per chapter", "2500")
    .option("--provider <provider>")
    .option("--model <model>")
    .option("--temperature <number>")
    .option("--auto")
    .action(async (options) => {
      const root = await runQuickWorkflow(options);
      console.log(`Story project created at ${root}`);
    });

  program.command("guided").action(async () => {
    const rl = createInterface({ input, output });
    try {
      const name = await rl.question("Story folder name: ");
      const style = await rl.question("Primary style: ");
      const assistStyle = await rl.question("Assist style (optional): ");
      const idea = await rl.question("Story idea: ");
      const chapters = await rl.question("Chapter count: ");
      const root = await runQuickWorkflow({
        name,
        style,
        assistStyle: assistStyle || undefined,
        idea,
        chapters,
        auto: false
      });
      console.log(`Story project created at ${root}`);
    } finally {
      rl.close();
    }
  });
```

- [ ] **Step 8: Verify extended workflow tests and typecheck**

Run: `npm test -- tests/cli/actions.test.ts tests/pipeline/planning.test.ts tests/cli/program.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exits 0.

- [ ] **Step 9: Commit completed workflow coverage**

```bash
git add src/cli/actions.ts tests/cli/actions.test.ts src/cli/program.ts src/pipeline/prompts.ts src/pipeline/planning.ts tests/pipeline/planning.test.ts
git commit -m "feat: complete quick and planning workflows" -- src/cli/actions.ts tests/cli/actions.test.ts src/cli/program.ts src/pipeline/prompts.ts src/pipeline/planning.ts tests/pipeline/planning.test.ts
```

## Final Verification

- [ ] Run `npm test`

Expected: all tests PASS.

- [ ] Run `npm run typecheck`

Expected: exits 0.

- [ ] Run `npm run build`

Expected: exits 0.

- [ ] Run `git status --short`

Expected: only unrelated pre-existing files remain, or a clean tree if those were handled separately by the user.

- [ ] Confirm the implementation satisfies the accepted spec:

```text
quick/guided can create story projects and produce planning files
styles can be loaded from markdown files
project output uses Markdown plus JSON
story bible, whole-book outline, volume outline, and chapter outline files are generated
chapter writing creates draft/review/final/checkpoint files
chapter range writes one checkpoint per chapter
state can be inspected and edited
default tests use mock providers only
API keys are read from environment variables, not project files
```
