import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("No CC-click guarantee (static analysis)", () => {
  const entrypointPath = resolve(__dirname, "../../../entrypoints/youtube-main.content.ts");

  it("does not contain .click() calls", () => {
    const content = readFileSync(entrypointPath, "utf-8");
    expect(content).not.toContain(".click(");
  });

  it("does not contain dispatchEvent", () => {
    const content = readFileSync(entrypointPath, "utf-8");
    expect(content).not.toContain("dispatchEvent");
  });

  it("does not query for CC button", () => {
    const content = readFileSync(entrypointPath, "utf-8");
    expect(content).not.toContain("ytp-subtitles-button");
    expect(content).not.toContain("captions-button");
  });

  it("does not reference MouseEvent or KeyboardEvent for simulation", () => {
    const content = readFileSync(entrypointPath, "utf-8");
    expect(content).not.toContain("MouseEvent");
    expect(content).not.toContain("KeyboardEvent");
  });
});

describe("Bridge client — no CC-click", () => {
  const clientPath = resolve(__dirname, "../../../entrypoints/youtube-bridge.content.ts");

  it("does not contain .click() calls", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).not.toContain(".click(");
  });

  it("does not contain dispatchEvent", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).not.toContain("dispatchEvent");
  });

  it("does not query for CC button selectors", () => {
    const content = readFileSync(clientPath, "utf-8");
    expect(content).not.toContain("ytp-subtitles");
    expect(content).not.toContain("captions-button");
  });
});
