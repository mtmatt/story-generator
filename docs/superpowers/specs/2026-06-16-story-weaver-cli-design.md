# Story Weaver CLI Design

Date: 2026-06-16

## Purpose

Build a TypeScript Node.js CLI for long-form fiction generation. The tool uses LLMs to plan, draft, review, rewrite, and continue serialized stories while applying the writing guidance stored in `styles/*.md`.

The first version is a core-first MVP: it should run a complete story workflow, preserve human control at key checkpoints, and keep enough structured state to continue or rerun chapters safely. It will not try to solve every advanced literary quality problem in the first release.

## Current Repository Context

The repository currently contains style guidance files:

- `styles/無限流.md`
- `styles/修仙爽文.md`
- `styles/靈異.md`

These files are natural-language writing guides. They should be treated as prompt assets, not converted into hard-coded enum rules. The repository also contains `Humanizer-zh-TW`, which can inform future anti-AI-writing review behavior, but the first design keeps the core style review inside this CLI.

## Product Shape

The first version is a CLI. It will expose reusable TypeScript modules underneath the CLI so a future Web App or API Server can reuse the same core workflow.

Two creation modes are required:

- `quick`: minimal input. The user provides a style, optional assist style, an idea, and chapter count. The tool fills in the story bible and planning details.
- `guided`: interactive input. The CLI asks questions and builds a story bible before planning.

The tool defaults to human review at key generation gates, but supports `--auto` for unattended generation.

## Architecture

The implementation should be split into modules with clear boundaries:

- `cli`: command parsing, interactive menus, `$EDITOR` launch, and user-facing output.
- `project`: story project creation, loading, validation, and file layout management.
- `styles`: scanning `styles/*.md`, loading primary and assist styles, and composing style prompt sections.
- `llm`: provider adapters for OpenAI, Anthropic, Gemini, and OpenAI-compatible endpoints.
- `pipeline`: story bible, whole-book outline, volume outline, chapter outline, chapter draft, style check, rewrite, state update.
- `state`: characters, foreshadowing, facts, continuity, checkpoints, and state snapshots.
- `review`: accept/edit/regenerate/abort gates, temporary edit files, schema validation, and recovery from invalid edits.

The CLI should stay thin. Generation logic should live in core modules.

## CLI Commands

Expected commands:

```bash
story-weaver init
story-weaver quick
story-weaver guided
story-weaver plan bible
story-weaver plan outline
story-weaver plan volumes
story-weaver plan chapters
story-weaver write --from 1 --to 5
story-weaver rewrite --chapter 3
story-weaver status characters
story-weaver status foreshadowing
story-weaver status continuity
story-weaver edit character <id>
story-weaver edit foreshadowing <id>
story-weaver edit fact <id>
```

Example creation commands:

```bash
story-weaver quick --style 靈異 --assist-style 無限流 --idea "一棟會重置住戶記憶的老公寓" --chapters 80
story-weaver guided
```

`write --from 1 --to 5` generates a chapter range. Internally, each chapter is still its own checkpoint. The user can restart from any chapter.

## Story Project Layout

Each story project is a directory containing human-readable Markdown and machine-readable JSON.

```text
my-story/
  project.json
  story-bible.md
  outline.md
  volumes/
    volume-001.md
  chapters/
    chapter-001.md
    chapter-001.review.md
    chapter-001.v2.md
  state/
    state.json
    characters.json
    foreshadowing.json
    continuity.json
    facts.json
  checkpoints/
    chapter-001.json
    chapter-002.json
  versions/
    chapter-001/
      2026-06-16T120000-draft.md
      2026-06-16T120500-rewrite.md
```

`project.json` stores non-secret project settings:

- provider
- model
- temperature
- primary style
- assist style
- chapter count
- target chapter length
- review mode
- current progress

API keys must not be stored in project files.

## Configuration

Configuration is merged from three sources:

1. Environment variables for secrets only:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `GEMINI_API_KEY`
2. Global config at `~/.story-weaver/config.json`:
   - default provider
   - default model
   - default temperature
   - OpenAI-compatible base URL
3. Project config in `project.json`:
   - provider/model overrides
   - temperature
   - chapter word target
   - style and assist style
   - review mode

Project config overrides global config. Environment variables provide secrets only.

## LLM Providers

All providers should implement a common interface:

```ts
interface LlmProvider {
  generateText(request: GenerateTextRequest): Promise<GenerateTextResult>;
  generateJson<T>(request: GenerateJsonRequest<T>): Promise<T>;
}
```

Supported provider types:

- `openai`
- `anthropic`
- `gemini`
- `openai-compatible`

Model names should not be hard-coded to a fixed allowlist. Users can configure any model id supported by their selected provider. OpenAI-compatible providers must support `baseUrl` for tools such as Ollama, LM Studio, vLLM, or other compatible servers.

## Long-Form Generation Flow

The long-form structure combines up-front planning with rolling chapter state:

```text
input settings
→ story bible
→ whole-book outline
→ volume outlines
→ chapter outlines
→ chapter draft
→ style check
→ rewrite
→ state update
→ checkpoint
```

`quick` and `guided` only differ in how initial settings and the story bible are produced. After that, they share the same pipeline.

Default gates:

- story bible review
- whole-book outline review
- volume outline review
- chapter outline review
- chapter output review

With `--auto`, the CLI skips human review gates and proceeds until completion or error.

## Chapter Checkpoints and Reruns

Each chapter checkpoint records:

- chapter number
- chapter outline used
- primary style and assist style used
- draft file path
- style check file path
- rewrite file path
- state snapshot before generation
- state snapshot after generation
- provider, model, and temperature
- user acceptance status
- failed pipeline step, if any

