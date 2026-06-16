import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

export async function editTextInEditor(initialText: string, editor = process.env.EDITOR ?? "vi"): Promise<string> {
  const tempPath = join(tmpdir(), `story-weaver-edit-${process.pid}-${Date.now()}.md`);
  await writeFile(tempPath, initialText, "utf8");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(editor, [tempPath], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });
  });

  return readFile(tempPath, "utf8");
}

export async function editJsonInEditor<T>(
  value: T,
  schema: z.ZodType<T>,
  editor = process.env.EDITOR ?? "vi"
): Promise<T> {
  const edited = await editTextInEditor(`${JSON.stringify(value, null, 2)}\n`, editor);
  return schema.parse(JSON.parse(edited));
}
