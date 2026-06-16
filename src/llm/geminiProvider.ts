import { GenerateJsonRequest, GenerateTextRequest, GenerateTextResult, LlmProvider, stripJsonFences } from "./types.js";

export class GeminiProvider implements LlmProvider {
  public readonly name = "gemini";

  constructor(private readonly apiKey: string) {}

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(request.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        generationConfig: { temperature: request.temperature },
        systemInstruction: request.system ? { parts: [{ text: request.system }] } : undefined,
        contents: [{ role: "user", parts: [{ text: request.prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status} ${await response.text()}`);
    }

    const raw = await response.json();
    const text = raw.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("");
    if (typeof text !== "string" || text.length === 0) {
      throw new Error("Gemini response did not include text content");
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
