import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export type ReviewDecision = "accept" | "edit" | "regenerate" | "abort";

export async function askReviewDecision(prompt: string): Promise<ReviewDecision> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`${prompt} [accept/edit/regenerate/abort]: `);
    if (answer === "accept" || answer === "edit" || answer === "regenerate" || answer === "abort") {
      return answer;
    }
    throw new Error(`Invalid review decision: ${answer}`);
  } finally {
    rl.close();
  }
}
