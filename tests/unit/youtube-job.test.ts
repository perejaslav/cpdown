import { describe, expect, it } from "vitest";
import { isExpiredYouTubeJob, isTerminalYouTubeJobStatus, type BackgroundYouTubeJob } from "../../src/jobs/youtube-job";

function job(overrides: Partial<BackgroundYouTubeJob> = {}): BackgroundYouTubeJob {
  return {
    jobId: "job-1",
    sourceTabId: 1,
    sourceUrl: "https://example.com",
    videoUrl: "https://www.youtube.com/watch?v=abc",
    status: "waiting-page",
    createdAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
  };
}

describe("YouTube job lifecycle", () => {
  it("recognizes terminal statuses", () => {
    expect(isTerminalYouTubeJobStatus("completed")).toBe(true);
    expect(isTerminalYouTubeJobStatus("timeout")).toBe(true);
    expect(isTerminalYouTubeJobStatus("extracting")).toBe(false);
  });

  it("expires active jobs after 30 seconds", () => {
    expect(isExpiredYouTubeJob(job(), 30_999, 30_000)).toBe(false);
    expect(isExpiredYouTubeJob(job(), 31_000, 30_000)).toBe(true);
  });

  it("does not expire terminal jobs", () => {
    expect(isExpiredYouTubeJob(job({ status: "completed" }), 100_000, 30_000)).toBe(false);
  });
});
