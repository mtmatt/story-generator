import { describe, expect, it } from "vitest";
import { createProgram } from "../../src/cli/program.js";
import { VERSION } from "../../src/version.js";

describe("createProgram", () => {
  it("exposes the configured CLI name and version", () => {
    const program = createProgram();

    expect(program.name()).toBe("story-weaver");
    expect(program.version()).toBe(VERSION);
  });

  it("registers the scaffold commands", () => {
    const program = createProgram();

    expect(program.commands.map((command) => command.name())).toEqual([
      "init",
      "quick",
      "guided"
    ]);
  });
});