Rerun behavior:

- `write --from 3 --to 8` starts at chapter 3 and writes each chapter checkpoint independently.
- If chapter 5 fails, chapters 3 and 4 remain completed. The user can resume from chapter 5.
- `rewrite --chapter 3` rewrites only chapter 3 by default.
- After rewriting a past chapter, the CLI warns that later state may be stale.
- If the user chooses to recalculate, the pipeline reruns state updates or downstream chapters from the selected chapter.
- Old drafts are never silently overwritten. Previous versions are saved under `versions/`.

## Style System

`styles/*.md` are first-class writing assets. The style file name is the selectable style name.

The prompt composition has three layers:

1. Primary style: controls the main narrative voice, genre promise, pacing, character reactions, chapter hooks, and forbidden patterns.
2. Assist style: contributes borrowed mechanics only, such as closed-space rules, countdowns, information asymmetry, or progression-fantasy pressure. It must not override the primary style's voice.
3. Task prompt: describes the exact artifact being generated, such as story bible, outline, draft, style check, rewrite, or state update.

The style check is structured JSON, not a prose-only critique. Example shape:

```json
{
  "pass": false,
  "issues": [
    {
      "type": "style_mismatch",
      "severity": "high",
      "evidence": "章節開頭鋪墊太久，沒有直接進異常事件",
      "suggestion": "刪掉背景介紹，第一段改成具體異常場景"
    }
  ],
  "rewriteInstructions": ["刪除開場背景介紹，第一段直接進入具體異常場景"]
}
```

The default chapter workflow is:

```text
chapter outline + current state + style prompt
→ draft
→ style check
→ rewrite
```

The rewrite must preserve plot facts, character state, chapter purpose, and continuity. It should change style, pacing, AI-writing artifacts, and chapter hooks. If style check passes, the CLI may accept the draft without rewriting.

## State Model

State is split across focused JSON files:

- `characters.json`: character id, name, role, current status, secrets, relationships, recent appearances.
- `foreshadowing.json`: foreshadowing id, planted chapter, status, payoff plan, payoff chapter.
- `facts.json`: world facts, rules, constraints, and disclosure level.
- `continuity.json`: timeline, locations, important objects, and unresolved contradictions.
- `state.json`: global progress, latest checkpoint, current volume/chapter, and state version.

This split keeps files readable and lets commands validate or edit one state domain at a time.

## Status and Editing

Status commands show structured state without requiring the user to open JSON manually:

```bash
story-weaver status characters
story-weaver status foreshadowing --open
story-weaver status continuity
```

Edit commands:

```bash
story-weaver edit character <id>
story-weaver edit foreshadowing <id>
story-weaver edit fact <id>
```

Editing behavior:

- The CLI opens a temporary readable file in `$EDITOR`.
- After save and close, the CLI parses and validates the edit.
- If validation passes, it writes back to the relevant JSON file.
- If validation fails, it shows field-level errors and lets the user reopen the edit.
- Invalid edits must not overwrite the previous valid state.

If `$EDITOR` is unset, the CLI defaults to `vi`. A configured editor in global config can override this.

## Human Review

Review gates use a hybrid interaction model:

- Short decisions use a terminal menu: `accept`, `edit`, `regenerate`, `abort`.
- Long text and state edits open `$EDITOR`.
- Saved edits are schema-validated before being accepted.
- `--auto` bypasses review gates.

This keeps the CLI fast for simple decisions while still making long-form planning and chapter edits comfortable.

## Error Handling

The tool should fail conservatively and preserve work:

- LLM API failures: retry a limited number of times. If still failing, stop at the current step and record the error in the checkpoint.
- JSON parse failures: ask the model to repair JSON using the same context. If repair fails, save the raw response for inspection.
- Schema validation failures: show field errors and allow manual repair in `$EDITOR`.
- Ctrl+C: preserve completed steps and do not mark the current chapter complete.
- Missing provider config or API key: check before execution and report the exact missing setting.

## Testing Strategy

Default tests must not call real LLM APIs.

Test coverage should include:

- Unit tests for style scanning, config merge, schema validation, file naming, and checkpoint read/write.
- Provider tests using mock providers.
- Pipeline tests using fixed mock responses for a minimal `quick → plan → write` flow.
- CLI tests for command arguments, missing config, and user-facing errors.

Real-provider tests can exist separately, but they must be opt-in because they cost money and depend on external services.

## First Release Scope

Included:

- TypeScript Node.js CLI.
- `quick` and `guided` creation.
- Primary plus assist style selection.
- OpenAI, Anthropic, Gemini, and OpenAI-compatible providers.
- Story bible, whole-book outline, volume outline, chapter outline, chapter draft, style check, rewrite, and state update.
- Markdown and JSON project output.
- Chapter range writing with per-chapter checkpoints.
- Rerun from any chapter.
- Status and edit commands for characters, foreshadowing, facts, and continuity.
- Global config plus project overrides.
- Mocked tests for core behavior.

Deferred:

- Web UI.
- HTTP API server.
- Rich literary scoring beyond style check.
- Vector database or embedding memory.
- Real-provider tests in the default test suite.
- Automatic publishing/export to ebook formats.

## Acceptance Criteria

The first version is acceptable when:

- A user can create a new story with `quick` or `guided`.
- The CLI can load style files from `styles/`.
- A user can generate planning artifacts and at least one chapter through draft, style check, rewrite, state update, and checkpoint.
- A user can generate a chapter range and resume from a failed chapter.
- A user can rerun a selected chapter without losing previous versions.
- A user can inspect and edit structured story state.
- API keys are never written to project files.
- Default tests pass without real LLM calls.
