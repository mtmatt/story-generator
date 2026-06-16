import { OpenAiCompatibleProvider } from "./openaiCompatibleProvider.js";

export class OpenAiProvider extends OpenAiCompatibleProvider {
  public override readonly name = "openai";

  constructor(apiKey: string) {
    super(apiKey, "https://api.openai.com/v1");
  }
}
