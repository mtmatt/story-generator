# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                          # run all tests (vitest, no real LLM calls)
npm test -- tests/path/to/file.test.ts   # run a single test file
npm run typecheck                 # tsc --noEmit (no emit, checks types only)
npm run build                     # tsc -p tsconfig.build.json (outputs to dist/)
npm run dev                       # run CLI directly via tsx (no build needed)
```

To run a single named test use vitest's `-t` flag:
```bash
npm test -- -t "test name substring"
```

## Architecture

The CLI is a thin layer over reusable core modules. `src/cli/` wires Commander commands to pipeline functions; generation logic lives in `src/pipeline/`.

### Module map

| Directory | Responsibility |
|---|---|
| `src/domain/` | Zod schemas (`schemas.ts`) and inferred TypeScript types (`types.ts`) — the single source of truth for all data shapes |
| `src/fs/` | `readJsonFile` (Zod-validated) and `writeJsonFile` (atomic via `.tmp` + rename) |
| `src/project/` | Story project layout (`paths.ts`), scaffolding (`createProject.ts`), and project config read/write (`store.ts`) |
| `src/styles/` | Scans `styles/*.md`, loads primary and optional assist style content |
| `src/config/` | Merges `~/.story-weaver/config.json` (global) with `project.json` (project wins) |
| `src/llm/` | `LlmProvider` interface, four HTTP adapters (OpenAI, Anthropic, Gemini, openai-compatible), `MockLlmProvider` for tests, `createLlmProvider` factory |
| `src/pipeline/` | `prompts.ts` builds all LLM prompts; `planning.ts` runs story bible → outline → volume → chapter-outlines; `chapter.ts` runs draft → style-check → rewrite → checkpoint |
| `src/state/` | `stateStore.ts` CRUD for characters/foreshadowing/facts/continuity/story state; `checkpoints.ts` per-chapter checkpoint read/write |
| `src/review/` | `menu.ts` terminal accept/edit/regenerate/abort prompt; `editor.ts` opens `$EDITOR` for text or JSON editing with Zod validation on save |
| `src/cli/` | `program.ts` Commander wiring; `actions.ts` `runQuickWorkflow` orchestration and config/provider helpers |

### Data flow

```
story-weaver quick/guided
  → runQuickWorkflow (actions.ts)
    → createStoryProject       [project layout + seed files]
    → loadStyleSelection       [loads styles/*.md content]
    → createLlmProvider        [reads API keys from env]
    → generateStoryBible       [LLM → story-bible.md]
    → generateWholeBookOutline [LLM → outline.md]
    → generateVolumeOutlines   [LLM → volumes/volume-001.md]
    → generateChapterOutlines  [LLM → chapters/chapter-NNN.outline.md]

story-weaver write --from N --to M
  → writeChapter (per chapter)
    → generateText   [draft]
    → generateJson   [style check → StyleCheckSchema]
    → generateText?  [rewrite, only if style check fails]
    → writeCheckpoint
```

### Key design constraints

**No real LLM calls in tests.** All tests use `MockLlmProvider` which dequeues pre-seeded string responses in order. `generateJson` consumes one slot and parses it as JSON.

**API keys never in project files.** `project.json` stores provider name/model/config. Keys come only from environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`).

**Atomic writes.** `writeJsonFile` writes to `<path>.tmp` then renames, so crashes never leave corrupt state files.

**Style prompt layering.** `composeStyleSystemPrompt` in `prompts.ts` assembles: (1) primary style content — controls voice/pacing/hooks; (2) optional assist style — mechanics only, cannot override primary voice. Style content comes from `styles/*.md` files loaded as raw strings.

**Chapter versioning.** `writeChapter` saves every draft and rewrite under `versions/chapter-NNN/<timestamp>-draft.md` / `…-rewrite.md`. The final accepted text goes to `chapters/chapter-NNN.md`. Old files are never silently overwritten.

### Provider factory

`createLlmProvider(config: ProviderFactoryConfig)` in `src/llm/factory.ts` takes `{ provider, apiKey?, baseUrl?, responses? }`. Pass `provider: "mock"` with a `responses` array in tests. The `openai-compatible` provider requires `baseUrl` (e.g., Ollama at `http://localhost:11434/v1`).

All HTTP providers strip markdown code fences before `JSON.parse` in `generateJson` (via `stripJsonFences` in `src/llm/types.ts`).
