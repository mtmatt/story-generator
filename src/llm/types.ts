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
