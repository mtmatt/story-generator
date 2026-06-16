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
