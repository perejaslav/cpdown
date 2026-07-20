import { describe, expect, it, vi } from "vitest";
import { extractYouTube } from "../../src/extractors/youtube/youtube-extractor";

const playerResponse = {
  videoDetails: {
    videoId: "abc123",
    title: "Тестовое видео",
    author: "Тестовый канал",
  },
  captions: {
    playerCaptionsTracklistRenderer: {
      captionTracks: [
        {
          baseUrl: "https://www.youtube.com/api/timedtext?v=abc123&lang=en",
          languageCode: "en",
          vssId: ".en",
          name: { simpleText: "English" },
        },
        {
          baseUrl: "https://www.youtube.com/api/timedtext?v=abc123&lang=ru",
          languageCode: "ru",
          vssId: ".ru",
          name: { simpleText: "Русский" },
        },
      ],
    },
  },
};

describe("YouTube extractor", () => {
  it("uses the requested caption track and builds a complete result", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain("lang=ru");
      return new Response(
        "1\n00:00:00,000 --> 00:00:01,000\nСегодня мы поговорим\n\n2\n00:00:01,000 --> 00:00:02,000\nмы поговорим о Chrome",
        { status: 200, headers: { "content-type": "text/plain" } },
      );
    });

    const result = await extractYouTube({
      jobId: "job-1",
      pageUrl: "https://www.youtube.com/watch?v=abc123",
      playerResponse,
      requestedTrack: { languageCode: "ru", vssId: ".ru" },
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result.type).toBe("youtube");
    expect(result.title).toBe("Тестовое видео");
    expect(result.metadata.language).toBe("Русский");
    expect(result.markdown).toContain("Канал: Тестовый канал");
    expect(result.markdown).toContain("Сегодня мы поговорим о Chrome");
  });

  it("rejects stale player data before fetching captions", async () => {
    const fetchImpl = vi.fn();
    await expect(
      extractYouTube({
        jobId: "job-2",
        pageUrl: "https://www.youtube.com/watch?v=other",
        playerResponse,
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
