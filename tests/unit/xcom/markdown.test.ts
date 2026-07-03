import { describe, it, expect } from "vitest";
import { buildXcomMarkdown } from "../../../src/lib/xcom/markdown";
import type { XcomSegment } from "../../../src/lib/xcom/segments";

describe("buildXcomMarkdown", () => {
  it("produces header with title and source URL", () => {
    const md = buildXcomMarkdown({
      title: "Test Post",
      sourceUrl: "https://x.com/user/status/123",
      posts: [[{ type: "text", text: "Hello world" }]],
    });
    expect(md).toContain("# Test Post");
    expect(md).toContain("**Source:** https://x.com/user/status/123");
  });

  it("renders text segments as paragraphs", () => {
    const md = buildXcomMarkdown({
      title: "T",
      sourceUrl: "https://x.com/a",
      posts: [
        [
          { type: "text", text: "First paragraph" },
          { type: "text", text: "Second paragraph" },
        ],
      ],
    });
    expect(md).toContain("First paragraph");
    expect(md).toContain("Second paragraph");
    // Posts should be separated
    expect(md.indexOf("First paragraph")).toBeLessThan(
      md.indexOf("Second paragraph"),
    );
  });

  it("renders code segments with fenced blocks", () => {
    const md = buildXcomMarkdown({
      title: "T",
      sourceUrl: "https://x.com/a",
      posts: [
        [
          { type: "text", text: "Before" },
          { type: "code", code: "print('hello')", lang: "python" },
          { type: "text", text: "After" },
        ],
      ],
    });
    expect(md).toContain("```python");
    expect(md).toContain("print('hello')");
    expect(md).toContain("Before");
    expect(md).toContain("After");
    // Before comes before code, code comes before After
    const beforeIdx = md.indexOf("Before");
    const codeIdx = md.indexOf("```python");
    const afterIdx = md.indexOf("After");
    expect(beforeIdx).toBeLessThan(codeIdx);
    expect(codeIdx).toBeLessThan(afterIdx);
  });

  it("renders link segments as markdown links", () => {
    const md = buildXcomMarkdown({
      title: "T",
      sourceUrl: "https://x.com/a",
      posts: [
        [{ type: "link", href: "https://example.com", label: "Example" }],
      ],
    });
    expect(md).toContain("[Example](https://example.com)");
  });

  it("separates multiple posts with horizontal rule", () => {
    const md = buildXcomMarkdown({
      title: "T",
      sourceUrl: "https://x.com/a",
      posts: [
        [{ type: "text", text: "Post one" }],
        [{ type: "text", text: "Post two" }],
      ],
    });
    expect(md).toContain("---");
    expect(md.indexOf("Post one")).toBeLessThan(md.indexOf("Post two"));
  });

  it("does not create empty sections for empty posts", () => {
    const md = buildXcomMarkdown({
      title: "T",
      sourceUrl: "https://x.com/a",
      posts: [
        [{ type: "text", text: "Real post" }],
        [], // empty post
        [{ type: "text", text: "Another real post" }],
      ],
    });
    // No double horizontal rules
    expect(md).not.toContain("\n\n---\n\n---\n\n");
    expect(md).toContain("Real post");
    expect(md).toContain("Another real post");
  });

  it("strips UI lines from text segments", () => {
    const md = buildXcomMarkdown({
      title: "T",
      sourceUrl: "https://x.com/a",
      posts: [
        [
          { type: "text", text: "Real content here" },
          { type: "text", text: "like" },
        ],
      ],
    });
    expect(md).toContain("Real content here");
    // "like" is a UI line — should not appear as a standalone line
    const lines = md.split("\n").filter((l) => l.trim() === "like");
    expect(lines).toHaveLength(0);
  });

  it("preserves indentation in code blocks", () => {
    const md = buildXcomMarkdown({
      title: "T",
      sourceUrl: "https://x.com/a",
      posts: [
        [
          {
            type: "code",
            code: "def foo():\n    return 1",
            lang: "python",
          },
        ],
      ],
    });
    expect(md).toContain("    return 1");
  });

  it("handles empty input gracefully", () => {
    const md = buildXcomMarkdown({
      title: "",
      sourceUrl: "",
      posts: [],
    });
    expect(md).toContain("# ");
    expect(typeof md).toBe("string");
  });
});
