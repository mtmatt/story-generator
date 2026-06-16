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
