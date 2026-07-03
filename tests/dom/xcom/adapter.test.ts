/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { collectXcomPosts } from "../../../src/adapters/dom/xcom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadFixture(name: string): Document {
  const html = readFileSync(
    resolve(__dirname, "../../fixtures/xcom", name),
    "utf-8"
  );
  const dom = new DOMParser().parseFromString(html, "text/html");
  return dom;
}

describe("collectXcomPosts", () => {
  it("preserves DOM order: first post stays first, short post stays last", () => {
    const doc = loadFixture("multi-post.html");
    const posts = collectXcomPosts(doc);
    expect(posts).toHaveLength(3);
    expect(posts[0]).toEqual([{ type: "text", text: "First post in the thread." }]);
    expect(posts[1]).toEqual([{ type: "text", text: "Second post, much longer than the first one with many more words to test ordering." }]);
    expect(posts[2]).toEqual([{ type: "text", text: "Short." }]);
  });

  it("does NOT sort by length or truncate to top-N", () => {
    const doc = loadFixture("multi-post.html");
    const posts = collectXcomPosts(doc);
    // All 3 posts preserved, even the short one
    expect(posts.length).toBeGreaterThanOrEqual(3);
  });

  it("detects <pre><code> and keeps it as code segment in position", () => {
    const doc = loadFixture("code-in-post.html");
    const posts = collectXcomPosts(doc);
    expect(posts).toHaveLength(1);
    const segments = posts[0];
    // Should have: text("Before code."), code(python), text("After code.")
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: "text", text: "Before code." });
    expect(segments[1]).toEqual({
      type: "code",
      code: "import os\ndef main():\n    return os.getcwd()",
      lang: "python",
    });
    expect(segments[2]).toEqual({ type: "text", text: "After code." });
  });

  it("deduplicates elements matching multiple selectors", () => {
    const doc = loadFixture("duplicate-nesting.html");
    const posts = collectXcomPosts(doc);
    // The div[lang] contains the same text as tweetText — should appear once
    expect(posts).toHaveLength(1);
  });

  it("returns empty array for empty document", () => {
    const doc = new DOMParser().parseFromString("<html><body></body></html>", "text/html");
    const posts = collectXcomPosts(doc);
    expect(posts).toEqual([]);
  });

  it("skips elements with only UI noise", () => {
    const doc = new DOMParser().parseFromString(`
      <html><body><main>
        <article data-testid="tweet">
          <div data-testid="tweetText"><p>like</p></div>
        </article>
      </main></body></html>
    `, "text/html");
    const posts = collectXcomPosts(doc);
    // "like" is a UI line — should be filtered out
    expect(posts).toHaveLength(0);
  });
});
