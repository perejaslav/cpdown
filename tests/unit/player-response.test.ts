import { describe, expect, it } from "vitest";
import {
  assertFreshPlayerResponse,
  getPlayerResponseVideoId,
} from "../../src/extractors/youtube/player-response";

describe("YouTube player response", () => {
  it("reads videoId from videoDetails", () => {
    expect(getPlayerResponseVideoId({ videoDetails: { videoId: "video-1" } }))
      .toBe("video-1");
  });

  it("accepts matching data", () => {
    expect(() => assertFreshPlayerResponse("video-1", {
      videoDetails: { videoId: "video-1" },
    })).not.toThrow();
  });

  it("rejects stale data", () => {
    expect(() => assertFreshPlayerResponse("video-2", {
      videoDetails: { videoId: "video-1" },
    })).toThrow(/stale player data/i);
  });

  it("rejects data without a video identifier", () => {
    expect(() => assertFreshPlayerResponse("video-1", { videoDetails: {} }))
      .toThrow(/does not contain/i);
  });
});
