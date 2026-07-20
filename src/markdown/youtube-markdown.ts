import type { ExtractionResult } from "../core/result-types";
import { createMarkdownFileName } from "../services/filename";
import { estimateTokens, countWords } from "../services/text-metrics";

export interface YouTubeMarkdownInput {
  jobId: string;
  title: string;
  channel?: string;
  sourceUrl: string;
  videoId: string;
  languageName: string;
  isAutomatic?: boolean;
  transcript: string;
  warnings?: string[];
}

export function buildYouTubeExtractionResult(input: YouTubeMarkdownInput): ExtractionResult {
  const lines = [
    `# ${input.title}`,
    "",
    input.channel ? `- Канал: ${input.channel}` : "",
    `- Ссылка: ${input.sourceUrl}`,
    `- Язык субтитров: ${input.languageName}`,
    typeof input.isAutomatic === "boolean"
      ? `- Тип субтитров: ${input.isAutomatic ? "Автоматические" : "Ручные"}`
      : "",
    "",
    "## Расшифровка",
    "",
    input.transcript.trim(),
  ].filter((line, index, array) => {
    if (line !== "") return true;
    return index === 0 || array[index - 1] !== "";
  });

  const markdown = lines.join("\n").trim() + "\n";

  return {
    jobId: input.jobId,
    type: "youtube",
    title: input.title,
    sourceUrl: input.sourceUrl,
    markdown,
    fileName: createMarkdownFileName(`${input.title} — YouTube`),
    wordCount: countWords(markdown),
    estimatedTokens: estimateTokens(markdown),
    warnings: input.warnings ?? [],
    metadata: {
      channel: input.channel ?? null,
      videoId: input.videoId,
      language: input.languageName,
      automaticCaptions: input.isAutomatic ?? null,
    },
  };
}
