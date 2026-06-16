import { LlmProvider, GenerateJsonRequest, GenerateTextRequest, GenerateTextResult } from "./types.js";

export class MockLlmProvider implements LlmProvider {
  public readonly name = "mock";
  private responses: string[];

  constructor(responses: string[]) {
    this.responses = [...responses];
  }

  async generateText(_request: GenerateTextRequest): Promise<GenerateTextResult> {
    const response = this.responses.shift();
    if (response === undefined) {
      throw new Error("MockLlmProvider has no queued responses");
    }
    return { text: response };
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<T> {
    const result = await this.generateText(request);
    return request.schema.parse(JSON.parse(result.text));
  }
}
