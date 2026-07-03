import { describe, it, expect } from "vitest";
import {
  detectLanguageMarker,
  looksLikeCodeLine,
  detectCodeBlock,
} from "../../../src/lib/xcom/code-detect";

describe("detectLanguageMarker", () => {
  it("detects 'python' as language marker", () => {
    expect(detectLanguageMarker("python")).toBe("python");
  });

  it("detects 'bash' as language marker", () => {
    expect(detectLanguageMarker("bash")).toBe("bash");
  });

  it("detects 'json' as language marker", () => {
    expect(detectLanguageMarker("json")).toBe("json");
  });

  it("detects 'yaml' as language marker", () => {
    expect(detectLanguageMarker("yaml")).toBe("yaml");
  });

  it("detects 'javascript' as language marker", () => {
    expect(detectLanguageMarker("javascript")).toBe("javascript");
  });

  it("detects 'js' as language marker", () => {
    expect(detectLanguageMarker("js")).toBe("javascript");
  });

  it("returns null for non-language text", () => {
    expect(detectLanguageMarker("This is a normal sentence.")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(detectLanguageMarker("")).toBeNull();
  });

  it("normalizes language tag", () => {
    expect(detectLanguageMarker("  Python  ")).toBe("python");
    expect(detectLanguageMarker("YML")).toBe("yaml");
  });
});

describe("looksLikeCodeLine", () => {
  it("detects import statement", () => {
    expect(looksLikeCodeLine("import os")).toBe(true);
  });

  it("detects function definition", () => {
    expect(looksLikeCodeLine("def main():")).toBe(true);
  });

  it("detects class definition", () => {
    expect(looksLikeCodeLine("class Foo:")).toBe(true);
  });

  it("detects const declaration", () => {
    expect(looksLikeCodeLine("const x = 1")).toBe(true);
  });

  it("detects curl command", () => {
    expect(looksLikeCodeLine("curl https://api.example.com")).toBe(true);
  });

  it("detects npm command", () => {
    expect(looksLikeCodeLine("npm install react")).toBe(true);
  });

  it("detects indented line", () => {
    expect(looksLikeCodeLine("    return value")).toBe(true);
  });

  it("detects line ending with {", () => {
    expect(looksLikeCodeLine("if (true) {")).toBe(true);
  });

  it("detects line ending with }", () => {
    expect(looksLikeCodeLine("}")).toBe(true);
  });

  it("detects assignment", () => {
    expect(looksLikeCodeLine('name = "value"')).toBe(true);
  });

  it("does NOT flag normal prose", () => {
    expect(looksLikeCodeLine("This is a normal sentence about something.")).toBe(false);
  });

  it("does NOT flag UI strings", () => {
    expect(looksLikeCodeLine("like")).toBe(false);
    expect(looksLikeCodeLine("repost")).toBe(false);
  });

  it("does NOT flag single name: value without code context", () => {
    // Single colon line — not enough context
    expect(looksLikeCodeLine("name: John")).toBe(false);
  });

  it("does NOT flag empty string", () => {
    expect(looksLikeCodeLine("")).toBe(false);
  });
});

describe("detectCodeBlock", () => {
  it("detects code block from language marker + 2 code lines (Path A)", () => {
    const lines = ["python", "import os", "print(os.getcwd())"];
    const result = detectCodeBlock(lines);
    expect(result.isCode).toBe(true);
    expect(result.lang).toBe("python");
  });

  it("detects code block from 3+ consecutive strong indicator lines (Path B)", () => {
    const lines = [
      "import requests",
      "def fetch(url):",
      "    return requests.get(url)",
    ];
    const result = detectCodeBlock(lines);
    expect(result.isCode).toBe(true);
  });

  it("detects bash commands (Path B)", () => {
    const lines = [
      "cd /tmp",
      "mkdir myproject",
      "git init",
    ];
    const result = detectCodeBlock(lines);
    expect(result.isCode).toBe(true);
  });

  it("detects JSON block (Path A)", () => {
    const lines = ["json", '{ "name": "test" }', '{ "value": 123 }'];
    const result = detectCodeBlock(lines);
    expect(result.isCode).toBe(true);
    expect(result.lang).toBe("json");
  });

  it("detects YAML block (Path A)", () => {
    const lines = ["yaml", "name: test", "value: 123"];
    const result = detectCodeBlock(lines);
    expect(result.isCode).toBe(true);
    expect(result.lang).toBe("yaml");
  });

  it("does NOT detect normal paragraph as code", () => {
    const lines = [
      "This is a normal paragraph about something interesting.",
      "It has multiple sentences and reads like prose.",
      "There is nothing code-like about these lines.",
    ];
    const result = detectCodeBlock(lines);
    expect(result.isCode).toBe(false);
  });

  it("does NOT detect UI strings as code", () => {
    const lines = ["like", "repost", "12 replies"];
    const result = detectCodeBlock(lines);
    expect(result.isCode).toBe(false);
  });

  it("does NOT detect single colon line as code", () => {
    const lines = ["name: John"];
    const result = detectCodeBlock(lines);
    expect(result.isCode).toBe(false);
  });

  it("detects mixed post: text → code → text", () => {
    // This tests the integration — the adapter should split this into:
    // text("Intro."), code(python block), text("Outro.")
    const lines = [
      "Here's a useful snippet:",
      "python",
      "import os",
      "print(os.getcwd())",
      "Works great!",
    ];
    // The detectCodeBlock function works on a sliding window
    // It should detect lines 1-3 as code (language marker + 2 lines)
    const result = detectCodeBlock(lines.slice(1, 4));
    expect(result.isCode).toBe(true);
    expect(result.lang).toBe("python");
  });

  it("requires at least 2 lines after language marker (Path A)", () => {
    const lines = ["python", "import os"];
    const result = detectCodeBlock(lines);
    // Only 1 line after marker — not enough
    expect(result.isCode).toBe(false);
  });

  it("requires at least 3 consecutive strong lines (Path B)", () => {
    const lines = ["import os", "def main():"];
    const result = detectCodeBlock(lines);
    // Only 2 strong lines — not enough
    expect(result.isCode).toBe(false);
  });
});
