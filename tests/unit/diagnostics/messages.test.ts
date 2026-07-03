import { describe, it, expect } from "vitest";
import { humanizeError } from "../../../src/lib/diagnostics/messages";

describe("humanizeError", () => {
  it("returns message for YOUTUBE_NO_CAPTIONS in English", () => {
    expect(humanizeError("YOUTUBE_NO_CAPTIONS")).toContain("No captions");
  });

  it("returns message for YOUTUBE_NO_CAPTIONS in Russian", () => {
    expect(humanizeError("YOUTUBE_NO_CAPTIONS", "ru")).toContain("субтитров");
  });

  it("returns message for YOUTUBE_PLAYER_TIMEOUT", () => {
    expect(humanizeError("YOUTUBE_PLAYER_TIMEOUT")).toContain("in time");
  });

  it("returns message for YOUTUBE_TRACK_NOT_FOUND", () => {
    expect(humanizeError("YOUTUBE_TRACK_NOT_FOUND")).toContain("suitable");
  });

  it("returns message for YOUTUBE_TIMEDTEXT_EMPTY", () => {
    expect(humanizeError("YOUTUBE_TIMEDTEXT_EMPTY")).toContain("empty");
  });

  it("returns a message for every diagnostic code", () => {
    const codes = [
      "TAB_RELOAD_REQUIRED", "PAGE_RESTRICTED",
      "YOUTUBE_NO_CAPTIONS", "YOUTUBE_PLAYER_TIMEOUT", "YOUTUBE_TRACK_NOT_FOUND",
      "YOUTUBE_TIMEDTEXT_EMPTY", "YOUTUBE_TIMEDTEXT_REQUEST_FAILED",
      "YOUTUBE_STALE_RESPONSE", "YOUTUBE_BRIDGE_INVALID_MESSAGE",
      "XCOM_NOT_FOUND", "COPY_FAILED", "STORAGE_FAILED",
    ] as const;
    for (const code of codes) {
      expect(humanizeError(code)).toBeTruthy();
      expect(humanizeError(code, "ru")).toBeTruthy();
    }
  });
});
