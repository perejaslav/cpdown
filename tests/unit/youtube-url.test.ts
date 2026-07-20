import { describe, expect, it } from "vitest";
import { parseYouTubeUrl } from "../../src/extractors/youtube/youtube-url";

describe("parseYouTubeUrl", () => {
  it("parses a watch URL", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=abcDEF_1234"))
      .toEqual({
        videoId: "abcDEF_1234",
        normalizedUrl: "https://www.youtube.com/watch?v=abcDEF_1234",
        kind: "watch",
      });
  });

  it("parses a youtu.be URL", () => {
    expect(parseYouTubeUrl("https://youtu.be/abcDEF_1234?t=15")?.videoId)
      .toBe("abcDEF_1234");
  });

  it("parses a Shorts URL", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/shorts/abcDEF_1234")?.kind)
      .toBe("shorts");
  });

  it("rejects unrelated and malformed URLs", () => {
    expect(parseYouTubeUrl("https://example.com/watch?v=abcDEF_1234")).toBeNull();
    expect(parseYouTubeUrl("not a url")).toBeNull();
  });
});
