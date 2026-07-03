import { describe, it, expect } from "vitest";
import { parsePotFromTimedTextUrl } from "../../../src/lib/youtube/pot";

describe("parsePotFromTimedTextUrl", () => {
  it("extracts pot from URL search params", () => {
    const url =
      "https://www.youtube.com/api/timedtext?v=abc123&pot=MPQXy123&fmt=json3";
    expect(parsePotFromTimedTextUrl(url)).toBe("MPQXy123");
  });

  it("returns null when pot param is absent", () => {
    const url = "https://www.youtube.com/api/timedtext?v=abc123&fmt=json3";
    expect(parsePotFromTimedTextUrl(url)).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(parsePotFromTimedTextUrl("not a url")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parsePotFromTimedTextUrl("")).toBeNull();
  });

  it("handles empty pot value", () => {
    const url = "https://www.youtube.com/api/timedtext?v=abc&pot=";
    expect(parsePotFromTimedTextUrl(url)).toBe("");
  });

  it("handles encoded characters in pot", () => {
    const url =
      "https://www.youtube.com/api/timedtext?v=abc&pot=abc%20def";
    expect(parsePotFromTimedTextUrl(url)).toBe("abc def");
  });
});
