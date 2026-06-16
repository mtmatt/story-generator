export interface StylePromptInput {
  primaryStyle: string;
  assistStyle?: string;
}

export function composeStyleSystemPrompt(input: StylePromptInput): string {
  return [
    "你是長篇小說故事織造者。",
    "主風格決定敘事聲音、節奏、角色反應、章末鉤子和禁忌寫法。",
    input.primaryStyle,
    input.assistStyle
      ? `輔助風格只能提供可借用的敘事機制，不得覆蓋主風格聲音。\n${input.assistStyle}`
      : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function storyBiblePrompt(idea: string): string {
  return [
    "請建立長篇小說故事聖經，使用 Markdown。",
    "必須包含：核心賣點、主角、主要配角、世界規則、主線衝突、長線懸念、結局方向。",
    `題材：${idea}`
  ].join("\n");
}

export function wholeBookOutlinePrompt(storyBible: string): string {
  return [
    "請根據故事聖經建立全書大綱，使用 Markdown。",
    "必須包含：分卷規劃、每卷目標、主要轉折、伏筆回收節點。",
    storyBible
  ].join("\n\n");
}
