#!/usr/bin/env node
import { createProgram } from "./program.js";

try {
  await createProgram().parseAsync(process.argv);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  const firstLine = msg.split("\n")[0];
  process.stderr.write(`錯誤：${firstLine}\n`);
  process.exit(1);
}
