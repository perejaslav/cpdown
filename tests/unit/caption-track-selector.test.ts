import { describe, expect, it } from "vitest";
import {
  isAutomaticCaptionTrack,
  selectCaptionTrack,
  type CaptionTrack,
} from "../../src/extractors/youtube/caption-track-selector";

const tracks: CaptionTrack[] = [
  { baseUrl: "auto-en", languageCode: "en", vssId: "a.en", kind: "asr" },
  { baseUrl: "manual-en", languageCode: "en", vssId: ".en" },
  { baseUrl: "manual-ru", languageCode: "ru", vssId: ".ru" },
];

describe("caption track selector", () => {
  it("prioritizes an exact vssId match", () => {
    expect(selectCaptionTrack(tracks, { vssId: ".ru" })?.baseUrl).toBe("manual-ru");
  });

  it("matches language and caption kind", () => {
    expect(selectCaptionTrack(tracks, { languageCode: "en", kind: "asr" })?.baseUrl).toBe("auto-en");
  });

  it("prefers a manual default track when no request exists", () => {
    expect(selectCaptionTrack(tracks)?.baseUrl).toBe("manual-en");
  });

  it("recognizes automatically generated captions", () => {
    expect(isAutomaticCaptionTrack(tracks[0])).toBe(true);
    expect(isAutomaticCaptionTrack(tracks[1])).toBe(false);
  });
});
