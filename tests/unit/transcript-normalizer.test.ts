import { describe, expect, it } from "vitest";
import { normalizeTranscript } from "../../src/extractors/youtube/transcript-normalizer";

describe("transcript normalizer", () => {
  it("removes SRT indexes, timestamps and HTML entities", () => {
    const raw = `1\n00:00:00,000 --> 00:00:02,000\nПривет &amp; добро пожаловать\n\n2\n00:00:02,000 --> 00:00:04,000\nв cpdown`;
    expect(normalizeTranscript(raw)).toBe("Привет & добро пожаловать в cpdown");
  });

  it("removes exact adjacent duplicates", () => {
    const raw = `1\n00:00:00,000 --> 00:00:01,000\nПовтор\n\n2\n00:00:01,000 --> 00:00:02,000\nПовтор`;
    expect(normalizeTranscript(raw)).toBe("Повтор");
  });

  it("merges overlapping automatic-caption fragments", () => {
    const raw = `1\n00:00:00,000 --> 00:00:01,000\nСегодня мы поговорим\n\n2\n00:00:01,000 --> 00:00:02,000\nмы поговорим о расширениях\n\n3\n00:00:02,000 --> 00:00:03,000\nо расширениях для Chrome.`;
    expect(normalizeTranscript(raw)).toBe("Сегодня мы поговорим о расширениях для Chrome.");
  });

  it("removes subtitle formatting tags", () => {
    expect(normalizeTranscript("<c.colorE5E5E5>Текст</c> <font color=\"red\">субтитров</font>")).toBe(
      "Текст субтитров",
    );
  });
});
