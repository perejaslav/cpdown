import { describe, expect, it } from "vitest";
import { buildYouTubeExtractionResult } from "../../src/markdown/youtube-markdown";

describe("buildYouTubeExtractionResult", () => {
  it("includes title, channel, link, language and transcript", () => {
    const result = buildYouTubeExtractionResult({
      jobId: "job-1",
      title: "Тестовое видео",
      channel: "Тестовый канал",
      sourceUrl: "https://www.youtube.com/watch?v=abcDEF_1234",
      videoId: "abcDEF_1234",
      languageName: "Русский",
      isAutomatic: true,
      transcript: "Текст расшифровки.",
    });

    expect(result.type).toBe("youtube");
    expect(result.markdown).toContain("# Тестовое видео");
    expect(result.markdown).toContain("- Канал: Тестовый канал");
    expect(result.markdown).toContain("- Язык субтитров: Русский");
    expect(result.markdown).toContain("- Тип субтитров: Автоматические");
    expect(result.markdown).toContain("## Расшифровка");
    expect(result.fileName).toMatch(/YouTube\.md$/);
    expect(result.metadata.videoId).toBe("abcDEF_1234");
  });

  it("omits the channel line when it is unknown", () => {
    const result = buildYouTubeExtractionResult({
      jobId: "job-2",
      title: "Видео",
      sourceUrl: "https://www.youtube.com/watch?v=abcDEF_1234",
      videoId: "abcDEF_1234",
      languageName: "English",
      transcript: "Transcript text.",
    });

    expect(result.markdown).not.toContain("- Канал:");
    expect(result.markdown).not.toContain("- Тип субтитров:");
  });
});
