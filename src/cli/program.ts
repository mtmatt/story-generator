import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Command } from "commander";
import { createStoryProject } from "../project/createProject.js";
import { runQuickWorkflow } from "./actions.js";
import { writeChapter } from "../pipeline/chapter.js";
import { readProjectConfig } from "../project/store.js";
import { createLlmProvider } from "../llm/factory.js";
import { providerFactoryConfigFromProject } from "./actions.js";
import {
  readCharacters,
  readContinuity,
  readFacts,
  readForeshadowing,
  writeCharacters,
  writeFacts,
  writeForeshadowing
} from "../state/stateStore.js";
import { CharacterSchema, FactSchema, ForeshadowingSchema } from "../domain/schemas.js";
import { editJsonInEditor } from "../review/editor.js";
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
      const provider = createLlmProvider(providerFactoryConfigFromProject(config, process.env));
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

  return program;
}
