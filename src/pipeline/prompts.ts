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

export function chapterDraftPrompt(
  chapterOutline: string,
  currentState: string,
  wordTarget: number,
  previousChapter?: string
): string {
  return [
    `請根據章綱撰寫本章初稿，目標字數約 ${wordTarget} 字，不得少於 ${Math.floor(wordTarget * 0.8)} 字。`,
    "要求：直接進事件、保留章末鉤子、對話使用全形引號、不要寫總結式大道理。",
    previousChapter ? `上一章正文（接續用，確保人物狀態、場景、伏筆連貫）：\n${previousChapter}` : "",
    "章綱：",
    chapterOutline,
    "目前狀態：",
    currentState
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function styleCheckPrompt(chapterText: string): string {
  return [
    "請檢查本章是否符合主風格。只回傳 JSON，不要有任何其他文字或 markdown。",
    `JSON 格式（嚴格遵守）：
{
  "pass": true,
  "issues": [
    { "type": "ai_tone", "severity": "high", "evidence": "引用原文片段", "suggestion": "具體修改建議" }
  ],
  "rewriteInstructions": ["改寫指令1"]
}
pass 為 true 時 issues 必須為空陣列。severity 只能是 "low"、"medium"、"high" 之一。`,
    "正文：",
    chapterText
  ].join("\n\n");
}

export function rewritePrompt(chapterText: string, rewriteInstructions: string[]): string {
  return [
    "請依照改寫指令重寫本章。",
    "保留劇情事實、角色狀態、章節目的和連貫性，只修風格、節奏、AI 味和章末鉤子。",
    "改寫指令：",
    rewriteInstructions.map((item) => `- ${item}`).join("\n"),
    "原文：",
    chapterText
  ].join("\n\n");
}

export function volumeOutlinesPrompt(storyBible: string, wholeBookOutline: string): string {
  return [
    "請根據故事聖經與全書大綱產生分卷大綱，使用 Markdown。",
    "第一版請產出第一卷，包含本卷目標、主要轉折、角色變化、伏筆安排。",
    "故事聖經：",
    storyBible,
    "全書大綱：",
    wholeBookOutline
  ].join("\n\n");
}

export function chapterOutlinesPrompt(storyBible: string, wholeBookOutline: string): string {
  return [
    "請產生章綱 JSON。只回傳 JSON array。",
    "每個元素欄位：chapter:number, title:string, outline:string。",
    "故事聖經：",
    storyBible,
    "全書大綱：",
    wholeBookOutline
  ].join("\n\n");
}
