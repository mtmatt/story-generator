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
