import { z } from "zod";
import { ProviderName } from "../domain/types.js";

export interface GenerateTextRequest {
  prompt: string;
  model: string;
  temperature: number;
  system?: string;
}

export interface GenerateTextResult {
  text: string;
  raw?: unknown;
}

export interface GenerateJsonRequest<T> extends GenerateTextRequest {
  schema: z.ZodType<T>;
}

export interface LlmProvider {
  name: string;
  generateText(request: GenerateTextRequest): Promise<GenerateTextResult>;
  generateJson<T>(request: GenerateJsonRequest<T>): Promise<T>;
}

export interface ProviderFactoryConfig {
  provider: ProviderName | "mock";
  apiKey?: string;
  baseUrl?: string;
  responses?: string[];
}

/**
 * Strips leading/trailing markdown JSON code fences that LLMs sometimes add
 * even when instructed not to. Handles both ```json ... ``` and ``` ... ```.
 */
export function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\n?([\s\S]*?)\n?```$/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

export function parseJsonResponse<T>(text: string, schema: z.ZodType<T>): T {
  const stripped = stripJsonFences(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch (err) {
    throw new Error(
      `LLM returned invalid JSON.\nRaw response (first 500 chars):\n${stripped.slice(0, 500)}\nParse error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".") || "(root)"}: expected ${i.code === "invalid_type" ? `${(i as z.ZodInvalidTypeIssue).expected}, got ${(i as z.ZodInvalidTypeIssue).received}` : i.message}`)
      .join("\n");
    throw new Error(
      `LLM JSON failed schema validation.\nValidation errors:\n${issues}\nRaw response (first 500 chars):\n${stripped.slice(0, 500)}`
    );
  }
  return result.data;
}
