import { describe, expect, it } from "vitest";
import { sanitizeFileName, withMarkdownExtension } from "../../src/services/filename";

describe("filename helpers", () => {
  it("removes Windows-forbidden characters and trailing dots", () => {
    expect(sanitizeFileName('  Видео: тест? <2026>.  ')).toBe("Видео тест 2026");
  });

  it("limits the base name to 120 characters", () => {
    expect(sanitizeFileName("а".repeat(200))).toHaveLength(120);
  });

  it("adds one markdown extension", () => {
    expect(withMarkdownExtension("Материал.md")).toBe("Материал.md");
  });
});
