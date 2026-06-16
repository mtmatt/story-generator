import { GenerateJsonRequest, GenerateTextRequest, GenerateTextResult, LlmProvider, stripJsonFences } from "./types.js";

export class AnthropicProvider implements LlmProvider {
  public readonly name = "anthropic";

  constructor(private readonly apiKey: string) {}

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: 4096,
        temperature: request.temperature,
        ...(request.system ? { system: request.system } : {}),
        messages: [{ role: "user", content: request.prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
    }

    const raw = await response.json();
    const text = raw.content?.map((part: { text?: string }) => part.text ?? "").join("");
    if (typeof text !== "string" || text.length === 0) {
      throw new Error("Anthropic response did not include text content");
    }
    return { text, raw };
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<T> {
    const result = await this.generateText({
      ...request,
      prompt: `${request.prompt}\n\nReturn only valid JSON.`
    });
    return request.schema.parse(JSON.parse(stripJsonFences(result.text)));
  }
}
