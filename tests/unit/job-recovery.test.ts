import { describe, expect, it } from "vitest";
import { writeYouTubeJobs, type SessionStorageArea } from "../../src/jobs/job-storage";
import { recoverYouTubeJobs } from "../../src/jobs/job-recovery";
import type { BackgroundYouTubeJob } from "../../src/jobs/youtube-job";

function memoryStorage(): SessionStorageArea {
  const data: Record<string, unknown> = {};
  return {
    async get(key) {
      return { [key]: data[key] };
    },
    async set(items) {
      Object.assign(data, items);
    },
  };
}

function createJob(
  jobId: string,
  workerTabId: number,
  status: BackgroundYouTubeJob["status"] = "waiting-page",
  createdAt = 1_000,
): BackgroundYouTubeJob {
  return {
    jobId,
    sourceTabId: workerTabId + 100,
    workerTabId,
    sourceUrl: `https://example.com/${jobId}`,
    videoUrl: `https://www.youtube.com/watch?v=${jobId}`,
    status,
    createdAt,
    updatedAt: createdAt,
  };
}

describe("YouTube job recovery", () => {
  it("retains valid jobs and removes lost or expired jobs", async () => {
    const storage = memoryStorage();
    await writeYouTubeJobs(
      {
        active: createJob("active", 1),
        lost: createJob("lost", 2),
        expired: createJob("expired", 3, "waiting-page", 0),
        done: createJob("done", 4, "completed"),
      },
      storage,
    );

    const existing = new Set([1, 3, 4]);
    const closed: number[] = [];
    const result = await recoverYouTubeJobs({
      storage,
      now: 40_000,
      timeoutMs: 30_000,
      tabs: {
        async exists(tabId) {
          return existing.has(tabId);
        },
        async close(tabId) {
          closed.push(tabId);
        },
      },
    });

    expect(result.resumableJobs.map((job) => job.jobId)).toEqual(["active"]);
    expect(result.removedJobIds).toEqual(["lost", "expired", "done"]);
    expect(closed).toEqual([3, 4]);
  });
});
