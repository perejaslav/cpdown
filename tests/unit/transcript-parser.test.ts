import { describe, expect, it } from "vitest";
import { parseSrt, parseTimedTextXml } from "../../src/extractors/youtube/transcript-parser";

describe("transcript parser", () => {
  it("parses SRT timestamps and text", () => {
    const result = parseSrt(`1\n00:00:01,000 --> 00:00:03,500\nПривет &amp; мир\n\n2\n00:00:03,500 --> 00:00:05,000\nПродолжение`);
    expect(result).toEqual([
      { text: "Привет & мир", startMs: 1000, durationMs: 2500 },
      { text: "Продолжение", startMs: 3500, durationMs: 1500 },
    ]);
  });

  it("parses legacy timed-text XML", () => {
    const result = parseTimedTextXml('<transcript><text start="1.25" dur="2.5">Hello &amp; world</text></transcript>');
    expect(result).toEqual([{ text: "Hello & world", startMs: 1250, durationMs: 2500 }]);
  });

  it("parses millisecond timed-text attributes", () => {
    const result = parseTimedTextXml('<timedtext><body><p t="1500" d="700">Текст</p></body></timedtext>');
    expect(result).toEqual([{ text: "Текст", startMs: 1500, durationMs: 700 }]);
  });
});
