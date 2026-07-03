/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { collectXcomPosts } from "../../../src/adapters/dom/xcom";

describe("heuristic code detection in DOM adapter", () => {
  it("detects unstructured Python code from language marker + lines", () => {
    const doc = new DOMParser().parseFromString(
      `
      <html><body><main>
        <article data-testid="tweet">
          <div data-testid="tweetText">
            <p>python</p>
            <p>import os</p>
            <p>print(os.getcwd())</p>
          </div>
        </article>
      </main></body></html>
    `,
      "text/html",
    );

    const posts = collectXcomPosts(doc);
    expect(posts).toHaveLength(1);
    const codeSeg = posts[0].find((s) => s.type === "code");
    expect(codeSeg).toBeDefined();
    expect(codeSeg!.type).toBe("code");
    if (codeSeg!.type === "code") {
      expect(codeSeg!.lang).toBe("python");
      expect(codeSeg!.code).toContain("import os");
    }
  });

  it("detects unstructured bash commands (3+ strong lines)", () => {
    const doc = new DOMParser().parseFromString(
      `
      <html><body><main>
        <article data-testid="tweet">
          <div data-testid="tweetText">
            <p>cd /tmp</p>
            <p>mkdir myproject</p>
            <p>git init</p>
          </div>
        </article>
      </main></body></html>
    `,
      "text/html",
    );

    const posts = collectXcomPosts(doc);
    expect(posts).toHaveLength(1);
    const codeSeg = posts[0].find((s) => s.type === "code");
    expect(codeSeg).toBeDefined();
  });

  it("preserves DOM order: text groups are independent", () => {
    // Text segments between non-text elements form separate groups.
    // Each group is checked independently, DOM order is preserved.
    const doc = new DOMParser().parseFromString(
      `
      <html><body><main>
        <article data-testid="tweet">
          <div data-testid="tweetText">
            <a href="https://example.com">docs</a>
            <p>python</p>
            <p>import os</p>
            <p>print(os.getcwd())</p>
            <a href="https://example.com">more</a>
          </div>
        </article>
      </main></body></html>
    `,
      "text/html",
    );

    const posts = collectXcomPosts(doc);
    expect(posts).toHaveLength(1);
    const segs = posts[0];
    // link, code (from heuristic), link — DOM order preserved
    expect(segs[0].type).toBe("link");
    expect(segs[1].type).toBe("code");
    expect(segs[2].type).toBe("link");
  });

  it("does NOT wrap single code line without context", () => {
    const doc = new DOMParser().parseFromString(
      `
      <html><body><main>
        <article data-testid="tweet">
          <div data-testid="tweetText">
            <p>import os</p>
          </div>
        </article>
      </main></body></html>
    `,
      "text/html",
    );

    const posts = collectXcomPosts(doc);
    expect(posts).toHaveLength(1);
    // Single line — should stay as text
    expect(posts[0][0].type).toBe("text");
  });

  it("does NOT convert normal prose to code", () => {
    const doc = new DOMParser().parseFromString(
      `
      <html><body><main>
        <article data-testid="tweet">
          <div data-testid="tweetText">
            <p>This is a normal paragraph about something interesting.</p>
            <p>It has multiple sentences and reads like prose.</p>
            <p>There is nothing code-like about these lines.</p>
          </div>
        </article>
      </main></body></html>
    `,
      "text/html",
    );

    const posts = collectXcomPosts(doc);
    expect(posts).toHaveLength(1);
    // All should be text
    expect(posts[0].every((s) => s.type === "text")).toBe(true);
  });

  it("does NOT touch existing <pre><code> blocks", () => {
    const doc = new DOMParser().parseFromString(
      `
      <html><body><main>
        <article data-testid="tweet">
          <div data-testid="tweetText">
            <p>python</p>
            <p>import os</p>
            <p>print(os.getcwd())</p>
            <pre><code class="language-bash">echo hi</code></pre>
          </div>
        </article>
      </main></body></html>
    `,
      "text/html",
    );

    const posts = collectXcomPosts(doc);
    expect(posts).toHaveLength(1);
    const segs = posts[0];
    // Should have: code(python heuristic), code(bash from pre)
    const codeSegs = segs.filter((s) => s.type === "code");
    expect(codeSegs.length).toBeGreaterThanOrEqual(2);
  });
});
