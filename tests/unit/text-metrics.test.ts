import { describe, expect, it } from "vitest";
import { countWords, estimateTokens, measureText } from "../../src/services/text-metrics";

describe("text metrics", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("Один  два\nтри")).toBe(3);
  });

  it("returns zero metrics for empty text", () => {
    expect(measureText("")).toEqual({ wordCount: 0, estimatedTokens: 0 });
  });

  it("does not use a fixed chars-divided-by-four estimate for Cyrillic", () => {
    const text = "Это пример русского текста для приблизительной оценки количества токенов.";
    expect(estimateTokens(text)).toBeGreaterThan(Math.ceil(text.length / 4));
  });
});
