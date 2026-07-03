import { describe, it, expect } from "vitest";
import {
  isPlayerRequest,
  isTimedTextRequest,
  isYouTubeRelevant,
} from "../../../src/lib/youtube/url-predicate";

describe("isPlayerRequest", () => {
  it("matches youtubei/v1/player", () => {
    expect(
      isPlayerRequest(
        "https://www.youtube.com/youtubei/v1/player?key=abc",
      ),
    ).toBe(true);
  });

  it("rejects non-player URLs", () => {
    expect(isPlayerRequest("https://www.youtube.com/watch?v=abc")).toBe(
      false,
    );
  });

  it("rejects invalid URLs", () => {
    expect(isPlayerRequest("not a url")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isPlayerRequest("")).toBe(false);
  });

  it("matches youtubei/v1/player on different domain", () => {
    expect(
      isPlayerRequest(
        "https://youtubei.googleapis.com/youtubei/v1/player?key=abc",
      ),
    ).toBe(true);
  });

  it("rejects URL with player in query string only", () => {
    expect(
      isPlayerRequest("https://example.com/?path=youtubei/v1/player"),
    ).toBe(false);
  });
});

describe("isTimedTextRequest", () => {
  it("matches api/timedtext", () => {
    expect(
      isTimedTextRequest(
        "https://www.youtube.com/api/timedtext?v=abc&fmt=srt",
      ),
    ).toBe(true);
  });

  it("rejects non-timedtext URLs", () => {
    expect(isTimedTextRequest("https://www.youtube.com/watch?v=abc")).toBe(
      false,
    );
  });

  it("rejects invalid URLs", () => {
    expect(isTimedTextRequest("not a url")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isTimedTextRequest("")).toBe(false);
  });
});

describe("isYouTubeRelevant", () => {
  it("returns true for player requests", () => {
    expect(
      isYouTubeRelevant(
        "https://www.youtube.com/youtubei/v1/player?key=abc",
      ),
    ).toBe(true);
  });

  it("returns true for timedtext requests", () => {
    expect(
      isYouTubeRelevant("https://www.youtube.com/api/timedtext?v=abc"),
    ).toBe(true);
  });

  it("returns false for unrelated", () => {
    expect(
      isYouTubeRelevant("https://www.youtube.com/watch?v=abc"),
    ).toBe(false);
  });

  it("returns false for invalid URL", () => {
    expect(isYouTubeRelevant("not a url")).toBe(false);
  });
});
