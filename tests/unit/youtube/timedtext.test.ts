import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildTimedtextUrl, parseSrt, estimateTokenCount } from "../../../src/lib/youtube/timedtext";

describe("buildTimedtextUrl", () => {
  it("builds URL from baseUrl", () => {
    const url = buildTimedtextUrl({
      track: { baseUrl: "https://example.com/caption", languageCode: "en", languageName: "English", kind: "manual", isTranslatable: false },
      pot: null,
    });
    expect(url).toBe("https://example.com/caption&fmt=srt&c=WEB");
  });

  it("appends pot when available", () => {
    const url = buildTimedtextUrl({
      track: { baseUrl: "https://example.com/caption", languageCode: "en", languageName: "English", kind: "manual", isTranslatable: false },
      pot: "MPQXy123",
    });
    expect(url).toContain("&pot=MPQXy123");
  });

  it("encodes pot with special characters", () => {
    const url = buildTimedtextUrl({
      track: { baseUrl: "https://example.com/caption", languageCode: "en", languageName: "English", kind: "manual", isTranslatable: false },
      pot: "abc def",
    });
    expect(url).toContain("&pot=abc%20def");
  });
});

describe("parseSrt", () => {
  it("parses standard SRT format", () => {
    const srt = "1\n00:00:01,000 --> 00:00:04,000\nHello world\n\n2\n00:00:05,000 --> 00:00:08,000\nSecond line";
    expect(parseSrt(srt)).toBe("Hello world\nSecond line");
  });

  it("returns empty string for empty input", () => {
    expect(parseSrt("")).toBe("");
  });

  it("handles whitespace-only input", () => {
    expect(parseSrt("   \n  ")).toBe("");
  });

  it("preserves order of text lines", () => {
    const srt = "1\n00:00:00,000 --> 00:00:01,000\nFirst\n\n2\n00:00:01,000 --> 00:00:02,000\nSecond\n\n3\n00:00:02,000 --> 00:00:03,000\nThird";
    const result = parseSrt(srt);
    expect(result.indexOf("First")).toBeLessThan(result.indexOf("Second"));
    expect(result.indexOf("Second")).toBeLessThan(result.indexOf("Third"));
  });

  it("parses a real SRT fixture correctly", () => {
    const srt = readFileSync(resolve(__dirname, "../../fixtures/youtube/sample-transcript.srt"), "utf-8");
    const result = parseSrt(srt);
    expect(result).toContain("Welcome to this video.");
    expect(result).toContain("caption formats");
    expect(result).toContain("clean plain text");
    expect(result).not.toContain("-->");
    expect(result).not.toMatch(/^\d+$/m);
  });
});

describe("estimateTokenCount", () => {
  it("estimates tokens from character count", () => {
    expect(estimateTokenCount("a".repeat(40))).toBe(10);
  });

  it("returns 0 for empty string", () => {
    expect(estimateTokenCount("")).toBe(0);
  });
});
