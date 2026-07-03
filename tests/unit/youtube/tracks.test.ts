import { describe, it, expect } from "vitest";
import {
  normalizeLanguageTag,
  baseLanguage,
  selectTrack,
} from "../../../src/lib/youtube/tracks";
import type { CaptionTrack } from "../../../src/lib/contracts";

describe("normalizeLanguageTag", () => {
  it("lowercases and trims", () => {
    expect(normalizeLanguageTag("  EN-us  ")).toBe("en-us");
  });

  it("replaces underscore with hyphen", () => {
    expect(normalizeLanguageTag("ru_RU")).toBe("ru-ru");
  });

  it("handles empty string", () => {
    expect(normalizeLanguageTag("")).toBe("");
  });

  it("strips extra whitespace", () => {
    expect(normalizeLanguageTag("en  us")).toBe("en us");
  });
});

describe("baseLanguage", () => {
  it("extracts base before hyphen", () => {
    expect(baseLanguage("en-us")).toBe("en");
  });

  it("returns full tag if no hyphen", () => {
    expect(baseLanguage("en")).toBe("en");
  });

  it("handles empty string", () => {
    expect(baseLanguage("")).toBe("");
  });
});

describe("selectTrack", () => {
  const makeTrack = (
    lang: string,
    kind: CaptionTrack["kind"] = "unknown",
  ): CaptionTrack => ({
    baseUrl: `https://example.com/${lang}`,
    languageCode: lang,
    languageName: lang,
    kind,
    isTranslatable: false,
  });

  it("prefers manual over ASR for same language", () => {
    const tracks = [makeTrack("en", "asr"), makeTrack("en", "manual")];
    expect(selectTrack(tracks, ["en"])?.kind).toBe("manual");
  });

  it("prefers ASR when no manual exists", () => {
    const tracks = [makeTrack("en", "asr")];
    expect(selectTrack(tracks, ["en"])?.kind).toBe("asr");
  });

  it("falls back to base language manual", () => {
    const tracks = [makeTrack("en-gb", "manual")];
    expect(selectTrack(tracks, ["en"])?.languageCode).toBe("en-gb");
  });

  it("falls back to base language ASR", () => {
    const tracks = [makeTrack("en-gb", "asr")];
    expect(selectTrack(tracks, ["en"])?.languageCode).toBe("en-gb");
  });

  it("falls back to first manual if no language match", () => {
    const tracks = [makeTrack("fr", "manual"), makeTrack("de", "asr")];
    expect(selectTrack(tracks, ["en"])?.kind).toBe("manual");
  });

  it("falls back to first ASR if no manual and no language match", () => {
    const tracks = [makeTrack("fr", "asr"), makeTrack("de", "asr")];
    expect(selectTrack(tracks, ["en"])?.kind).toBe("asr");
  });

  it("returns null for empty tracks", () => {
    expect(selectTrack([], ["en"])).toBeNull();
  });

  it("falls back to first available when no manual and no ASR", () => {
    const tracks = [makeTrack("en", "unknown")];
    expect(selectTrack(tracks, ["en"])).toBeTruthy();
    expect(selectTrack(tracks, ["en"])?.languageCode).toBe("en");
  });

  it("checks multiple preferred languages", () => {
    const tracks = [makeTrack("ja", "manual"), makeTrack("en", "manual")];
    expect(selectTrack(tracks, ["ja", "en"])?.languageCode).toBe("ja");
  });

  it("handles ru-RU user language with only ru available (base match)", () => {
    const tracks = [makeTrack("ru", "manual")];
    expect(selectTrack(tracks, ["ru-RU"])?.languageCode).toBe("ru");
  });

  it("handles pt-BR user language with only pt available (base match)", () => {
    const tracks = [makeTrack("pt", "asr")];
    expect(selectTrack(tracks, ["pt-BR"])?.languageCode).toBe("pt");
  });

  it("handles zh-Hans user language with only zh available (base match)", () => {
    const tracks = [makeTrack("zh", "manual")];
    expect(selectTrack(tracks, ["zh-Hans"])?.languageCode).toBe("zh");
  });

  it("performs case-insensitive comparison", () => {
    const tracks = [makeTrack("EN", "manual")];
    expect(selectTrack(tracks, ["en"])?.languageCode).toBe("EN");
  });

  it("selects specific manual track over other manual tracks", () => {
    const tracks = [
      makeTrack("de", "manual"),
      makeTrack("en", "manual"),
      makeTrack("fr", "manual"),
    ];
    expect(selectTrack(tracks, ["en"])?.languageCode).toBe("en");
  });
});
