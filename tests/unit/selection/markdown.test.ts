import { describe, it, expect } from "vitest";
import { safeFileName, escapeMarkdown } from "../../../src/lib/selection/markdown";

describe("safeFileName", () => {
  it("returns simple name unchanged", () => {
    expect(safeFileName("hello")).toBe("hello");
  });

  it("replaces forbidden Windows characters with space", () => {
    expect(safeFileName('file/name\\test')).toBe("file name test");
  });

  it("replaces slash and backslash with space", () => {
    expect(safeFileName("a/b\\c")).toBe("a b c");
  });

  it("collapses consecutive spaces", () => {
    expect(safeFileName("a   b   c")).toBe("a b c");
  });

  it("trims leading and trailing spaces and dots", () => {
    expect(safeFileName("  hello  ")).toBe("hello");
    expect(safeFileName("..hello..")).toBe("hello");
  });

  it("returns 'selection' for empty input", () => {
    expect(safeFileName("")).toBe("selection");
  });

  it("returns 'selection' for whitespace-only input", () => {
    expect(safeFileName("   ")).toBe("selection");
  });

  it("returns 'selection' for null/undefined", () => {
    expect(safeFileName(null as any)).toBe("selection");
    expect(safeFileName(undefined as any)).toBe("selection");
  });

  it("prepends 'selection-' for Windows reserved names", () => {
    expect(safeFileName("CON")).toBe("selection-CON");
    expect(safeFileName("PRN")).toBe("selection-PRN");
    expect(safeFileName("AUX")).toBe("selection-AUX");
    expect(safeFileName("NUL")).toBe("selection-NUL");
    expect(safeFileName("COM1")).toBe("selection-COM1");
    expect(safeFileName("COM9")).toBe("selection-COM9");
    expect(safeFileName("LPT1")).toBe("selection-LPT1");
    expect(safeFileName("LPT9")).toBe("selection-LPT9");
  });

  it("does not modify non-reserved names", () => {
    expect(safeFileName("CONSOLE")).toBe("CONSOLE");
    expect(safeFileName("A")).toBe("A");
  });

  it("truncates to 120 characters", () => {
    const long = "a".repeat(200);
    expect(safeFileName(long).length).toBe(120);
  });

  it("handles control characters", () => {
    expect(safeFileName("hello\x00world\x1F")).toBe("hello world");
  });
});

describe("escapeMarkdown", () => {
  it("escapes backslash first", () => {
    expect(escapeMarkdown("a\\b")).toBe("a\\\\b");
  });

  it("escapes backtick", () => {
    expect(escapeMarkdown("a`b")).toBe("a\\`b");
  });

  it("escapes asterisk", () => {
    expect(escapeMarkdown("a*b")).toBe("a\\*b");
  });

  it("escapes underscore", () => {
    expect(escapeMarkdown("a_b")).toBe("a\\_b");
  });

  it("escapes multiple special chars", () => {
    expect(escapeMarkdown("[hello](world)")).toBe("\\[hello\\]\\(world\\)");
  });

  it("returns plain text unchanged", () => {
    expect(escapeMarkdown("just words")).toBe("just words");
  });

  it("handles empty string", () => {
    expect(escapeMarkdown("")).toBe("");
  });
});
