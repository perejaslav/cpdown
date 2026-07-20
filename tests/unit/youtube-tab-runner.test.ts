import { describe, expect, it } from 'vitest';
import { YouTubeJobManager, type JobManagerStorage } from '../../src/jobs/job-manager';
import { YouTubeWorkerTabRunner, type TabsAdapter } from '../../src/jobs/youtube-tab-runner';
import type { BackgroundYouTubeJob } from '../../src/jobs/youtube-job';

function createStorage(): JobManagerStorage {
  const jobs = new Map<string, BackgroundYouTubeJob>();
  return {
    async get(jobId) { return jobs.get(jobId) ?? null; },
    async list() { return [...jobs.values()]; },
    async save(job) { jobs.set(job.jobId, job); },
    async remove(jobId) { jobs.delete(jobId); },
  };
}

describe('YouTubeWorkerTabRunner', () => {
  it('opens inactive tabs and closes only the finished job tab', async () => {
    let nextTabId = 100;
    const created: chrome.tabs.CreateProperties[] = [];
    const muted: number[] = [];
    const removed: number[] = [];
    const tabs: TabsAdapter = {
      async create(properties) {
        created.push(properties);
        return { id: nextTabId++ } as chrome.tabs.Tab;
      },
      async update(tabId) {
        muted.push(tabId);
        return { id: tabId } as chrome.tabs.Tab;
      },
      async remove(tabId) {
        removed.push(tabId);
      },
    };

    const manager = new YouTubeJobManager(createStorage());
    const runner = new YouTubeWorkerTabRunner(manager, tabs);
    const jobs = await Promise.all([
      runner.start({ sourceTabId: 1, sourceUrl: 'https://a.test', videoUrl: 'https://youtu.be/a' }),
      runner.start({ sourceTabId: 2, sourceUrl: 'https://b.test', videoUrl: 'https://youtu.be/b' }),
      runner.start({ sourceTabId: 3, sourceUrl: 'https://c.test', videoUrl: 'https://youtu.be/c' }),
    ]);

    expect(created.every((properties) => properties.active === false)).toBe(true);
    expect(muted).toEqual([100, 101, 102]);

    await runner.finish(jobs[1].jobId, 'completed');

    expect(removed).toEqual([101]);
    expect((await manager.list()).map((job) => job.workerTabId).sort()).toEqual([100, 102]);
  });
});
