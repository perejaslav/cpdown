import { describe, expect, it } from 'vitest';
import { YouTubeJobManager, type JobManagerStorage } from '../../src/jobs/job-manager';
import type { BackgroundYouTubeJob } from '../../src/jobs/youtube-job';

function createMemoryStorage(): JobManagerStorage {
  const jobs = new Map<string, BackgroundYouTubeJob>();
  return {
    async get(jobId) {
      return jobs.get(jobId) ?? null;
    },
    async list() {
      return [...jobs.values()];
    },
    async save(job) {
      await Promise.resolve();
      jobs.set(job.jobId, job);
    },
    async remove(jobId) {
      jobs.delete(jobId);
    },
  };
}

function makeJob(jobId: string): BackgroundYouTubeJob {
  return {
    jobId,
    sourceTabId: 1,
    workerTabId: -1,
    sourceUrl: 'https://example.com',
    videoUrl: `https://www.youtube.com/watch?v=${jobId}`,
    status: 'opening-tab',
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('YouTubeJobManager', () => {
  it('serializes three concurrent creates without losing jobs', async () => {
    const manager = new YouTubeJobManager(createMemoryStorage());

    await Promise.all([
      manager.create(makeJob('one')),
      manager.create(makeJob('two')),
      manager.create(makeJob('three')),
    ]);

    expect((await manager.list()).map((job) => job.jobId).sort()).toEqual(['one', 'three', 'two']);
  });

  it('preserves immutable job identity fields during update', async () => {
    const manager = new YouTubeJobManager(createMemoryStorage());
    await manager.create(makeJob('one'));

    const updated = await manager.update('one', {
      status: 'waiting-page',
      workerTabId: 42,
    });

    expect(updated.jobId).toBe('one');
    expect(updated.createdAt).toBe(1);
    expect(updated.workerTabId).toBe(42);
  });
});
