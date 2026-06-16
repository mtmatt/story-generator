import { readdir, readFile } from "node:fs/promises";
import { extname, join, basename } from "node:path";

export interface StyleRef {
  name: string;
  path: string;
}

export interface LoadedStyle {
  name: string;
  path: string;
  content: string;
}

export interface StyleSelection {
  primary: LoadedStyle;
  assist?: LoadedStyle;
}

export async function scanStyles(stylesDir: string): Promise<StyleRef[]> {
  const entries = await readdir(stylesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && extname(entry.name) === ".md")
    .map((entry) => ({ name: basename(entry.name, ".md"), path: join(stylesDir, entry.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadStyle(stylesDir: string, name: string): Promise<LoadedStyle> {
  const styles = await scanStyles(stylesDir);
  const style = styles.find((item) => item.name === name);
  if (!style) {
    throw new Error(`Style not found: ${name}`);
  }
  return {
    name: style.name,
    path: style.path,
    content: await readFile(style.path, "utf8")
  };
}

export async function loadStyleSelection(
  stylesDir: string,
  primaryName: string,
  assistName?: string
): Promise<StyleSelection> {
  return {
    primary: await loadStyle(stylesDir, primaryName),
    assist: assistName ? await loadStyle(stylesDir, assistName) : undefined
  };
}
