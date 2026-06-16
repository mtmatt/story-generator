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
