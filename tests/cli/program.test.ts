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
