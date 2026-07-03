import { describe, it, expect } from "vitest";
import { isUiLine, normalizeSpaces } from "../../../src/lib/xcom/ui-patterns";

describe("normalizeSpaces", () => {
  it("replaces non-breaking spaces", () => {
    expect(normalizeSpaces("hello\u00a0world")).toBe("hello world");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeSpaces("a  b   c")).toBe("a b c");
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeSpaces("  hello  ")).toBe("hello");
  });

  it("removes spaces around newlines", () => {
    expect(normalizeSpaces("line1 \n line2")).toBe("line1\nline2");
  });

  it("collapses triple+ newlines to double", () => {
    expect(normalizeSpaces("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("handles empty string", () => {
    expect(normalizeSpaces("")).toBe("");
  });

  it("handles null/undefined", () => {
    expect(normalizeSpaces(null as any)).toBe("");
    expect(normalizeSpaces(undefined as any)).toBe("");
  });
});

describe("isUiLine", () => {
  it("returns true for empty string", () => {
    expect(isUiLine("")).toBe(true);
  });

  it("returns true for whitespace-only", () => {
    expect(isUiLine("   ")).toBe(true);
  });

  // Single-word UI elements
  it.each([
    "reply", "replies", "repost", "reposts", "quote", "quotes",
    "like", "likes", "view", "views", "share", "bookmark", "bookmarks",
    "follow", "following", "subscribe", "subscribed",
    "sign in", "log in", "create account", "show more", "show this thread",
  ])("recognizes '%s' as UI", (word) => {
    expect(isUiLine(word)).toBe(true);
  });

  it("recognizes numbers with optional suffix", () => {
    expect(isUiLine("123")).toBe(true);
    expect(isUiLine("1.5k")).toBe(true);
    expect(isUiLine("10M")).toBe(true);
    expect(isUiLine("2B")).toBe(true);
  });

  it("recognizes 'N replies' pattern", () => {
    expect(isUiLine("12 replies")).toBe(true);
    expect(isUiLine("3 reposts")).toBe(true);
    expect(isUiLine("1 like")).toBe(true);
    expect(isUiLine("100 views")).toBe(true);
  });

  it("does NOT flag real content as UI", () => {
    expect(isUiLine("This is a real tweet with meaningful content.")).toBe(false);
    expect(isUiLine("import os")).toBe(false);
    expect(isUiLine("print('hello')")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isUiLine("REPLY")).toBe(true);
    expect(isUiLine("Follow")).toBe(true);
  });
});
