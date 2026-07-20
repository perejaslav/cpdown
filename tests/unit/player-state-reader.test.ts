import { describe, expect, it } from "vitest";
import { readPlayerCaptionState } from "../../src/extractors/youtube/player-state-reader";

describe("readPlayerCaptionState", () => {
  it("returns the selected track and current video id", () => {
    const state = readPlayerCaptionState({
      playerResponse: {
        videoDetails: { videoId: "abc123" },
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              { baseUrl: "https://example.test/en", languageCode: "en", vssId: ".en" },
              { baseUrl: "https://example.test/ru", languageCode: "ru", vssId: "a.ru", kind: "asr" },
            ],
          },
        },
      } as never,
      captionSettings: { vssId: "a.ru" },
      pot: "token",
    });

    expect(state.videoId).toBe("abc123");
    expect(state.selectedTrack?.languageCode).toBe("ru");
    expect(state.selectedTrack?.automatic).toBe(true);
    expect(state.pot).toBe("token");
  });

  it("fails when player response has no video id", () => {
    expect(() => readPlayerCaptionState({ playerResponse: {} })).toThrow(/videoId/);
  });
});
