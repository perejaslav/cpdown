import { describe, expect, it, vi } from "vitest";
import { buildTranscriptUrl, fetchTranscript } from "../../src/extractors/youtube/transcript-fetcher";

const track = {
  baseUrl: "https://www.youtube.com/api/timedtext?v=abc&lang=ru",
  languageCode: "ru",
};

describe("transcript fetcher", () => {
  it("adds required SRT parameters and pot", () => {
    const url = new URL(buildTranscriptUrl(track, "token"));
    expect(url.searchParams.get("fmt")).toBe("srt");
    expect(url.searchParams.get("c")).toBe("WEB");
    expect(url.searchParams.get("pot")).toBe("token");
  });

  it("loads and parses a transcript", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("1\n00:00:00,000 --> 00:00:01,000\nТекст", {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );

    await expect(fetchTranscript(track, { fetchImpl: fetchImpl as typeof fetch })).resolves.toEqual([
      { text: "Текст", startMs: 0, durationMs: 1000 },
    ]);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("rejects an HTTP error", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 403 }));
    await expect(fetchTranscript(track, { fetchImpl: fetchImpl as typeof fetch })).rejects.toThrow("HTTP 403");
  });
});
