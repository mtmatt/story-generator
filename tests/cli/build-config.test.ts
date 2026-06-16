import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

type PackageJson = {
  bin?: Record<string, string>;
  scripts?: Record<string, string>;
};

type BuildTsConfig = {
  compilerOptions?: {
    outDir?: string;
    rootDir?: string;
  };
  include?: string[];
};

async function readJson<T>(fileUrl: URL): Promise<T> {
  return JSON.parse(await readFile(fileUrl, "utf8")) as T;
}

describe("build configuration", () => {
  it("aligns the package bin path with the TypeScript build output", async () => {
    const packageJsonUrl = new URL("../../package.json", import.meta.url);
    const buildConfigUrl = new URL("../../tsconfig.build.json", import.meta.url);

    expect(existsSync(buildConfigUrl)).toBe(true);

    const packageJson = await readJson<PackageJson>(packageJsonUrl);
    const buildConfig = await readJson<BuildTsConfig>(buildConfigUrl);

    expect(packageJson.scripts?.build).toBe("tsc -p tsconfig.build.json");
    expect(packageJson.bin?.["story-weaver"]).toBe("dist/cli/index.js");
    expect(buildConfig.compilerOptions?.rootDir).toBe("src");
    expect(buildConfig.compilerOptions?.outDir).toBe("dist");
    expect(buildConfig.include).toEqual(["src/**/*.ts"]);
  });
});
