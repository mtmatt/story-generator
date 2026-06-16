import { AnthropicProvider } from "./anthropicProvider.js";
import { GeminiProvider } from "./geminiProvider.js";
import { MockLlmProvider } from "./mockProvider.js";
import { OpenAiCompatibleProvider } from "./openaiCompatibleProvider.js";
import { OpenAiProvider } from "./openaiProvider.js";
import { LlmProvider, ProviderFactoryConfig } from "./types.js";

export function createLlmProvider(config: ProviderFactoryConfig): LlmProvider {
  if (config.provider === "mock") {
    return new MockLlmProvider(config.responses ?? []);
  }

  if (config.provider === "openai") {
    if (!config.apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }
    return new OpenAiProvider(config.apiKey);
  }

  if (config.provider === "anthropic") {
    if (!config.apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }
    return new AnthropicProvider(config.apiKey);
  }

  if (config.provider === "gemini") {
    if (!config.apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    return new GeminiProvider(config.apiKey);
  }

  if (!config.baseUrl) {
    throw new Error("Missing OpenAI-compatible baseUrl");
  }
  return new OpenAiCompatibleProvider(config.apiKey, config.baseUrl);
}
