import { describe, it, expect } from "vitest";
import { codeFence, normalizeLanguage } from "../../../src/lib/markdown/fence";

describe("normalizeLanguage", () => {
  it("maps sh to bash", () => {
    expect(normalizeLanguage("sh")).toBe("bash");
  });

  it("maps shell to bash", () => {
    expect(normalizeLanguage("shell")).toBe("bash");
  });

  it("maps yml to yaml", () => {
    expect(normalizeLanguage("yml")).toBe("yaml");
  });

  it("maps js to javascript", () => {
    expect(normalizeLanguage("js")).toBe("javascript");
  });

  it("lowercases and trims", () => {
    expect(normalizeLanguage("  Python  ")).toBe("python");
  });

  it("strips backticks and newlines from tag", () => {
    expect(normalizeLanguage("py\nthon`")).toBe("python");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeLanguage("")).toBe("");
  });
});

describe("codeFence", () => {
  it("wraps code in triple backticks with language", () => {
    const result = codeFence('print("hello")', "python");
    expect(result).toBe('```python\nprint("hello")\n```');
  });

  it("uses triple backticks when no backticks in content", () => {
    const result = codeFence("line1\nline2", "bash");
    expect(result).toContain("```bash\n");
    expect(result).toContain("line1\nline2");
    expect(result).toContain("\n```");
  });

  it("escalates to 4 backticks when content has ```", () => {
    const result = codeFence("```inner```", "txt");
    expect(result).toContain("````txt\n");
    expect(result).toContain("```inner```");
    expect(result).toContain("\n````");
  });

  it("escalates to 5 backticks when content has ````", () => {
    const result = codeFence("````inner````", "txt");
    expect(result).toContain("`````txt\n");
  });

  it("returns empty string for empty text", () => {
    expect(codeFence("", "python")).toBe("");
  });

  it("returns empty string for whitespace-only text", () => {
    expect(codeFence("   \n  ", "python")).toBe("");
  });

  it("preserves indentation of code lines", () => {
    const code = "def foo():\n    return 1";
    const result = codeFence(code, "python");
    expect(result).toContain("    return 1");
  });

  it("preserves empty lines in code", () => {
    const code = "line1\n\nline3";
    const result = codeFence(code, "");
    expect(result).toContain("line1\n\nline3");
  });
});
