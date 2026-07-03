/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { collectXcomPosts } from "../../../src/adapters/dom/xcom";
import { buildXcomMarkdown } from "../../../src/lib/xcom/markdown";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadFixture(name: string): Document {
  const html = readFileSync(
    resolve(__dirname, "../../fixtures/xcom", name),
    "utf-8"
  );
  return new DOMParser().parseFromString(html, "text/html");
}

describe("X.com full pipeline: HTML → Markdown", () => {
  it("produces valid markdown from a thread with code blocks", () => {
    const doc = loadFixture("thread-with-code.html");
    const posts = collectXcomPosts(doc);
    const md = buildXcomMarkdown({
      title: "Python API Tips",
      sourceUrl: "https://x.com/dev/status/42",
      posts,
    });

    // Header
    expect(md).toContain("# Python API Tips");
    expect(md).toContain("**Source:** https://x.com/dev/status/42");

    // Thread order preserved
    const idx1 = md.indexOf("Thread starter");
    const idx2 = md.indexOf("Follow-up");
    const idx3 = md.indexOf("Final note");
    expect(idx1).toBeLessThan(idx2);
    expect(idx2).toBeLessThan(idx3);

    // Code blocks preserved with language
    expect(md).toContain("```python");
    expect(md).toContain("import requests");
    expect(md).toContain("def fetch_data");
    expect(md).toContain("headers =");

    // UI noise ("like") filtered out
    const likeLines = md.split("\n").filter(l => l.trim() === "like");
    expect(likeLines).toHaveLength(0);

    // Posts separated by ---
    const separator1 = md.indexOf("---", idx1 + "Thread starter".length);
    expect(separator1).toBeGreaterThan(idx1);
    expect(separator1).toBeLessThan(idx2);
  });

  it("handles a single text post", () => {
    const doc = loadFixture("multi-post.html");
    const posts = collectXcomPosts(doc);
    const md = buildXcomMarkdown({
      title: "Test",
      sourceUrl: "https://x.com/a/status/1",
      posts,
    });
    expect(md).toContain("First post in the thread.");
    expect(md).toContain("Second post");
    expect(md).toContain("Short.");
  });

  it("handles empty document", () => {
    const doc = new DOMParser().parseFromString("<html><body></body></html>", "text/html");
    const posts = collectXcomPosts(doc);
    const md = buildXcomMarkdown({
      title: "Empty",
      sourceUrl: "",
      posts,
    });
    expect(md).toContain("# Empty");
  });
});
