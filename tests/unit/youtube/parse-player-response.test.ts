import { describe, it, expect } from "vitest";
import { parsePlayerCaptions } from "../../../src/lib/youtube/parse-player-response";

describe("parsePlayerCaptions", () => {
  it("extracts caption tracks from valid player response", () => {
    const result = parsePlayerCaptions({
      videoDetails: { videoId: "abc123" },
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            {
              baseUrl: "https://example.com/1",
              languageCode: "en",
              name: { simpleText: "English" },
              kind: "asr",
              isTranslatable: true,
            },
            {
              baseUrl: "https://example.com/2",
              languageCode: "ru",
              name: { simpleText: "Russian" },
              isTranslatable: false,
            },
          ],
        },
      },
    });
    expect(result).not.toBeNull();
    expect(result!.videoId).toBe("abc123");
    expect(result!.captionTracks).toHaveLength(2);
    expect(result!.captionTracks[0].kind).toBe("asr");
    expect(result!.captionTracks[1].kind).toBe("unknown");
  });

  it("returns empty tracks when no captions key", () => {
    const result = parsePlayerCaptions({
      videoDetails: { videoId: "abc" },
    });
    expect(result!.captionTracks).toEqual([]);
  });

  it("returns null for non-object input", () => {
    expect(parsePlayerCaptions(null)).toBeNull();
    expect(parsePlayerCaptions("string")).toBeNull();
  });

  it("handles empty caption tracks", () => {
    const result = parsePlayerCaptions({
      captions: {
        playerCaptionsTracklistRenderer: { captionTracks: [] },
      },
    });
    expect(result!.captionTracks).toEqual([]);
  });

  it("normalizes external kind to manual", () => {
    const result = parsePlayerCaptions({
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            {
              baseUrl: "x",
              languageCode: "en",
              kind: "external",
            },
          ],
        },
      },
    });
    expect(result!.captionTracks[0].kind).toBe("manual");
  });

  it("extracts videoId from top-level when no videoDetails", () => {
    const result = parsePlayerCaptions({
      videoId: "top-level-id",
      captions: {
        playerCaptionsTracklistRenderer: { captionTracks: [] },
      },
    });
    expect(result!.videoId).toBe("top-level-id");
  });

  it("handles missing playerCaptionsTracklistRenderer gracefully", () => {
    const result = parsePlayerCaptions({
      captions: {},
    });
    expect(result!.captionTracks).toEqual([]);
  });

  it("handles undefined captionTracks gracefully", () => {
    const result = parsePlayerCaptions({
      captions: {
        playerCaptionsTracklistRenderer: {},
      },
    });
    expect(result!.captionTracks).toEqual([]);
  });

  it("handles non-array captionTracks gracefully", () => {
    const result = parsePlayerCaptions({
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: "not-an-array",
        },
      },
    });
    expect(result!.captionTracks).toEqual([]);
  });

  it("populates languageName from name.simpleText", () => {
    const result = parsePlayerCaptions({
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            {
              baseUrl: "x",
              languageCode: "en",
              name: { simpleText: "English (auto-generated)" },
            },
          ],
        },
      },
    });
    expect(result!.captionTracks[0].languageName).toBe(
      "English (auto-generated)",
    );
  });

  it("falls back to languageName when name.simpleText missing", () => {
    const result = parsePlayerCaptions({
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            {
              baseUrl: "x",
              languageCode: "ru",
              languageName: "Russian",
            },
          ],
        },
      },
    });
    expect(result!.captionTracks[0].languageName).toBe("Russian");
  });

  it("uses empty string for missing baseUrl", () => {
    const result = parsePlayerCaptions({
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            {
              languageCode: "en",
            },
          ],
        },
      },
    });
    expect(result!.captionTracks[0].baseUrl).toBe("");
  });
});
