import { describe, expect, it } from "vitest";
import {
  findSelectedTrackBySettings,
  toSelectedTrackDescriptor,
} from "../../src/extractors/youtube/selected-track";

const tracks = [
  { baseUrl: "https://example.test/en", languageCode: "en", vssId: ".en" },
  { baseUrl: "https://example.test/ru", languageCode: "ru", vssId: "a.ru", kind: "asr" },
];

describe("selected caption track", () => {
  it("finds an exact vssId from player settings", () => {
    expect(findSelectedTrackBySettings(tracks, { vssId: "a.ru" })?.languageCode).toBe("ru");
  });

  it("falls back to language and kind", () => {
    expect(
      findSelectedTrackBySettings(tracks, { languageCode: "ru", kind: "asr" })?.vssId,
    ).toBe("a.ru");
  });

  it("marks automatic captions in descriptor", () => {
    expect(toSelectedTrackDescriptor(tracks[1])?.automatic).toBe(true);
  });
});
