import { GenerateJsonRequest, GenerateTextRequest, GenerateTextResult, LlmProvider, parseJsonResponse } from "./types.js";

export class OpenAiCompatibleProvider implements LlmProvider {
  public readonly name: string = "openai-compatible";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly baseUrl: string
  ) {}

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: request.model,
        temperature: request.temperature,
        messages: [
          ...(request.system ? [{ role: "system", content: request.system }] : []),
          { role: "user", content: request.prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI-compatible request failed: ${response.status} ${await response.text()}`);
    }

    const raw = await response.json();
    const text = raw.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      throw new Error("OpenAI-compatible response did not include choices[0].message.content");
    }
    return { text, raw };
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<T> {
    const result = await this.generateText({
      ...request,
      prompt: `${request.prompt}\n\nReturn only valid JSON.`
    });
    return parseJsonResponse(result.text, request.schema);
  }
}
