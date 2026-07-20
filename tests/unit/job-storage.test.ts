import { describe, expect, it } from "vitest";
import {
  putYouTubeJob,
  readYouTubeJobs,
  removeYouTubeJob,
  type SessionStorageArea,
} from "../../src/jobs/job-storage";
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

function createJob(jobId: string, workerTabId: number): BackgroundYouTubeJob {
  return {
    jobId,
    sourceTabId: workerTabId + 100,
    workerTabId,
    sourceUrl: `https://example.com/${jobId}`,
    videoUrl: `https://www.youtube.com/watch?v=${jobId}`,
    status: "waiting-page",
    createdAt: 1_000,
    updatedAt: 1_000,
  };
}

describe("YouTube job storage", () => {
  it("keeps three independent jobs", async () => {
    const storage = memoryStorage();
    await putYouTubeJob(createJob("a", 1), storage);
    await putYouTubeJob(createJob("b", 2), storage);
    await putYouTubeJob(createJob("c", 3), storage);

    const jobs = await readYouTubeJobs(storage);
    expect(Object.keys(jobs)).toEqual(["a", "b", "c"]);
    expect(jobs.b.workerTabId).toBe(2);
  });

  it("removes only the requested job", async () => {
    const storage = memoryStorage();
    await putYouTubeJob(createJob("a", 1), storage);
    await putYouTubeJob(createJob("b", 2), storage);

    await removeYouTubeJob("a", storage);
    const jobs = await readYouTubeJobs(storage);
    expect(Object.keys(jobs)).toEqual(["b"]);
  });
});
